import { z } from "zod";
import { generateObject, generateText } from "ai";
import { CourseAIOutputSchema, QuizAIOutputSchema } from "../schema/course";
import { keyManager } from "./key-manager.service";

export class AiService {
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 18000): Promise<T> {
    let retries = 0;
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        const isRateLimit = error?.statusCode === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("rate limit");
        if (!isRateLimit || retries >= maxRetries) {
          throw error;
        }
        retries++;
        console.warn(`[AI Rate Limit] Retrying in ${delayMs / 1000}s... (Attempt ${retries}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async generateCurriculum(topic: string, level: string, hoursPerDay: number, sourceContext?: string, userId?: string) {
    const { client, modelId } = await keyManager.getCurriculumClient(userId);
    
    let promptStr = `You are an expert curriculum designer. 
      Create a comprehensive, engaging course on the topic: "${topic}".
      The target audience is at a ${level} level.
      The course should be designed to be completed with ${hoursPerDay} hours of study per day.
      
      Ensure the modules logically progress from foundational to advanced concepts appropriate for the level.
      Each lesson should have an estimated completion time between 15 and 60 minutes.
      Provide a highly optimized YouTube search query for each lesson that will yield the best educational video. 
      IMPORTANT: The search query MUST be highly specific to the exact technical concepts of the lesson. Do not use generic terms.`;

    if (sourceContext && sourceContext.trim().length > 0) {
      promptStr += `\n\nIMPORTANT: The user has provided the following source material. You MUST base the curriculum heavily on this exact source material, extracting the core concepts directly from it:\n\n<source_material>\n${sourceContext}\n</source_material>`;
    }

    const { object } = await this.withRetry(() => generateObject({
      model: client(modelId),
      schema: CourseAIOutputSchema,
      prompt: promptStr,
    }));

    return object;
  }

  async generateQuiz(topicTitle: string, topicDescription: string, isRetake: boolean = false, userId?: string) {
    const { client, modelId } = await keyManager.getQuizClient(userId);

    const { object } = await this.withRetry(() => generateObject({
      model: client(modelId),
      schema: QuizAIOutputSchema,
      prompt: `You are an expert educator.
      Create a 5-question multiple choice quiz for a lesson titled "${topicTitle}".
      Lesson description: "${topicDescription}".
      
      ${isRetake ? "This is a retake. Ensure the questions are completely different from standard or obvious questions, but still test the same core concepts." : ""}
      
      The questions should test the core concepts implied by the title and description.
      Provide 4 plausible options for each question.
      Include a short, encouraging explanation for the correct answer.`,
    }));

    return object;
  }

  async generateArticle(topicTitle: string, topicDescription: string, userId?: string, videoTranscript?: string) {
    const { client, modelId } = await keyManager.getDeepDiveClient(userId);

    let promptStr = `You are an expert educator and technical writer.
      Write a comprehensive "Deep Dive" article for a lesson titled "${topicTitle}".
      Lesson description: "${topicDescription}".
      
      The article should be written in clean, engaging Markdown.
      Include sections like "Introduction", "Core Concepts", "Examples", and "Summary".
      Make it highly structured with headings, bullet points, and code snippets or formatting where appropriate.
      DO NOT include a generic greeting or conclusion like "Here is your article". Output ONLY the Markdown content.`;

    if (videoTranscript) {
      promptStr += `\n\nCRITICAL CONTEXT:
      You have been provided with the actual closed captions/transcript of a YouTube video related to this lesson. 
      Whenever you explain a core concept, embed a markdown link to the exact timestamp in the video where it is discussed.
      Use the format: [MM:SS](#t=SECONDS)
      For example, if a concept is discussed at 01:23, output: [01:23](#t=83)
      If it's at 05:00, output: [05:00](#t=300)
      
      Here is the transcript (timestamps are in [MM:SS] format):
      ${videoTranscript}`;
    }

    const { text } = await this.withRetry(() => generateText({
      model: client(modelId),
      prompt: promptStr,
    }));

    return text;
  }

  async evaluateCourseViolation(courseTitle: string, courseDesc: string, reportReason: string, userId?: string) {
    const { client, modelId } = await keyManager.getQuizClient(userId); // Use fast/cheap client for moderation
    
    const { object } = await this.withRetry(() => generateObject({
      model: client(modelId),
      schema: z.object({
        isViolating: z.boolean().describe("True if the course content or report suggests a violation of community policies (Adult, Hate, Inaccurate, IP violation)"),
        confidence: z.number().describe("0.0 to 1.0 confidence in this assessment"),
        reasoning: z.string().describe("Brief explanation of the decision"),
      }),
      prompt: `You are a strict community moderator AI.
      A user has reported a course for: "${reportReason}".
      
      Course Title: "${courseTitle}"
      Course Description: "${courseDesc}"
      
      Policies:
      1. No Adult/Vulgar Content
      2. Must have educational value/accuracy
      3. No Hate Speech or Harassment
      4. Respect Intellectual Property
      
      Determine if this course actually violates these policies based on the available text and the reporter's claim.
      If it clearly violates or strongly appears to violate, mark isViolating as true.`,
    }));

    return object;
  }
}

export const aiService = new AiService();

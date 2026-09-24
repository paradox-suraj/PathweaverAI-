import { z } from "zod";
import { generateObject, generateText } from "ai";
import { CourseAIOutputSchema, QuizAIOutputSchema } from "../schema/course";
import { keyManager } from "./key-manager.service";

export interface ArticleGenerationParams {
  topicTitle: string;
  topicDescription: string;
  lessonType: string;
  learnerLevel: string;
  objectives: string[];
  keyConcepts: string[];
  prerequisites: string[];
  practicalOutcome?: string;
  videoTranscript?: string;
  videoMetadata?: { title: string; channelName: string };
  previousTopicTitle?: string;
  nextTopicTitle?: string;
  missingObjectivesToFix?: string[];
}

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

  // ---------------------------------------------------------------------------
  // Curriculum generation prompt synthesizing measurable objectives,
  // key concepts, practical outcomes, and multi-intent search queries.
  // ---------------------------------------------------------------------------
  async generateCurriculum(topic: string, level: string, hoursPerDay: number, sourceContext?: string, userId?: string) {
    const { client, modelId } = await keyManager.getCurriculumClient(userId);

    let promptStr = `You are an expert curriculum designer and instructional designer.
Create a comprehensive, engaging course on the topic: "${topic}".
The target audience is at a ${level} level.
The course should be designed for ${hoursPerDay} hours of study per day.

Modules must progress logically from foundational to advanced concepts.
Each lesson should have an estimated completion time between 15 and 60 minutes.

═══════════════════════════════════════════
PER-LESSON REQUIRED FIELDS — read carefully
═══════════════════════════════════════════

## searchQuery (existing field — keep populating)
A single highly specific YouTube search query for the lesson. Leave empty for MODULE_QUIZ and CODE_CHALLENGE.

## searchQueries (NEW — REQUIRED for LESSON type, empty array for others)
Generate 3–5 search queries, each with a DISTINCT intent. Use exactly these intent values:
  - "beginner_explainer"         — gentle intro for a ${level} learner
  - "practical_applied"          — hands-on tutorial or project walkthrough
  - "concept_deep_dive"          — thorough theory-first explanation
  - "comparison_troubleshooting" — compares alternatives or addresses common errors
  - "visual_alternative"         — animation-based, diagram-heavy, or different framing

CRITICAL: Queries must NOT be paraphrases of each other. Each should surface genuinely different videos.

Example for "JavaScript Closures" at beginner level:
  { intent: "beginner_explainer",          query: "what is a closure in JavaScript explained simply" }
  { intent: "practical_applied",           query: "JavaScript closures real-world examples counter factory" }
  { intent: "concept_deep_dive",           query: "JavaScript closures scope chain lexical environment theory" }
  { intent: "comparison_troubleshooting",  query: "JavaScript closure vs class private variable when to use" }
  { intent: "visual_alternative",          query: "JavaScript closures animated diagram visual explanation" }

## objectives (NEW — REQUIRED for all lesson types)
Write 1–5 measurable learning objectives per lesson.
Each MUST start with an action verb. NEVER use "understand", "learn", or "know" as the opener.
Approved verbs: can define, can explain, can write, can build, can identify, can compare, can debug, can implement, can refactor, can distinguish, can trace, can predict.

WRONG: "Understand closures"
RIGHT: "can explain why a closure retains access to its outer scope variables after the outer function returns"

WRONG: "Learn React hooks"
RIGHT: "can implement useState and useEffect to manage component state and side-effects in a functional component"

## prerequisites
List the specific prior knowledge assumed for this lesson (not the whole course — just this lesson).
Use concrete statements like "can declare a JavaScript variable" not vague terms like "basic JS".

## keyConcepts
List 3–8 core concepts this lesson introduces or reinforces. Use noun phrases (e.g. "lexical scope", "event loop", "memoization").

## practicalOutcome
One precise sentence: what can the learner concretely build, do, or solve immediately after this lesson?
Example: "Can write a factory function that uses a closure to maintain private counter state."

## assessmentIntent
One sentence: how will mastery of this specific lesson be tested in the module quiz?
Example: "Quiz will ask the learner to trace variable scope in a closure and predict the output."

## isVolatileTopic
Set to TRUE for: JavaScript/TypeScript frameworks (React, Vue, Next.js, Svelte), cloud APIs (AWS, GCP, Azure), LLM/AI tooling, Docker/Kubernetes, any technology where a 2-year-old tutorial is likely outdated.
Set to FALSE for: algorithms, data structures, math, SQL fundamentals, core CS theory, OS concepts, networking fundamentals, design patterns.

═══════════════════════════════════════════
LESSON TYPE RULES (unchanged from before)
═══════════════════════════════════════════
At the end of EVERY module, add a lesson with type "MODULE_QUIZ" to test the user's knowledge.
If the topic "${topic}" relates to programming/CS, intersperse "CODE_CHALLENGE" lessons where appropriate, specifying "codeLanguage".`;

    if (sourceContext && sourceContext.trim().length > 0) {
      promptStr += `\n\nIMPORTANT: The user has provided the following source material. Base the curriculum heavily on this exact content:\n\n<source_material>\n${sourceContext}\n</source_material>`;
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

  async generateArticle(params: ArticleGenerationParams, userId?: string) {
    const { client, modelId } = await keyManager.getDeepDiveClient(userId);

    let promptStr = `You are an expert educator and technical writer.
      Write a highly detailed, comprehensive educational article covering the topic: "${params.topicTitle}".
      Topic Description: "${params.topicDescription}"
      Lesson Type: ${params.lessonType}
      Target Learner Level: ${params.learnerLevel}
`;

    if (params.objectives.length) promptStr += `\nLearning Objectives:\n- ${params.objectives.join("\n- ")}`;
    if (params.keyConcepts.length) promptStr += `\nKey Concepts:\n- ${params.keyConcepts.join("\n- ")}`;
    if (params.prerequisites.length) promptStr += `\nPrerequisites:\n- ${params.prerequisites.join("\n- ")}`;
    if (params.practicalOutcome) promptStr += `\nPractical Outcome: ${params.practicalOutcome}`;
    if (params.previousTopicTitle) promptStr += `\nPrevious Lesson Context: "${params.previousTopicTitle}"`;
    if (params.nextTopicTitle) promptStr += `\nNext Lesson Context: "${params.nextTopicTitle}"`;

    promptStr += `
      The article should be written in Markdown format.
      Make it engaging, well-structured with headings (H1, H2, H3), and easy to read.
      Use bullet points, bold text for emphasis, and include relevant code snippets if applicable.
      
      Adapt your structure to the Lesson Type. For example:
      - If STANDARD, focus on deep-dive conceptual explanation and walkthroughs.
      - If CODE_CHALLENGE, focus on setting up the problem, giving hints, and explaining the solution approach.
      - If MODULE_QUIZ, focus on summarizing key points as a study guide.
      - If REVIEW, focus on synthesizing previous concepts.
      - If PROJECT, focus on architecture, real-world context, and step-by-step assembly.

${params.missingObjectivesToFix && params.missingObjectivesToFix.length > 0 ? `
      > [!CRITICAL CORRECTION]
      > A previous version of this article FAILED to cover the following required learning objectives:
      > ${params.missingObjectivesToFix.map(obj => `- ${obj}`).join("\n      > ")}
      > You MUST explicitly and thoroughly teach these concepts in this revised version.
` : ''}
      IMPORTANT: Use Mermaid.js diagrams to visually explain complex concepts, architectures, or workflows. ONLY generate a Mermaid diagram if it genuinely clarifies something structural (e.g. system architecture, flowcharts, state machines, database schemas). DO NOT force a diagram if it is trivial or unnecessary.
      DO NOT include a generic greeting or conclusion like "Here is your article". Output ONLY the Markdown content.`;

    if (params.videoTranscript) {
      promptStr += `\n\nCRITICAL CONTEXT:
      You have been provided with the actual closed captions/transcript of a YouTube video related to this lesson. 
      Whenever you explain a core concept that is explicitly covered in the transcript, embed a markdown link to the exact timestamp in the video where it is discussed.
      Use the format: [MM:SS](#t=SECONDS)
      For example, if a concept is discussed at 01:23, output: [01:23](#t=83)
      If it's at 05:00, output: [05:00](#t=300)
      
      WARNING: ONLY cite a timestamp when it maps to an actual segment you have in this transcript. DO NOT guess offsets or invent timestamps for concepts not explicitly spoken about.

      ${params.videoMetadata ? `Video Source: "${params.videoMetadata.title}" (${params.videoMetadata.channelName})` : ""}

      Transcript (timestamps are in [MM:SS] format):
      ${params.videoTranscript}`;
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

  async generateWatchPartyResponse(question: string, videoTranscript: string | null, userId?: string) {
    const { client, modelId } = await keyManager.getDeepDiveClient(userId);

    let promptStr = `You are an enthusiastic teaching assistant named "AI Co-Host" in a live learning watch party.
      A participant just asked this question: "${question}"

      Answer their question concisely and helpfully in plain text or simple markdown.
      Be friendly, engaging, and brief (max 2-3 short paragraphs).`;

    if (videoTranscript) {
      promptStr += `\n\nCRITICAL CONTEXT:
      Here is the transcript of the video they are currently watching:
      ${videoTranscript}
      
      Use this transcript to provide specific, highly relevant answers based on what is being taught.`;
    }

    const { text } = await this.withRetry(() => generateText({
      model: client(modelId),
      prompt: promptStr,
    }));

    return text;
  }
}

export const aiService = new AiService();

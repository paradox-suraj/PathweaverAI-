/**
 * Curriculum & Instructional Quality Evaluation Service
 *
 * Evaluates candidate video transcripts and generated article notes against
 * lesson pedagogical objectives to guarantee instructional quality and relevance.
 */

import { z } from "zod";
import { generateObject } from "ai";
import { keyManager } from "./key-manager.service";
import {
  MIN_RELEVANCE,
  MIN_OBJECTIVE_COVERAGE,
  MIN_EDUCATIONAL_QUALITY,
  MIN_TRANSCRIPT_QUALITY,
} from "../config/generation.config";

export const VideoEvaluationSchema = z.object({
  relevanceScore: z.number().min(0).max(1).describe("Score for overall relevance to the lesson topic"),
  objectiveCoverageScore: z.number().min(0).max(1).describe("Score for how well the specific objectives are covered"),
  educationalQualityScore: z.number().min(0).max(1).describe("Score for instructional quality (is it a good teacher?)"),
  learnerLevelFitScore: z.number().min(0).max(1).describe("Score for whether it matches the expected difficulty/learner level"),
  clarityScore: z.number().min(0).max(1).describe("Score for clarity of explanation"),
  completenessScore: z.number().min(0).max(1).describe("Score for whether the concepts are fully explained vs superficially mentioned"),
  transcriptQualityScore: z.number().min(0).max(1).describe("Score for the transcript itself (penalize garbage, vlog chatter, or incoherence)"),
  freshnessConcern: z.boolean().describe("True if the video feels severely outdated for the topic"),
  duplicateConceptRisk: z.boolean().describe("True if the video spends too much time on unrelated or overly basic prerequisites"),
  recommendation: z.enum(["ACCEPT", "REJECT", "REVIEW"]).describe("Final recommendation based on scores"),
  missingObjectives: z.array(z.string()).describe("List of lesson objectives this video completely misses"),
  strengths: z.array(z.string()).describe("List of strong points of this video"),
  weaknesses: z.array(z.string()).describe("List of weak points or issues"),
  reasoning: z.string().describe("A brief explanation of the scores and recommendation"),
});

export type VideoEvaluationResult = z.infer<typeof VideoEvaluationSchema>;

export const LessonArticleEvaluationSchema = z.object({
  objectiveCoverageScore: z.number().min(0).max(1).describe("Score for how well the generated article covers the required learning objectives"),
  missingObjectives: z.array(z.string()).describe("List of learning objectives that are missing or insufficiently covered"),
  approved: z.boolean().describe("True if the article adequately covers the objectives and is of high quality"),
  reasoning: z.string().describe("A brief explanation of the evaluation"),
});

export type LessonArticleEvaluationResult = z.infer<typeof LessonArticleEvaluationSchema>;

export const CourseEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(1),
  curriculumScore: z.number().min(0).max(1),
  resourceQualityScore: z.number().min(0).max(1),
  progressionScore: z.number().min(0).max(1),
  objectiveCoverageScore: z.number().min(0).max(1),
  redundancyScore: z.number().min(0).max(1),
  assessmentAlignmentScore: z.number().min(0).max(1),
  issues: z.array(z.string()).describe("List of overarching issues with the course"),
  recommendedFixes: z.array(z.object({
    topicId: z.string().describe("The ID of the specific lesson/topic that needs regeneration"),
    reason: z.string().describe("Why this specific topic needs to be regenerated"),
  })).describe("List of specific topics that MUST be regenerated to fix the issues"),
  approved: z.boolean().describe("True if the course is approved as a whole and requires no targeted regeneration"),
});

export type CourseEvaluationResult = z.infer<typeof CourseEvaluationSchema>;

export interface EvaluationContext {
  lessonTitle: string;
  lessonDescription: string;
  objectives: string[];
  keyConcepts: string[];
  learnerLevel: string; // Target difficulty level (e.g. Beginner, Intermediate, Advanced)
  practicalOutcome: string;
  transcript: string;
  videoTitle: string;
}

export class AiEvaluatorService {
  /**
   * Generates a structured evaluation for a given candidate video transcript.
   */
  async evaluateTranscript(
    context: EvaluationContext,
    userId?: string
  ): Promise<VideoEvaluationResult> {
    const { client, modelId } = await keyManager.getCurriculumClient(userId);

    const systemPrompt = `You are a strict, expert instructional designer and curriculum quality gatekeeper.
Your job is to evaluate whether a specific YouTube video transcript is a high-quality instructional resource for a given lesson.

IMPORTANT: Do not just ask "is this a good video?". Ask specifically: "does this source teach THIS objective to THIS learner level?".

You must reject transcripts that are:
- Too short, incoherent, or garbage auto-generated captions.
- Mostly non-instructional (e.g., vlog chatter, self-promotion, excessive tangents).
- Just superficial mentions of the key concepts rather than deep explanations.
- Overly basic for an advanced learner, or too dense for a beginner.

Provide honest, harsh scores from 0.0 to 1.0. We prefer NO RESOURCE over a WRONG RESOURCE.

LESSON CONTEXT:
Title: ${context.lessonTitle}
Description: ${context.lessonDescription}
Objectives: ${context.objectives.join(", ")}
Key Concepts: ${context.keyConcepts.join(", ")}
Learner Level / Target Audience: ${context.learnerLevel}
Practical Outcome: ${context.practicalOutcome}`;

    const userPrompt = `Evaluate the following video candidate.

VIDEO METADATA:
Title: ${context.videoTitle}

TRANSCRIPT:
${context.transcript}
`;

    // Add basic retry logic inside this call, similar to ai.service.ts
    return this.withRetry(async () => {
      const { object } = await generateObject({
        model: client(modelId),
        schema: VideoEvaluationSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.2, // Low temp for more deterministic evaluation
      });
      return object;
    });
  }

  /**
   * Helper to check if the evaluation passes the hard gates.
   */
  passesHardGates(evalResult: VideoEvaluationResult): boolean {
    if (evalResult.relevanceScore < MIN_RELEVANCE) return false;
    if (evalResult.objectiveCoverageScore < MIN_OBJECTIVE_COVERAGE) return false;
    if (evalResult.educationalQualityScore < MIN_EDUCATIONAL_QUALITY) return false;
    if (evalResult.transcriptQualityScore < MIN_TRANSCRIPT_QUALITY) return false;
    if (evalResult.recommendation === "REJECT") return false;
    return true;
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 5000): Promise<T> {
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
        console.warn(`[AI Evaluator Rate Limit] Retrying in ${delayMs / 1000}s... (Attempt ${retries}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Generates a structured evaluation of a generated lesson article against its objectives.
   */
  async evaluateArticleCoverage(
    articleContent: string,
    objectives: string[],
    lessonTitle: string,
    userId?: string
  ): Promise<LessonArticleEvaluationResult> {
    const { client, modelId } = await keyManager.getCurriculumClient(userId);

    const systemPrompt = `You are an expert instructional evaluator.
Your job is to read an AI-generated lesson article and determine if it successfully teaches the required learning objectives.
Be strict. If a learning objective is not explicitly and thoroughly taught, list it as missing.`;

    const promptStr = `
Lesson Title: "${lessonTitle}"

Required Learning Objectives:
${objectives.map(obj => `- ${obj}`).join('\n')}

Generated Article Content:
${articleContent.substring(0, 15000)} // truncate to save tokens, usually objectives are spread out but this is a reasonable limit
`;

    const { object } = await generateObject({
      model: client(modelId),
      schema: LessonArticleEvaluationSchema,
      system: systemPrompt,
      prompt: promptStr,
    });

    return object;
  }

  /**
   * Generates a structured evaluation of the entire generated course.
   */
  async evaluateFullCourse(
    courseData: any, // We will pass a simplified representation of the course
    userId?: string
  ): Promise<CourseEvaluationResult> {
    const { client, modelId } = await keyManager.getCurriculumClient(userId);

    const systemPrompt = `You are an expert curriculum director.
Your job is to review a completely generated course, including all its modules, lessons, and generated resources (articles).
You must evaluate the overall progression, redundancy, and quality. 
If the course fails to meet high standards, set 'approved' to false and explicitly list the 'topicId' of any specific lessons that need to be regenerated in 'recommendedFixes'.`;

    const promptStr = `
Course Data:
${JSON.stringify(courseData, null, 2).substring(0, 30000)} // Truncate if necessary
`;

    const { object } = await generateObject({
      model: client(modelId),
      schema: CourseEvaluationSchema,
      system: systemPrompt,
      prompt: promptStr,
    });

    return object;
  }
}

export const aiEvaluatorService = new AiEvaluatorService();

import { pipeline, env, QuestionAnsweringPipeline } from '@xenova/transformers';

// Skip local checks so it doesn't fail trying to read local models when deployed
env.allowLocalModels = false;
env.useBrowserCache = false;

// Create a singleton instance to prevent multiple models from loading simultaneously in dev mode
class QAPipelineSingleton {
  static task = 'question-answering' as const;
  static model = 'Xenova/distilbert-base-cased-distilled-squad';
  static instance: Promise<QuestionAnsweringPipeline> | null = null;

  static async getInstance(): Promise<QuestionAnsweringPipeline> {
    if (this.instance === null) {
      // Create the pipeline Promise
      this.instance = pipeline(this.task, this.model) as Promise<QuestionAnsweringPipeline>;
    }
    return this.instance;
  }
}

/**
 * Attempts to extract an answer from the provided context using a local ML model.
 * Returns the answer if the confidence score is above a threshold, otherwise null.
 */
export async function getLocalAnswer(question: string, context: string): Promise<string | null> {
  if (!question || !context) return null;
  
  try {
    const qaPipeline = await QAPipelineSingleton.getInstance();
    
    // The pipeline returns { answer, score, start, end } or an array — we always send one question
    const result = (await qaPipeline(question, context)) as { answer: string; score: number };
    
    // We only want to rely on the local model if it's reasonably confident.
    // A score threshold of 0.05 to 0.5 is usually good for this model.
    if (result.score > 0.05) {
      return result.answer;
    }
    
    return null; // Not confident enough, fallback needed
  } catch (error) {
    console.error("Local QA Pipeline Error:", error);
    return null; // Fallback to Gemini if the local pipeline fails
  }
}

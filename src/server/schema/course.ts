import { z } from "zod";

export const CourseGenerationSchema = z.object({
  topic: z.string().min(3).max(100),
  level: z.string().min(1),
  hoursPerDay: z.number().min(1).max(12),
  deadlineDate: z.string().optional(),
  sourceType: z.enum(['text', 'url', 'pdf', 'playlist']).optional(),
  sourceContent: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

export type CourseGenerationInput = z.infer<typeof CourseGenerationSchema>;

export const CourseFormSchema = z.object({
  topic: z.string().min(3).max(100),
  level: z.string().min(1),
  hoursPerDay: z.coerce.number().min(1).max(12),
});

// ---------------------------------------------------------------------------
// Per-lesson search query with distinct pedagogical intent
// ---------------------------------------------------------------------------
export const SearchQueryIntentSchema = z.enum([
  'beginner_explainer',          // gentle intro pitched at the target learner level
  'practical_applied',           // hands-on tutorial or project walkthrough
  'concept_deep_dive',           // theory-heavy, thorough explanation
  'comparison_troubleshooting',  // compares alternatives or fixes common errors
  'visual_alternative',          // animation, diagram-based, or different framing
]);

export type SearchQueryIntent = z.infer<typeof SearchQueryIntentSchema>;

export const LessonSearchQuerySchema = z.object({
  intent: SearchQueryIntentSchema.describe(
    "Distinct pedagogical intent — must differ across all queries in the list"
  ),
  query: z.string().min(5).describe(
    "Specific YouTube search query optimised for this intent and this exact lesson topic"
  ),
});

export type LessonSearchQuery = z.infer<typeof LessonSearchQuerySchema>;

// ---------------------------------------------------------------------------
// Measurable objective validator
// Rejects vague openers like "understand", "learn", "know", "appreciate"
// ---------------------------------------------------------------------------
const VAGUE_OBJECTIVE_WORDS = ['understand', 'learn', 'know', 'appreciate', 'be aware'];

const ObjectiveSchema = z.string()
  .min(10)
  .refine(
    (s) => !VAGUE_OBJECTIVE_WORDS.some((w) => s.toLowerCase().startsWith(w)),
    {
      message:
        "Objective must start with a measurable verb (can define, can explain, can write, can build, can identify…), not 'understand' or 'learn'",
    }
  );

// ---------------------------------------------------------------------------
// Main AI output schema
// Fields use .optional().default() for backward compatibility.
// ---------------------------------------------------------------------------
export const CourseAIOutputSchema = z.object({
  title: z.string().describe("A catchy, professional title for the course"),
  description: z.string().describe("A 2-sentence summary of what the course covers"),
  modules: z.array(
    z.object({
      title: z.string().describe("Title of the module"),
      order: z.number().describe("Sequential order of the module, starting from 1"),
      lessons: z.array(
        z.object({
          // ── Core fields ────────────────────────────────────────────────────
          type: z.enum(['STANDARD', 'MODULE_QUIZ', 'CODE_CHALLENGE', 'REVIEW', 'PROJECT'])
            .default('STANDARD')
            .describe(
              "Type of lesson. Add one MODULE_QUIZ at the end of each module. Add CODE_CHALLENGE lessons only for programming courses."
            ),
          title: z.string().describe("Title of the lesson"),
          description: z.string().describe("Brief description of the lesson content"),
          estimatedMins: z.number().describe(
            "Estimated time to complete the lesson in minutes (usually between 10 and 60)"
          ),
          // Legacy single-query field — kept so playlist-sourced courses
          // (which skip the search pipeline) still work without changes.
          searchQuery: z.string().describe(
            "Primary YouTube search query for this lesson. If type is MODULE_QUIZ or CODE_CHALLENGE, leave empty."
          ),
          codeLanguage: z.string().optional().describe(
            "If type is CODE_CHALLENGE, specify the programming language (e.g. javascript, python)"
          ),

          // ── Pedagogical & Curriculum Metadata ──────────────────────────────
          objectives: z.array(ObjectiveSchema)
            .min(0).max(5)
            .optional()
            .default([])
            .describe(
              "1–5 MEASURABLE learning objectives. Each must start with an action verb: " +
              "'can define', 'can explain', 'can write', 'can build', 'can compare', 'can debug', 'can implement'. " +
              "NEVER start with 'understand', 'learn', or 'know'."
            ),

          prerequisites: z.array(z.string())
            .optional()
            .default([])
            .describe(
              "Prior knowledge assumed for this lesson (e.g. 'can declare a JavaScript variable', 'knows what HTTP is')"
            ),

          keyConcepts: z.array(z.string())
            .min(1).max(8)
            .optional()
            .default([])
            .describe(
              "3–8 core concepts this lesson introduces or reinforces (noun phrases, e.g. 'closure', 'event loop', 'memoization')"
            ),

          practicalOutcome: z.string()
            .optional()
            .default("")
            .describe(
              "One sentence: what the learner can concretely build, do, or solve immediately after this lesson"
            ),

          assessmentIntent: z.string()
            .optional()
            .default("")
            .describe(
              "How mastery of this specific lesson will be tested — should align with the MODULE_QUIZ at the end of the module"
            ),

          isVolatileTopic: z.boolean()
            .optional()
            .default(false)
            .describe(
              "True if this lesson covers rapidly-changing technology: " +
              "JS/TS frameworks, cloud APIs, LLM tooling, containerisation platforms. " +
              "False for stable topics: algorithms, data structures, math, core CS theory."
            ),

          searchQueries: z.array(LessonSearchQuerySchema)
            .min(0).max(5)
            .optional()
            .default([])
            .describe(
              "3–5 YouTube search queries, each with a DIFFERENT intent " +
              "(beginner_explainer, practical_applied, concept_deep_dive, comparison_troubleshooting, visual_alternative). " +
              "Queries MUST NOT be paraphrases of each other — each should surface genuinely different videos. " +
              "For MODULE_QUIZ or CODE_CHALLENGE lessons, leave this empty."
            ),
        })
      ),
    })
  ),
});

export const QuizAIOutputSchema = z.object({
  questions: z.array(z.object({
    text: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswerIndex: z.number().min(0).max(3),
    explanation: z.string(),
  })).length(5)
});

export type CourseAIOutput = z.infer<typeof CourseAIOutputSchema>;
export type QuizAIOutput = z.infer<typeof QuizAIOutputSchema>;

// Convenience type for a single AI-generated lesson
export type AILesson = CourseAIOutput['modules'][number]['lessons'][number];

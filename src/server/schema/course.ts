import { z } from "zod";

export const CourseGenerationSchema = z.object({
  topic: z.string().min(3).max(100),
  level: z.string().min(1),
  hoursPerDay: z.number().min(1).max(12),
  deadlineDate: z.string().optional(),
  sourceType: z.enum(['text', 'url', 'pdf']).optional(),
  sourceContent: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

export type CourseGenerationInput = z.infer<typeof CourseGenerationSchema>;

export const CourseFormSchema = z.object({
  topic: z.string().min(3).max(100),
  level: z.string().min(1),
  hoursPerDay: z.coerce.number().min(1).max(12),
});

export const CourseAIOutputSchema = z.object({
  title: z.string().describe("A catchy, professional title for the course"),
  description: z.string().describe("A 2-sentence summary of what the course covers"),
  modules: z.array(
    z.object({
      title: z.string().describe("Title of the module"),
      order: z.number().describe("Sequential order of the module, starting from 1"),
      lessons: z.array(
        z.object({
          title: z.string().describe("Title of the lesson"),
          description: z.string().describe("Brief description of the lesson content"),
          estimatedMins: z.number().describe("Estimated time to complete the lesson in minutes (usually between 10 and 60)"),
          searchQuery: z.string().describe("An optimized YouTube search query to find the best educational video for this exact lesson topic"),
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

/**
 * Course & Curriculum Quality Assurance Tests
 *
 * Tests the evaluation schemas and automated validation passes for
 * lesson-level article coverage and course-level structure.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiEvaluatorService } from "@/server/services/ai-evaluator.service";
import * as aiModule from "ai";
import {
  LessonArticleEvaluationSchema,
  CourseEvaluationSchema,
} from "@/server/services/ai-evaluator.service";

// Mock the ai package
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

describe("Course Quality Assurance & Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LessonArticleEvaluationSchema", () => {
    it("accepts a perfectly approved article", () => {
      const valid = {
        objectiveCoverageScore: 1.0,
        missingObjectives: [],
        approved: true,
        reasoning: "Perfect coverage.",
      };
      const result = LessonArticleEvaluationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects if missing required fields", () => {
      const invalid = {
        approved: false,
      };
      const result = LessonArticleEvaluationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CourseEvaluationSchema", () => {
    it("accepts an approved course", () => {
      const valid = {
        overallScore: 0.9,
        curriculumScore: 0.9,
        resourceQualityScore: 0.8,
        progressionScore: 0.9,
        objectiveCoverageScore: 1.0,
        redundancyScore: 0.8,
        assessmentAlignmentScore: 0.9,
        issues: [],
        recommendedFixes: [],
        approved: true,
      };
      const result = CourseEvaluationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts a rejected course with recommended fixes", () => {
      const valid = {
        overallScore: 0.4,
        curriculumScore: 0.5,
        resourceQualityScore: 0.3,
        progressionScore: 0.5,
        objectiveCoverageScore: 0.4,
        redundancyScore: 0.2,
        assessmentAlignmentScore: 0.5,
        issues: ["Topic 2 is highly redundant with Topic 1."],
        recommendedFixes: [{ topicId: "topic-2", reason: "Redundant content." }],
        approved: false,
      };
      const result = CourseEvaluationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("aiEvaluatorService - evaluateArticleCoverage", () => {
    it("calls generateObject with the LessonArticleEvaluationSchema", async () => {
      vi.mocked(aiModule.generateObject).mockResolvedValueOnce({
        object: {
          objectiveCoverageScore: 0.5,
          missingObjectives: ["Understand closures"],
          approved: false,
          reasoning: "Missed closures.",
        }
      } as any);

      const result = await aiEvaluatorService.evaluateArticleCoverage(
        "Some text",
        ["Understand closures", "Write factory functions"],
        "JavaScript Closures"
      );

      expect(aiModule.generateObject).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(aiModule.generateObject).mock.calls[0][0] as any;
      expect(callArgs.schema).toBe(LessonArticleEvaluationSchema);
      expect(result.approved).toBe(false);
      expect(result.missingObjectives).toContain("Understand closures");
    });
  });

  describe("aiEvaluatorService - evaluateFullCourse", () => {
    it("calls generateObject with the CourseEvaluationSchema", async () => {
      vi.mocked(aiModule.generateObject).mockResolvedValueOnce({
        object: {
          overallScore: 1.0,
          curriculumScore: 1.0,
          resourceQualityScore: 1.0,
          progressionScore: 1.0,
          objectiveCoverageScore: 1.0,
          redundancyScore: 1.0,
          assessmentAlignmentScore: 1.0,
          issues: [],
          recommendedFixes: [],
          approved: true,
        }
      } as any);

      const result = await aiEvaluatorService.evaluateFullCourse({
        title: "Test Course",
        modules: []
      });

      expect(aiModule.generateObject).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(aiModule.generateObject).mock.calls[0][0] as any;
      expect(callArgs.schema).toBe(CourseEvaluationSchema);
      expect(result.approved).toBe(true);
    });
  });
});

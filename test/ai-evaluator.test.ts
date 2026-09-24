/**
 * Curriculum & Instructional Evaluation Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiEvaluatorService, VideoEvaluationResult } from "@/server/services/ai-evaluator.service";
import * as aiModule from "ai";

// Mock the ai package
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

describe("AIEvaluatorService — Transcript & Curriculum Evaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEval: VideoEvaluationResult = {
    relevanceScore: 0.9,
    objectiveCoverageScore: 0.8,
    educationalQualityScore: 0.7,
    learnerLevelFitScore: 0.8,
    clarityScore: 0.7,
    completenessScore: 0.8,
    transcriptQualityScore: 0.9,
    freshnessConcern: false,
    duplicateConceptRisk: false,
    recommendation: "ACCEPT",
    missingObjectives: [],
    strengths: ["Great explanation"],
    weaknesses: [],
    reasoning: "Solid video",
  };

  it("passes hard gates when all scores are above minimums and recommendation is ACCEPT", () => {
    expect(aiEvaluatorService.passesHardGates(mockEval)).toBe(true);
  });

  it("fails hard gate if relevanceScore is below 0.6", () => {
    const failedEval = { ...mockEval, relevanceScore: 0.5 };
    expect(aiEvaluatorService.passesHardGates(failedEval)).toBe(false);
  });

  it("fails hard gate if objectiveCoverageScore is below 0.5", () => {
    const failedEval = { ...mockEval, objectiveCoverageScore: 0.4 };
    expect(aiEvaluatorService.passesHardGates(failedEval)).toBe(false);
  });

  it("fails hard gate if educationalQualityScore is below 0.55", () => {
    const failedEval = { ...mockEval, educationalQualityScore: 0.5 };
    expect(aiEvaluatorService.passesHardGates(failedEval)).toBe(false);
  });

  it("fails hard gate if transcriptQualityScore is below 0.5", () => {
    const failedEval = { ...mockEval, transcriptQualityScore: 0.4 };
    expect(aiEvaluatorService.passesHardGates(failedEval)).toBe(false);
  });

  it("fails hard gate if recommendation is REJECT even if scores are okay", () => {
    const failedEval = { ...mockEval, recommendation: "REJECT" as const };
    expect(aiEvaluatorService.passesHardGates(failedEval)).toBe(false);
  });
});

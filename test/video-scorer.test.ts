/**
 * Video Scorer Service Tests
 *
 * Deterministic unit tests for candidate relevance, recency, engagement,
 * channel diversity, and duration-fit scoring.
 */

import { describe, it, expect } from "vitest";
import { scoreAndRankCandidates, ScoredCandidate } from "@/server/services/video-scorer.service";
import type { VideoCandidate } from "@/server/services/video-filter.service";
import type { ScoringContext } from "@/server/services/video-scorer.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCandidate(overrides: Partial<VideoCandidate> = {}): VideoCandidate {
  return {
    videoId: "vid_default",
    title: "JavaScript Closures Explained",
    description: "A tutorial on closures, lexical scope, and execution context in JavaScript.",
    channelId: "channel_A",
    channelName: "Channel A",
    durationSeconds: 1200, // 20 minutes
    publishedAt: new Date(), // just now
    thumbnailUrl: "https://img/default.jpg",
    viewCount: 50000,
    likeCount: 2000,
    sourceIntent: "beginner_explainer",
    ...overrides,
  };
}

function makeContext(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return {
    lessonTitle: "JavaScript Closures",
    objectives: [
      "can explain why a closure retains access to its outer scope variables",
      "can write a factory function using closures",
    ],
    keyConcepts: ["closure", "lexical scope", "execution context"],
    estimatedMins: 20,
    isVolatileTopic: false,
    usedChannelIds: new Set<string>(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VideoScorerService — scoreAndRankCandidates", () => {
  it("returns empty array for empty candidates", () => {
    const result = scoreAndRankCandidates([], makeContext());
    expect(result).toEqual([]);
  });

  it("returns candidates with totalScore in (0, 1]", () => {
    const candidates = [
      makeCandidate({ videoId: "v1" }),
      makeCandidate({ videoId: "v2", title: "Unrelated cooking video" }),
    ];
    const result = scoreAndRankCandidates(candidates, makeContext());
    for (const c of result) {
      expect(c.totalScore).toBeGreaterThan(0);
      expect(c.totalScore).toBeLessThanOrEqual(1.0);
    }
  });

  it("ranks more relevant video above an unrelated one", () => {
    const relevant = makeCandidate({
      videoId: "relevant",
      title: "JavaScript Closures — lexical scope and execution context explained",
      description: "Covers closure, lexical scope, execution context in depth",
    });
    const irrelevant = makeCandidate({
      videoId: "irrelevant",
      title: "Python data science tutorial",
      description: "NumPy, pandas, matplotlib for data analysis",
    });

    const result = scoreAndRankCandidates([irrelevant, relevant], makeContext());
    expect(result[0].videoId).toBe("relevant");
  });

  it("penalises a channel already used in this course (diversity)", () => {
    const usedChannelIds = new Set(["channel_A"]);

    const sameChannel = makeCandidate({ videoId: "v_same", channelId: "channel_A" });
    const newChannel = makeCandidate({ videoId: "v_new", channelId: "channel_B" });

    const result = scoreAndRankCandidates(
      [sameChannel, newChannel],
      makeContext({ usedChannelIds })
    );

    const sameScore = result.find((c) => c.videoId === "v_same")!.scores.diversity;
    const newScore = result.find((c) => c.videoId === "v_new")!.scores.diversity;

    expect(sameScore).toBe(0);
    expect(newScore).toBe(1);
  });

  it("gives recency score of 1.0 for stable (non-volatile) topics regardless of age", () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 5);

    const oldVideo = makeCandidate({ videoId: "old", publishedAt: oldDate });
    const result = scoreAndRankCandidates([oldVideo], makeContext({ isVolatileTopic: false }));
    expect(result[0].scores.recency).toBe(1.0);
  });

  it("gives recency score of 0 for a 4-year-old video on a volatile topic", () => {
    const veryOldDate = new Date();
    veryOldDate.setFullYear(veryOldDate.getFullYear() - 4);

    const oldVideo = makeCandidate({ videoId: "old_volatile", publishedAt: veryOldDate });
    const result = scoreAndRankCandidates([oldVideo], makeContext({ isVolatileTopic: true }));
    expect(result[0].scores.recency).toBe(0);
  });

  it("gives recency score between 0 and 1 for a 1-year-old volatile topic video", () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const midVideo = makeCandidate({ videoId: "mid_volatile", publishedAt: oneYearAgo });
    const result = scoreAndRankCandidates([midVideo], makeContext({ isVolatileTopic: true }));
    expect(result[0].scores.recency).toBeGreaterThan(0);
    expect(result[0].scores.recency).toBeLessThan(1);
  });

  it("scores durationFit highest for video matching estimatedMins exactly", () => {
    const estimatedMins = 20;
    const perfect = makeCandidate({ videoId: "perfect", durationSeconds: estimatedMins * 60 });
    const short = makeCandidate({ videoId: "short", durationSeconds: estimatedMins * 60 * 0.4 });
    const long = makeCandidate({ videoId: "long", durationSeconds: estimatedMins * 60 * 2.4 });

    const result = scoreAndRankCandidates(
      [short, long, perfect],
      makeContext({ estimatedMins })
    );

    const scores = Object.fromEntries(result.map((c) => [c.videoId, c.scores.durationFit]));
    expect(scores.perfect).toBeGreaterThan(scores.short);
    expect(scores.perfect).toBeGreaterThan(scores.long);
    expect(scores.perfect).toBeCloseTo(1.0);
  });

  it("normalises engagement relative to pool — highest-viewed gets 1.0", () => {
    const highView = makeCandidate({ videoId: "high", viewCount: 1_000_000 });
    const lowView = makeCandidate({ videoId: "low", viewCount: 1_000 });

    const result = scoreAndRankCandidates([lowView, highView], makeContext());
    const highEng = result.find((c) => c.videoId === "high")!.scores.engagement;
    const lowEng = result.find((c) => c.videoId === "low")!.scores.engagement;

    expect(highEng).toBeCloseTo(1.0);
    expect(lowEng).toBeLessThan(1.0);
    expect(highEng).toBeGreaterThan(lowEng);
  });

  it("breaks totalScore ties by viewCount", () => {
    // Two identical candidates except for viewCount
    const c1 = makeCandidate({ videoId: "v1", viewCount: 100_000 });
    const c2 = makeCandidate({ videoId: "v2", viewCount: 50_000 });

    // Manually force identical titles/descriptions so relevance is equal
    c1.title = c2.title = "Identical Title";
    c1.description = c2.description = "Same description";

    const result = scoreAndRankCandidates([c2, c1], makeContext());
    // Higher view count should be ranked first when scores are tied
    expect(result[0].videoId).toBe("v1");
  });

  it("attaches all five sub-scores to each candidate", () => {
    const result = scoreAndRankCandidates([makeCandidate()], makeContext());
    expect(result[0].scores).toMatchObject({
      relevance: expect.any(Number),
      recency: expect.any(Number),
      engagement: expect.any(Number),
      diversity: expect.any(Number),
      durationFit: expect.any(Number),
    });
  });

  it("totalScore does not exceed 0.75 (Phase 6 AI placeholder reserved)", () => {
    // Best-case: all sub-scores = 1.0 (except AI placeholder = 0.0)
    // Max possible = 0.30+0.10+0.10+0.15+0.10 = 0.75
    const perfectCandidate = makeCandidate({
      videoId: "perfect_all",
      title: "JavaScript Closures lexical scope execution context factory function",
      description: "Covers closure, lexical scope, execution context, can define, can explain",
      viewCount: 1_000_000,
      durationSeconds: 20 * 60, // exactly estimatedMins
      publishedAt: new Date(),
      channelId: "unused_channel",
    });

    const result = scoreAndRankCandidates([perfectCandidate], makeContext());
    expect(result[0].totalScore).toBeLessThanOrEqual(0.75 + 0.001); // allow float epsilon
  });
});

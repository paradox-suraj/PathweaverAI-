/**
 * Video Scorer Service
 *
 * Takes the candidate pool for a single lesson and produces a ranked
 * list of ScoredCandidates using multi-factor deterministic sub-scores.
 *
 * Scoring weights (defined in generation.config.ts, must sum to 1.0):
 *   relevance   (0.30) — keyword overlap with objectives + keyConcepts
 *   recency     (0.10) — publication age vs. volatile/stable cap
 *   engagement  (0.10) — log-normalised view count across the pool
 *   diversity   (0.15) — penalises channels already used in this course
 *   durationFit (0.10) — how well video length matches estimatedMins
 *   evaluation  (0.25) — reserved for transcript & pedagogical evaluation
 *
 * All sub-scores are normalized in [0, 1]. totalScore = Σ(weight × subScore).
 *
 * Pure computation — deterministic, no I/O, no DB side-effects.
 */

import { VideoCandidate } from "./video-filter.service";
import {
  SCORING_WEIGHTS,
  MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC,
} from "../config/generation.config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CandidateScores {
  relevance: number;
  recency: number;
  engagement: number;
  diversity: number;
  durationFit: number;
}

export interface ScoredCandidate extends VideoCandidate {
  scores: CandidateScores;
  /**
   * Weighted total in [0, 1.0].
   */
  totalScore: number;
}

export interface ScoringContext {
  lessonTitle: string;
  /** Measurable objectives — tokenised for keyword matching */
  objectives: string[];
  /** Key concept noun-phrases — tokenised for keyword matching */
  keyConcepts: string[];
  estimatedMins: number;
  isVolatileTopic: boolean;
  /** Channel IDs already assigned to other lessons in this course.
   *  Caller is responsible for updating this set after each pick. */
  usedChannelIds: Set<string>;
}

// ---------------------------------------------------------------------------
// Sub-score helpers (all return [0, 1])
// ---------------------------------------------------------------------------

/** Stopwords to skip when building keyword sets */
const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","that","this","from",
]);

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_.,;:!?()\[\]{}'"]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * relevance — fraction of lesson keyword tokens that appear in the video's
 * title + first 500 chars of description.
 */
function scoreRelevance(
  candidate: VideoCandidate,
  context: ScoringContext
): number {
  const keywords = new Set<string>([
    ...tokenise(context.lessonTitle),
    ...context.objectives.flatMap(tokenise),
    ...context.keyConcepts.flatMap(tokenise),
  ]);

  if (keywords.size === 0) return 0.5; // no signal — neutral

  const haystack =
    candidate.title.toLowerCase() +
    " " +
    candidate.description.slice(0, 500).toLowerCase();

  let hits = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) hits++;
  }

  return hits / keywords.size;
}

/**
 * recency — 1.0 for recent videos; for volatile topics decays linearly
 * from 1.0→0.0 as the video crosses MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC.
 * Stable topics always return 1.0.
 */
function scoreRecency(
  candidate: VideoCandidate,
  isVolatileTopic: boolean
): number {
  if (!isVolatileTopic) return 1.0;
  if (!candidate.publishedAt) return 0.5; // unknown age — neutral

  const nowMs = Date.now();
  const ageYears =
    (nowMs - candidate.publishedAt.getTime()) /
    (365.25 * 24 * 3600 * 1000);

  if (ageYears <= 0) return 1.0;
  if (ageYears >= MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC) return 0.0;

  return Math.max(0, 1 - ageYears / MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC);
}

/**
 * engagement — log-normalised view count relative to the pool maximum.
 * Uses log1p to handle zero views and compress the enormous range of view counts.
 */
function scoreEngagement(
  candidate: VideoCandidate,
  maxViewCount: number
): number {
  if (maxViewCount <= 0) return 0.5;
  return Math.log1p(candidate.viewCount) / Math.log1p(maxViewCount);
}

/**
 * diversity — binary: 0.0 if this channel already placed a video in this
 * course, 1.0 otherwise.
 */
function scoreDiversity(
  candidate: VideoCandidate,
  usedChannelIds: Set<string>
): number {
  return usedChannelIds.has(candidate.channelId) ? 0.0 : 1.0;
}

/**
 * durationFit — peaks at 1.0 when video length exactly matches estimatedMins.
 * Linear decay: 0.0 when the video is 0× or ≥2.5× the target duration.
 *
 * ratio = durationSeconds / targetSeconds
 * fit   = max(0, 1 - |ratio - 1| / 1.5)
 *
 * e.g. for a 20-min lesson (targetSec = 1200):
 *   10 min (ratio=0.5) → fit = 0.67
 *   20 min (ratio=1.0) → fit = 1.00
 *   40 min (ratio=2.0) → fit = 0.33
 *   50 min (ratio=2.5) → fit = 0.00
 */
function scoreDurationFit(
  candidate: VideoCandidate,
  estimatedMins: number
): number {
  const targetSec = estimatedMins * 60;
  if (targetSec <= 0) return 0.5;

  const ratio = candidate.durationSeconds / targetSec;
  return Math.max(0, 1 - Math.abs(ratio - 1) / 1.5);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Score and rank a pool of Phase 3 survivors for a single lesson.
 *
 * @param candidates  Phase 3 pre-filtered candidates
 * @param context     Lesson context for scoring
 * @returns Candidates sorted by totalScore descending, with sub-scores attached
 */
export function scoreAndRankCandidates(
  candidates: VideoCandidate[],
  context: ScoringContext
): ScoredCandidate[] {
  if (candidates.length === 0) return [];

  // Pre-compute the pool maximum view count for engagement normalisation
  const maxViewCount = Math.max(...candidates.map((c) => c.viewCount), 0);

  const scored: ScoredCandidate[] = candidates.map((c) => {
    const rel = scoreRelevance(c, context);
    const rec = scoreRecency(c, context.isVolatileTopic);
    const eng = scoreEngagement(c, maxViewCount);
    const div = scoreDiversity(c, context.usedChannelIds);
    const dur = scoreDurationFit(c, context.estimatedMins);

    // Phase 6 AI score placeholder — contributes 0.0 until Phase 6 is wired
    const aiPlaceholder = 0.0;

    const total =
      rel * SCORING_WEIGHTS.relevance +
      rec * SCORING_WEIGHTS.recency +
      eng * SCORING_WEIGHTS.engagement +
      div * SCORING_WEIGHTS.diversity +
      dur * SCORING_WEIGHTS.durationFit +
      aiPlaceholder * SCORING_WEIGHTS.placeholderForAIScore;

    return {
      ...c,
      scores: { relevance: rel, recency: rec, engagement: eng, diversity: div, durationFit: dur },
      totalScore: Math.round(total * 10000) / 10000, // 4 d.p.
    };
  });

  // Sort descending by total score; break ties by viewCount
  scored.sort((a, b) =>
    b.totalScore !== a.totalScore
      ? b.totalScore - a.totalScore
      : b.viewCount - a.viewCount
  );

  console.log(
    `[VideoScorer] "${context.lessonTitle}": ` +
    scored
      .slice(0, 3)
      .map((s) => `${s.videoId}(${s.totalScore.toFixed(3)})`)
      .join(", ")
  );

  return scored;
}

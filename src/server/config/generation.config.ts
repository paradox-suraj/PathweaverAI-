/**
 * Generation Configuration — Single Source of Truth
 *
 * All numeric thresholds for the curriculum and video generation pipeline live here.
 * Never hardcode these values elsewhere.
 *
 * @module generation.config
 */

// ---------------------------------------------------------------------------
// Candidate Discovery & Metadata Pre-Filtering
// ---------------------------------------------------------------------------

/** Target number of unique video candidates gathered before filtering.
 *  Actual count may be lower if quota is tight or fewer results exist. */
export const YOUTUBE_CANDIDATE_TARGET = 15;

/** Minimum surviving candidates required after metadata pre-filtering
 *  before proceeding to ranking. If fewer survive, we skip
 *  deep evaluation and go directly to the fallback query strategy. */
export const YOUTUBE_CANDIDATE_MIN_AFTER_FILTER = 3;

/** Minimum video duration in seconds for standard LESSON topics.
 *  Rejects YouTube Shorts and extremely brief clips. */
export const MIN_VIDEO_DURATION_SEC = 180; // 3 minutes

/** Max results fetched per search query from YouTube search.list.
 *  Kept at 5 to match existing quota patterns per query. */
export const YOUTUBE_SEARCH_MAX_RESULTS_PER_QUERY = 5;

/** Maximum video age in years for volatile topics (frameworks, cloud, AI).
 *  Videos older than this are rejected for volatile-topic lessons. */
export const MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC = 2;

/** Maximum video age in years for stable topics (algorithms, math, CS theory).
 *  null = no cap: a 10-year-old explanation of recursion is still valid. */
export const MAX_VIDEO_AGE_YEARS_STABLE_TOPIC: null = null;

/** Minimum word count for a transcript to be considered usable. */
export const MIN_TRANSCRIPT_WORD_COUNT = 300;

// ---------------------------------------------------------------------------
// Multi-Factor Deterministic Scoring Weights (must sum to 1.0)
// ---------------------------------------------------------------------------

export const SCORING_WEIGHTS = {
  /** Title + description keyword overlap with lesson objectives/concepts */
  relevance: 0.30,
  /** Video recency relative to isVolatileTopic threshold */
  recency: 0.10,
  /** Views/likes as a minor signal — never dominant */
  engagement: 0.10,
  /** Penalty for channels/videos already used elsewhere in this course */
  diversity: 0.15,
  /** How well the video duration fits the lesson's estimatedMins */
  durationFit: 0.10,
  /** Weight reserved for content & transcript evaluation */
  placeholderForAIScore: 0.25,
} as const satisfies Record<string, number>;

/** Number of top candidates (by scoring rank) to pass to transcript evaluation */
export const TOP_CANDIDATES_FOR_TRANSCRIPT = 5;

// ---------------------------------------------------------------------------
// Content & Curriculum Quality Gates (all must pass for ACCEPT)
// ---------------------------------------------------------------------------

export const MIN_RELEVANCE = 0.6;
export const MIN_OBJECTIVE_COVERAGE = 0.5;
export const MIN_EDUCATIONAL_QUALITY = 0.55;
export const MIN_TRANSCRIPT_QUALITY = 0.5;

// ---------------------------------------------------------------------------
// Sanity check: weights must sum to 1.0
// ---------------------------------------------------------------------------
const weightSum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.0001) {
  throw new Error(`SCORING_WEIGHTS must sum to 1.0, got ${weightSum}`);
}

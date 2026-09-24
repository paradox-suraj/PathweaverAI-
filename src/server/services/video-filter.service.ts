/**
 * Video Filter & Discovery Service
 *
 * Implements an advanced multi-candidate discovery pipeline:
 *  1. Multi-query fan-out: executes distinct-intent search queries,
 *     deduplicates by videoId, targeting candidate pool size.
 *  2. Batch metadata fetch: single videos.list call for all unique candidate IDs.
 *  3. Metadata pre-filter: rejects Shorts (<MIN_VIDEO_DURATION_SEC),
 *     overly long videos (>2× lesson estimatedMins), and outdated volatile content.
 *
 * Falls back to single-query path if:
 *  - No multi-intent searchQueries are provided, or
 *  - Quota is constrained.
 *
 * Pure data transformation without DB side-effects.
 */

import { google, youtube_v3 } from "googleapis";
import { redis } from "@/lib/redis";
import { keyManager } from "./key-manager.service";
import { LessonSearchQuery } from "../schema/course";
import {
  YOUTUBE_CANDIDATE_TARGET,
  YOUTUBE_CANDIDATE_MIN_AFTER_FILTER,
  YOUTUBE_SEARCH_MAX_RESULTS_PER_QUERY,
  MIN_VIDEO_DURATION_SEC,
  MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC,
} from "../config/generation.config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoCandidate {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelName: string;
  durationSeconds: number;
  publishedAt: Date | null;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  /** Which search query intent surfaces this candidate */
  sourceIntent: string;
}

export interface CandidateFilterResult {
  survivors: VideoCandidate[];
  /** Candidates rejected and the reason — useful for debug logging */
  rejected: Array<{ videoId: string; reason: string }>;
  /** True if we fell back to the legacy single-query approach */
  usedLegacyFallback: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0", 10) * 3600 +
    parseInt(match[2] || "0", 10) * 60 +
    parseInt(match[3] || "0", 10)
  );
}

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/**
 * Fetch up to `maxResults` raw search.list items for a single query.
 * Returns empty array on any error so callers can gracefully degrade.
 */
async function fetchSearchItems(
  youtube: youtube_v3.Youtube,
  query: string,
  maxResults: number
): Promise<youtube_v3.Schema$SearchResult[]> {
  try {
    const resp = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults,
      videoEmbeddable: "true",
      relevanceLanguage: "en",
    });
    return resp.data.items ?? [];
  } catch (err) {
    console.warn(`[VideoFilter] search.list failed for "${query}":`, err);
    return [];
  }
}

/**
 * Batch fetch full metadata for up to 50 video IDs in a single videos.list call.
 * Returns a map of videoId → full item.
 */
async function batchFetchVideoMetadata(
  youtube: youtube_v3.Youtube,
  videoIds: string[]
): Promise<Map<string, youtube_v3.Schema$Video>> {
  const result = new Map<string, youtube_v3.Schema$Video>();
  if (videoIds.length === 0) return result;

  // videos.list accepts up to 50 IDs per call
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    try {
      const resp = await youtube.videos.list({
        part: ["contentDetails", "snippet", "statistics"],
        id: batch,
      });
      for (const item of resp.data.items ?? []) {
        if (item.id) result.set(item.id, item);
      }
    } catch (err) {
      console.warn("[VideoFilter] videos.list batch failed:", err);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Cache key for the full candidate list (not just the winner)
// Keeps candidate discovery results warm for 12 hours so retries
// don't burn quota repeating the same searches.
// ---------------------------------------------------------------------------
function candidateCacheKey(lessonTitle: string): string {
  return `yt:candidates:${lessonTitle.toLowerCase().trim().replace(/\s+/g, "_").slice(0, 80)}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Gathers a multi-candidate pool for a single lesson and applies metadata pre-filters.
 *
 * @param searchQueries  Multi-intent queries for this lesson
 * @param lessonTitle    Used as cache key and fallback query
 * @param estimatedMins  Lesson estimated duration — used for duration-fit filter
 * @param isVolatileTopic  When true, applies MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC
 * @param legacyQuery    Original single `searchQuery` — used if searchQueries is empty
 */
export async function gatherAndPreFilterCandidates(
  searchQueries: LessonSearchQuery[],
  lessonTitle: string,
  estimatedMins: number,
  isVolatileTopic: boolean,
  legacyQuery: string
): Promise<CandidateFilterResult> {
  // ── 0. Redis cache check ─────────────────────────────────────────────────
  const cacheKey = candidateCacheKey(lessonTitle);
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[VideoFilter] Candidate cache HIT for "${lessonTitle}"`);
      return JSON.parse(cached) as CandidateFilterResult;
    }
  } catch {
    // Redis unavailable — continue
  }

  // ── 1. Get YouTube API client ─────────────────────────────────────────────
  const apiKey = keyManager.getYoutubeKey();
  if (!apiKey) {
    console.warn("[VideoFilter] No YouTube API key — cannot gather candidates.");
    return { survivors: [], rejected: [], usedLegacyFallback: true };
  }

  const youtube = google.youtube({ version: "v3", auth: apiKey });

  // ── 2. Decide which queries to fire ──────────────────────────────────────
  const usedLegacyFallback = searchQueries.length === 0;
  const queriesToRun: Array<{ intent: string; query: string }> = usedLegacyFallback
    ? [{ intent: "legacy", query: legacyQuery }]
    : searchQueries;

  // ── 3. Fan-out: run all queries, deduplicate by videoId ──────────────────
  const seenIds = new Set<string>();
  const searchResultMap = new Map<string, string>(); // videoId → intent

  for (const { intent, query } of queriesToRun) {
    if (seenIds.size >= YOUTUBE_CANDIDATE_TARGET) break;

    const items = await fetchSearchItems(
      youtube,
      query,
      YOUTUBE_SEARCH_MAX_RESULTS_PER_QUERY
    );

    for (const item of items) {
      const vid = item.id?.videoId;
      if (!vid || seenIds.has(vid)) continue;
      seenIds.add(vid);
      searchResultMap.set(vid, intent);
      if (seenIds.size >= YOUTUBE_CANDIDATE_TARGET) break;
    }
  }

  if (seenIds.size === 0) {
    console.warn(`[VideoFilter] No candidates found for "${lessonTitle}"`);
    return { survivors: [], rejected: [], usedLegacyFallback };
  }

  // ── 4. Batch metadata fetch ───────────────────────────────────────────────
  const allIds = Array.from(seenIds);
  const metaMap = await batchFetchVideoMetadata(youtube, allIds);

  // ── 5. Build full candidate objects ──────────────────────────────────────
  const candidates: VideoCandidate[] = [];
  for (const [videoId, intent] of searchResultMap) {
    const meta = metaMap.get(videoId);
    if (!meta) continue;

    const durationSec = parseISO8601Duration(
      meta.contentDetails?.duration ?? ""
    );
    const publishedRaw = meta.snippet?.publishedAt;

    candidates.push({
      videoId,
      title: meta.snippet?.title ?? "",
      description: meta.snippet?.description ?? "",
      channelId: meta.snippet?.channelId ?? "",
      channelName: meta.snippet?.channelTitle ?? "",
      durationSeconds: durationSec,
      publishedAt: publishedRaw ? new Date(publishedRaw) : null,
      thumbnailUrl:
        meta.snippet?.thumbnails?.high?.url ??
        meta.snippet?.thumbnails?.default?.url ??
        "",
      viewCount: parseInt(meta.statistics?.viewCount ?? "0", 10),
      likeCount: parseInt(meta.statistics?.likeCount ?? "0", 10),
      sourceIntent: intent,
    });
  }

  // ── 6. Cheap metadata pre-filter ─────────────────────────────────────────
  const survivors: VideoCandidate[] = [];
  const rejected: Array<{ videoId: string; reason: string }> = [];

  const maxDurationSec = estimatedMins * 60 * 2.5; // allow up to 2.5× estimatedMins
  const volatileCutoff = isVolatileTopic
    ? yearsAgo(MAX_VIDEO_AGE_YEARS_VOLATILE_TOPIC)
    : null;

  for (const c of candidates) {
    // Gate 1: Minimum duration (rejects Shorts, sub-3-min clips)
    if (c.durationSeconds < MIN_VIDEO_DURATION_SEC) {
      rejected.push({ videoId: c.videoId, reason: `too_short (${c.durationSeconds}s < ${MIN_VIDEO_DURATION_SEC}s)` });
      continue;
    }

    // Gate 2: Maximum duration (rejects 3-hour lectures for a 15-min lesson)
    if (c.durationSeconds > maxDurationSec) {
      rejected.push({ videoId: c.videoId, reason: `too_long (${c.durationSeconds}s > ${maxDurationSec}s)` });
      continue;
    }

    // Gate 3: Recency for volatile topics
    if (volatileCutoff && c.publishedAt && c.publishedAt < volatileCutoff) {
      rejected.push({ videoId: c.videoId, reason: `too_old_volatile (published ${c.publishedAt.toISOString().slice(0, 10)})` });
      continue;
    }

    survivors.push(c);
  }

  console.log(
    `[VideoFilter] "${lessonTitle}": ${candidates.length} fetched → ` +
    `${survivors.length} survivors (${rejected.length} rejected)`
  );

  const filterResult: CandidateFilterResult = { survivors, rejected, usedLegacyFallback };

  // ── 7. Cache result for 12 hours ─────────────────────────────────────────
  if (survivors.length >= YOUTUBE_CANDIDATE_MIN_AFTER_FILTER) {
    redis.setex(cacheKey, 43200, JSON.stringify(filterResult)).catch(() => {});
  }

  return filterResult;
}

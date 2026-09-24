/**
 * Transcript Filter Service
 *
 * Verifies candidate videos have valid, comprehensive instructional transcripts.
 * Rejects candidates whose transcripts fail to fetch or do not meet minimum density.
 */

import { fetchVideoTranscript, truncateTranscriptSmart } from "./youtube";
import { MIN_TRANSCRIPT_WORD_COUNT } from "../config/generation.config";

export interface TranscriptFilterResult {
  transcript: string;
  wordCount: number;
}

/**
 * Fetches the transcript for a video and verifies it meets the minimum word count.
 * Also applies smart truncation for long videos (> 30 mins) to bound token usage.
 *
 * @param videoId          The YouTube video ID
 * @param durationSeconds  Video length, used to trigger smart truncation
 * @returns Filtered transcript result, or null if it fails the quality gates
 */
export async function fetchAndFilterTranscript(
  videoId: string,
  durationSeconds: number
): Promise<TranscriptFilterResult | null> {
  const fetched = await fetchVideoTranscript(videoId);
  if (!fetched || fetched.trim().length === 0) {
    console.warn(`[TranscriptFilter] Transcript fetch failed or empty for video: ${videoId}`);
    return null;
  }

  // Simple whitespace-based word count
  const wordCount = fetched.split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount < MIN_TRANSCRIPT_WORD_COUNT) {
    console.warn(`[TranscriptFilter] Transcript too short for video ${videoId}: ${wordCount} words (min: ${MIN_TRANSCRIPT_WORD_COUNT})`);
    return null;
  }

  // Long-video guard: truncate to ~8k chars to bound token usage
  const isLongVideo = durationSeconds > 1800; // 30 minutes
  const finalTranscript = isLongVideo ? truncateTranscriptSmart(fetched) : fetched;

  return {
    transcript: finalTranscript,
    wordCount,
  };
}

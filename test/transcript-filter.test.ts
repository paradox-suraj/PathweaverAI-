/**
 * Transcript Filter Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAndFilterTranscript } from "@/server/services/transcript-filter.service";
import { MIN_TRANSCRIPT_WORD_COUNT } from "@/server/config/generation.config";

// Mock the youtube module
vi.mock("@/server/services/youtube", () => ({
  fetchVideoTranscript: vi.fn(),
  truncateTranscriptSmart: vi.fn((text: string) => text.substring(0, 50) + "... (truncated)"),
}));

import { fetchVideoTranscript, truncateTranscriptSmart } from "@/server/services/youtube";

describe("TranscriptFilterService — fetchAndFilterTranscript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if fetchVideoTranscript returns null", async () => {
    (fetchVideoTranscript as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await fetchAndFilterTranscript("vid_fail", 600);
    expect(result).toBeNull();
  });

  it("returns null if transcript has fewer than MIN_TRANSCRIPT_WORD_COUNT words", async () => {
    // Generate a short transcript
    const shortTranscript = Array(MIN_TRANSCRIPT_WORD_COUNT - 10)
      .fill("word")
      .join(" ");
    (fetchVideoTranscript as ReturnType<typeof vi.fn>).mockResolvedValue(shortTranscript);

    const result = await fetchAndFilterTranscript("vid_short", 600);
    expect(result).toBeNull();
  });

  it("returns transcript and word count if it meets the minimum", async () => {
    // Generate a sufficiently long transcript
    const validTranscript = Array(MIN_TRANSCRIPT_WORD_COUNT + 10)
      .fill("word")
      .join(" ");
    (fetchVideoTranscript as ReturnType<typeof vi.fn>).mockResolvedValue(validTranscript);

    const result = await fetchAndFilterTranscript("vid_valid", 600);
    expect(result).not.toBeNull();
    expect(result!.wordCount).toBe(MIN_TRANSCRIPT_WORD_COUNT + 10);
    expect(result!.transcript).toBe(validTranscript);
    
    // Should NOT have called truncate for 600s video
    expect(truncateTranscriptSmart).not.toHaveBeenCalled();
  });

  it("truncates transcript if video duration is over 1800s (30 mins)", async () => {
    const longTranscript = Array(MIN_TRANSCRIPT_WORD_COUNT + 100)
      .fill("word")
      .join(" ");
    (fetchVideoTranscript as ReturnType<typeof vi.fn>).mockResolvedValue(longTranscript);

    const result = await fetchAndFilterTranscript("vid_long", 1801);
    expect(result).not.toBeNull();
    expect(result!.transcript).toContain("... (truncated)");
    expect(truncateTranscriptSmart).toHaveBeenCalledWith(longTranscript);
  });
});

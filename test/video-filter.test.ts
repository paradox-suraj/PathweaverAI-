/**
 * Video Filter Service Tests
 *
 * Unit tests for multi-query candidate discovery, metadata pre-filtering,
 * deduplication, and duration/recency boundaries.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the googleapis module before importing our service
// ---------------------------------------------------------------------------
vi.mock("googleapis", () => {
  const mockSearchList = vi.fn();
  const mockVideosList = vi.fn();

  return {
    google: {
      youtube: () => ({
        search: { list: mockSearchList },
        videos: { list: mockVideosList },
      }),
    },
    // Re-export the type namespace as empty (only types needed)
    youtube_v3: {},
  };
});

vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue("OK"),
  },
}));

vi.mock("@/server/services/key-manager.service", () => ({
  keyManager: {
    getYoutubeKey: vi.fn().mockReturnValue("fake-api-key"),
  },
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks are set up
// ---------------------------------------------------------------------------
import { gatherAndPreFilterCandidates } from "@/server/services/video-filter.service";
import { google } from "googleapis";
import { redis } from "@/lib/redis";
import { MIN_VIDEO_DURATION_SEC } from "@/server/config/generation.config";
import type { LessonSearchQuery } from "@/server/schema/course";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a fake search.list item */
function makeSearchItem(videoId: string) {
  return {
    id: { videoId },
    snippet: {
      title: `Video about ${videoId}`,
      description: "A great tutorial",
      channelId: `channel_${videoId}`,
      channelTitle: `Channel ${videoId}`,
      publishedAt: new Date().toISOString(),
      thumbnails: { high: { url: `https://img/${videoId}.jpg` } },
    },
  };
}

/** Build a fake videos.list item */
function makeVideoItem(
  videoId: string,
  opts: {
    durationSeconds?: number;
    publishedAt?: string;
    viewCount?: number;
    likeCount?: number;
  } = {}
) {
  const {
    durationSeconds = 600,
    publishedAt = new Date().toISOString(),
    viewCount = 10000,
    likeCount = 500,
  } = opts;

  // Convert durationSeconds back to ISO 8601 PT format
  const hours = Math.floor(durationSeconds / 3600);
  const mins = Math.floor((durationSeconds % 3600) / 60);
  const secs = durationSeconds % 60;
  const duration = `PT${hours > 0 ? hours + "H" : ""}${mins > 0 ? mins + "M" : ""}${secs > 0 ? secs + "S" : "0S"}`;

  return {
    id: videoId,
    contentDetails: { duration },
    snippet: {
      title: `Video about ${videoId}`,
      description: "Tutorial",
      channelId: `channel_${videoId}`,
      channelTitle: `Channel ${videoId}`,
      publishedAt,
      thumbnails: { high: { url: `https://img/${videoId}.jpg` } },
    },
    statistics: {
      viewCount: String(viewCount),
      likeCount: String(likeCount),
    },
  };
}

function getYoutubeMocks() {
  const yt = (google.youtube as any)();
  return {
    searchList: yt.search.list as ReturnType<typeof vi.fn>,
    videosList: yt.videos.list as ReturnType<typeof vi.fn>,
  };
}

const SAMPLE_QUERIES: LessonSearchQuery[] = [
  { intent: "beginner_explainer", query: "javascript closures explained simply" },
  { intent: "practical_applied",  query: "javascript closures tutorial hands-on" },
  { intent: "concept_deep_dive",  query: "javascript closures lexical scope theory" },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VideoFilterService — gatherAndPreFilterCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Redis mock to cold cache before each test
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("returns survivors for normal videos above minimum duration", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    // Each query returns 1 unique video
    searchList
      .mockResolvedValueOnce({ data: { items: [makeSearchItem("vid1")] } })
      .mockResolvedValueOnce({ data: { items: [makeSearchItem("vid2")] } })
      .mockResolvedValueOnce({ data: { items: [makeSearchItem("vid3")] } });

    // Batch metadata: 10-minute videos (600s) — well above minimum
    videosList.mockResolvedValue({
      data: {
        items: [
          makeVideoItem("vid1", { durationSeconds: 600 }),
          makeVideoItem("vid2", { durationSeconds: 720 }),
          makeVideoItem("vid3", { durationSeconds: 900 }),
        ],
      },
    });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "JavaScript Closures",
      20,
      false,
      "javascript closures"
    );

    expect(result.survivors.length).toBe(3);
    expect(result.rejected.length).toBe(0);
    expect(result.usedLegacyFallback).toBe(false);
  });

  it("rejects videos shorter than MIN_VIDEO_DURATION_SEC", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    searchList.mockResolvedValue({ data: { items: [makeSearchItem("short1")] } });
    videosList.mockResolvedValue({
      data: { items: [makeVideoItem("short1", { durationSeconds: 45 })] },
    });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "Some Lesson",
      20,
      false,
      "some lesson"
    );

    const rejectedIds = result.rejected.map((r) => r.videoId);
    expect(rejectedIds).toContain("short1");
    expect(result.rejected[0].reason).toMatch(/too_short/);
  });

  it("rejects videos longer than 2.5× estimatedMins", async () => {
    const { searchList, videosList } = getYoutubeMocks();
    const estimatedMins = 20;
    const tooLongSec = estimatedMins * 60 * 3; // 3× — clearly too long

    searchList.mockResolvedValue({ data: { items: [makeSearchItem("long1")] } });
    videosList.mockResolvedValue({
      data: { items: [makeVideoItem("long1", { durationSeconds: tooLongSec })] },
    });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "Some Lesson",
      estimatedMins,
      false,
      "some lesson"
    );

    expect(result.rejected.some((r) => r.reason.includes("too_long"))).toBe(true);
  });

  it("rejects old videos for volatile topics", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    // Published 4 years ago
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 4);

    searchList.mockResolvedValue({ data: { items: [makeSearchItem("old1")] } });
    videosList.mockResolvedValue({
      data: {
        items: [
          makeVideoItem("old1", {
            durationSeconds: 600,
            publishedAt: oldDate.toISOString(),
          }),
        ],
      },
    });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "React Hooks",
      20,
      true, // volatile
      "react hooks tutorial"
    );

    expect(result.rejected.some((r) => r.reason.includes("too_old_volatile"))).toBe(true);
  });

  it("does NOT reject old videos for stable (non-volatile) topics", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 4);

    searchList.mockResolvedValue({ data: { items: [makeSearchItem("classic1")] } });
    videosList.mockResolvedValue({
      data: {
        items: [
          makeVideoItem("classic1", {
            durationSeconds: 1200,
            publishedAt: oldDate.toISOString(),
          }),
        ],
      },
    });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "Binary Search Algorithm",
      30,
      false, // NOT volatile
      "binary search algorithm"
    );

    expect(result.survivors.some((s) => s.videoId === "classic1")).toBe(true);
  });

  it("deduplicates the same videoId appearing in multiple query results", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    // All 3 queries return the same video
    searchList.mockResolvedValue({ data: { items: [makeSearchItem("dup1")] } });
    videosList.mockResolvedValue({
      data: { items: [makeVideoItem("dup1", { durationSeconds: 600 })] },
    });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "Some Lesson",
      20,
      false,
      "some lesson"
    );

    const videoIds = result.survivors.map((s) => s.videoId);
    expect(videoIds.filter((id) => id === "dup1").length).toBeLessThanOrEqual(1);
  });

  it("uses legacy fallback when searchQueries is empty", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    searchList.mockResolvedValue({ data: { items: [makeSearchItem("legacy1")] } });
    videosList.mockResolvedValue({
      data: { items: [makeVideoItem("legacy1", { durationSeconds: 600 })] },
    });

    const result = await gatherAndPreFilterCandidates(
      [], // empty → legacy path
      "Old Format Lesson",
      20,
      false,
      "old format search query"
    );

    expect(result.usedLegacyFallback).toBe(true);
    expect(result.survivors.length).toBeGreaterThanOrEqual(0);
  });

  it("returns empty survivors gracefully when API returns no items", async () => {
    const { searchList, videosList } = getYoutubeMocks();

    searchList.mockResolvedValue({ data: { items: [] } });
    videosList.mockResolvedValue({ data: { items: [] } });

    const result = await gatherAndPreFilterCandidates(
      SAMPLE_QUERIES,
      "Obscure Lesson",
      20,
      false,
      "obscure lesson"
    );

    expect(result.survivors).toEqual([]);
    expect(result.rejected).toEqual([]);
  });

  it("handles API error gracefully without throwing", async () => {
    const { searchList } = getYoutubeMocks();
    searchList.mockRejectedValue(new Error("quota exceeded"));

    await expect(
      gatherAndPreFilterCandidates(
        SAMPLE_QUERIES,
        "Some Lesson",
        20,
        false,
        "some lesson"
      )
    ).resolves.toMatchObject({ survivors: [] });
  });
});

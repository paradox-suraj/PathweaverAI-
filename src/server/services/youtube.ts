import { google } from "googleapis";
import { keyManager } from "./key-manager.service";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { YoutubeTranscript } from 'youtube-transcript';

export interface YouTubeVideoResult {
  videoId: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  channelName?: string;
}

export interface PlaylistVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  channelName?: string;
  durationSeconds?: number;
  position: number;
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Searches YouTube for the best educational video matching the query.
 * Uses Round-Robin API Keys via KeyManager.
 * 
 * @param query The targeted search query for the lesson topic
 * @param lessonTitle The exact title of the lesson to score relevance against
 * @returns The best video match or null if not found/error
 */
export async function searchYouTubeVideo(query: string, lessonTitle?: string): Promise<YouTubeVideoResult | null> {
  const normalizedQuery = query.trim().toLowerCase();

  const operation = async () => {
    const redisKey = `youtube:search:${normalizedQuery}`;
    
    // 1. Check High-Speed Redis Cache
    try {
      const redisCached = await redis.get(redisKey);
      if (redisCached) {
        console.log(`YouTube Redis Cache Hit for query: "${normalizedQuery}"`);
        return JSON.parse(redisCached) as YouTubeVideoResult;
      }
    } catch (e) {
      console.warn("Redis check failed, falling back to Postgres:", e);
    }

    // 2. Check Postgres Cache
    const cached = await prisma.youtubeCache.findUnique({
      where: { query: normalizedQuery }
    });

    if (cached) {
      console.log(`YouTube Postgres Cache Hit for query: "${normalizedQuery}"`);
      const result: YouTubeVideoResult = {
        videoId: cached.videoId,
        durationSeconds: cached.durationSeconds || undefined,
        thumbnailUrl: cached.thumbnailUrl || undefined,
        channelName: cached.channelName || undefined,
      };
      // Populate Redis
      await redis.setex(redisKey, 604800, JSON.stringify(result)).catch(console.error); // 7 days
      return result;
    }

    const apiKey = keyManager.getYoutubeKey();
    if (!apiKey) {
      console.warn("YouTube API key array is empty. Skipping YouTube search.");
      return null;
    }

    const youtube = google.youtube({
      version: "v3",
      auth: apiKey,
    });

    // 2. Search for the best matches (Top 5)
    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults: 5,
      videoEmbeddable: "true",
    });

    const items = searchResponse.data.items;
    if (!items || items.length === 0) {
      return null;
    }

    // 3. Score the videos based on how closely their title matches the lesson title
    let bestVideoId = items[0].id?.videoId;
    let highestScore = -1;

    if (lessonTitle) {
      const targetWords = lessonTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      for (const item of items) {
        if (!item.id?.videoId) continue;
        const videoTitle = (item.snippet?.title || "").toLowerCase();
        
        let score = 0;
        for (const word of targetWords) {
          if (videoTitle.includes(word)) {
            score++;
          }
        }
        
        if (score > highestScore) {
          highestScore = score;
          bestVideoId = item.id.videoId;
        }
      }
    }

    if (!bestVideoId) return null;

    // 4. Fetch rich metadata for the chosen video
    const videoResponse = await youtube.videos.list({
      part: ["contentDetails", "snippet"],
      id: [bestVideoId],
    });

    const videoItems = videoResponse.data.items;
    if (!videoItems || videoItems.length === 0) {
      return { videoId: bestVideoId };
    }

    const videoData = videoItems[0];
    const durationIso = videoData.contentDetails?.duration;
    
    const result = {
      videoId: bestVideoId,
      durationSeconds: durationIso ? parseISO8601Duration(durationIso) : undefined,
      thumbnailUrl: videoData.snippet?.thumbnails?.high?.url || videoData.snippet?.thumbnails?.default?.url || undefined,
      channelName: videoData.snippet?.channelTitle || undefined,
    };

    // 5. Save to Cache
    await prisma.youtubeCache.create({
      data: {
        query: normalizedQuery,
        videoId: result.videoId,
        durationSeconds: result.durationSeconds,
        thumbnailUrl: result.thumbnailUrl,
        channelName: result.channelName,
      }
    }).catch(e => console.error("Failed to cache YouTube result to Postgres:", e));

    await redis.setex(redisKey, 604800, JSON.stringify(result)).catch(console.error); // 7 days

    return result;
  };

  try {
    return await Promise.race([
      operation(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("YouTube API timeout")), 8000))
    ]);
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return null;
  }
}

/**
 * Fetches the transcript of a YouTube video
 * @param videoId The YouTube video ID
 * @returns Formatted transcript text or null if unavailable
 */
export async function fetchVideoTranscript(videoId: string): Promise<string | null> {
  const redisKey = `youtube:transcript:${videoId}`;
  
  try {
    const cached = await redis.get(redisKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.warn(`[Redis] Failed to get transcript cache for ${videoId}`, e);
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) return null;
    
    // Format transcript into a readable string with approximate timestamps
    // Combine chunks to avoid massive token usage
    let formattedText = "";
    let currentChunk = "";
    let chunkStartTime = 0;
    
    for (let i = 0; i < transcript.length; i++) {
      const item = transcript[i];
      if (currentChunk.length === 0) {
        chunkStartTime = Math.floor(item.offset / 1000); // seconds
      }
      
      currentChunk += item.text + " ";
      
      // Every ~500 chars, write out a chunk with a timestamp
      if (currentChunk.length > 500 || i === transcript.length - 1) {
        formattedText += `[${Math.floor(chunkStartTime / 60).toString().padStart(2, '0')}:${(chunkStartTime % 60).toString().padStart(2, '0')}] ${currentChunk.trim()}\n`;
        currentChunk = "";
      }
    }
    
    try {
      // Cache for 7 days
      await redis.setex(redisKey, 604800, formattedText);
    } catch (e) {
      console.warn(`[Redis] Failed to cache transcript for ${videoId}`, e);
    }

    return formattedText;
  } catch (error) {
    console.error(`Failed to fetch transcript for video ${videoId}:`, error);
    return null;
  }
}

/**
 * Extracts a YouTube playlist ID from a URL or returns it as-is if already an ID.
 */
function extractPlaylistId(urlOrId: string): string | null {
  try {
    const url = new URL(urlOrId);
    return url.searchParams.get("list");
  } catch {
    // Not a URL — treat as raw playlist ID
    if (/^PL[a-zA-Z0-9_-]{10,}$/.test(urlOrId.trim())) {
      return urlOrId.trim();
    }
    return null;
  }
}

/**
 * Fetches all public videos from a YouTube playlist (up to 50).
 * Enriches each video with duration metadata via a secondary API call.
 * Results are cached in Redis for 24 hours.
 *
 * @param playlistUrlOrId  Full playlist URL or raw playlist ID (PLxxx...)
 * @returns Array of PlaylistVideo objects sorted by playlist position
 */
export async function fetchPlaylistVideos(playlistUrlOrId: string): Promise<PlaylistVideo[]> {
  const playlistId = extractPlaylistId(playlistUrlOrId);
  if (!playlistId) {
    console.warn(`[fetchPlaylistVideos] Could not extract playlist ID from: ${playlistUrlOrId}`);
    return [];
  }

  const redisKey = `youtube:playlist:${playlistId}`;

  // 1. Redis cache check (24 hours)
  try {
    const cached = await redis.get(redisKey);
    if (cached) {
      console.log(`[fetchPlaylistVideos] Redis cache hit for playlist: ${playlistId}`);
      return JSON.parse(cached) as PlaylistVideo[];
    }
  } catch (e) {
    console.warn("[fetchPlaylistVideos] Redis check failed:", e);
  }

  const apiKey = keyManager.getYoutubeKey();
  if (!apiKey) {
    console.warn("[fetchPlaylistVideos] No YouTube API key available.");
    return [];
  }

  const youtube = google.youtube({ version: "v3", auth: apiKey });

  const videos: PlaylistVideo[] = [];
  let pageToken: string | undefined;

  try {
    // 2. Fetch playlist items (paginated, max 50 total)
    do {
      const response = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId,
        maxResults: 50,
        pageToken,
      });

      const items = response.data.items ?? [];
      for (const item of items) {
        const videoId = item.contentDetails?.videoId;
        if (!videoId) continue;
        videos.push({
          videoId,
          title: item.snippet?.title ?? "",
          description: (item.snippet?.description ?? "").substring(0, 500),
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ??
            item.snippet?.thumbnails?.default?.url ??
            undefined,
          channelName: item.snippet?.videoOwnerChannelTitle ?? undefined,
          position: item.snippet?.position ?? videos.length,
        });
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken && videos.length < 50);

    // 3. Enrich with video duration via videos.list (batch up to 50 IDs)
    if (videos.length > 0) {
      const videoIds = videos.map((v) => v.videoId);
      const detailsResponse = await youtube.videos.list({
        part: ["contentDetails"],
        id: videoIds,
      });

      const durationMap = new Map<string, number>();
      for (const detail of detailsResponse.data.items ?? []) {
        if (detail.id && detail.contentDetails?.duration) {
          durationMap.set(detail.id, parseISO8601Duration(detail.contentDetails.duration));
        }
      }

      for (const video of videos) {
        video.durationSeconds = durationMap.get(video.videoId);
      }
    }

    // 4. Cache in Redis for 24 hours
    try {
      await redis.setex(redisKey, 86400, JSON.stringify(videos));
    } catch (e) {
      console.warn("[fetchPlaylistVideos] Failed to set Redis cache:", e);
    }

    console.log(`[fetchPlaylistVideos] Fetched ${videos.length} videos for playlist: ${playlistId}`);
    return videos;
  } catch (error) {
    console.error(`[fetchPlaylistVideos] Error fetching playlist ${playlistId}:`, error);
    return [];
  }
}

/**
 * Intelligently truncates a formatted transcript string at the nearest sentence
 * boundary before maxChars, then appends a truncation notice.
 *
 * @param transcript  Full formatted transcript string (from fetchVideoTranscript)
 * @param maxChars    Maximum characters to keep (default: 8000)
 * @returns Truncated transcript with a notice appended
 */
export function truncateTranscriptSmart(transcript: string, maxChars = 8000): string {
  if (transcript.length <= maxChars) return transcript;

  // Slice to the limit, then walk back to the last sentence boundary
  let cut = transcript.substring(0, maxChars);
  const lastPeriod = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  if (lastPeriod > maxChars * 0.6) {
    cut = cut.substring(0, lastPeriod + 1);
  }

  return (
    cut.trimEnd() +
    "\n\n[... Transcript truncated. This is a long-form video — the above covers the opening segment only. Use the video timestamps to navigate to later sections. ...]"
  );
}

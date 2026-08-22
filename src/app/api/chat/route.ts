import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redis } from "@/lib/redis";
import { getLocalAnswer } from "@/server/services/local-ai.service";
import { checkGeminiRateLimit } from "@/server/services/rate-limiter.service";
import crypto from "crypto";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// In-memory LRU cache for Deep-Dive articles (max 10 entries)
const articleCache = new Map<string, string>();
function getCachedArticle(topicId: string): string | undefined {
  const entry = articleCache.get(topicId);
  if (entry) {
    articleCache.delete(topicId);
    articleCache.set(topicId, entry);
    return entry;
  }
  return undefined;
}
function setCachedArticle(topicId: string, content: string) {
  if (articleCache.size >= 10) {
    const oldestKey = articleCache.keys().next().value;
    if (oldestKey) articleCache.delete(oldestKey);
  }
  articleCache.set(topicId, content);
}

// --- RATE LIMITER (Redis-backed) ---
// Max 5 chat requests per 10-second window per user
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:chat:${userId}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 10);
    }
    return current <= 5;
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // --- RATE LIMIT CHECK ---
  const allowed = await checkRateLimit(session.user.id);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment before asking another question." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "10" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return new Response("Invalid request body", { status: 400 });
  }

  const { messages, topicId, videoTimestamp } = body as {
    messages?: unknown;
    topicId?: string;
    videoTimestamp?: number;
  };

  if (!topicId || typeof topicId !== "string") {
    return new Response("Missing or invalid topicId", { status: 400 });
  }

  if (!Array.isArray(messages)) {
    return new Response("Missing or invalid messages array", { status: 400 });
  }

  // --- LAYER 1: SEMANTIC ROUTING (LOCAL INTERCEPTOR) ---
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user' && typeof lastMessage.content === 'string') {
    const msg = lastMessage.content.trim().toLowerCase();

    const greetingRegex = /^(hi|hello|hey|hi there|hello there|good morning|good evening|good afternoon|sup|yo|greetings)[.!?]*$/;
    const thanksRegex = /^(thanks|thank you|thx|tysm|ty|thanks a lot)[.!?]*$/;

    let quickReply = null;
    if (greetingRegex.test(msg)) {
      quickReply = "Hello! 👋 I'm your AI tutor. What would you like to know about this lesson?";
    } else if (thanksRegex.test(msg)) {
      quickReply = "You're very welcome! Let me know if you need help with anything else.";
    }

    if (quickReply) {
      return new Response(`0:${JSON.stringify(quickReply)}\n`, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1'
        }
      });
    }
  }

  // --- LAYER 2: REDIS ANSWER CACHE ---
  const question = typeof lastMessage?.content === "string" ? lastMessage.content.trim() : "";
  const cacheKey = `chat:answer:${topicId}:${crypto.createHash('sha256').update(question).digest('hex')}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new Response(`0:${cached}\n`, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1'
        }
      });
    }
  } catch {
    // Redis down - continue to DB/AI
  }

  // --- LAYER 3: FETCH TOPIC (with LRU article cache) ---
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      resources: {
        include: {
          articleResource: true,
          videoResource: true,
        }
      },
      module: {
        include: { course: { select: { userId: true } } }
      }
    }
  });

  if (!topic) {
    return new Response("Topic not found", { status: 404 });
  }

  if (topic.module.course.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const videoResource = topic.resources.find(r => r.type === "VIDEO")?.videoResource;
  const articleResource = topic.resources.find(r => r.type === "ARTICLE")?.articleResource;

  // Retrieve article content via in-memory LRU cache
  let articleContent: string | undefined = getCachedArticle(topicId);
  if (!articleContent && articleResource?.content) {
    articleContent = articleResource.content;
    setCachedArticle(topicId, articleContent);
  }

  // --- LAYER 4: LOCAL RAG (DistilBERT QA) ---
  if (articleContent && lastMessage && lastMessage.role === 'user' && typeof lastMessage.content === 'string') {
    try {
      const localAnswer = await getLocalAnswer(lastMessage.content, articleContent);
      if (localAnswer) {
        const friendlyResponse = `Based on the deep dive article: **${localAnswer}**`;
        const jsonResponse = JSON.stringify(friendlyResponse);
        await redis.setex(cacheKey, 300, jsonResponse).catch(() => {});
        return new Response(`0:${jsonResponse}\n`, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Vercel-AI-Data-Stream': 'v1'
          }
        });
      }
    } catch {
      // Local model failed - fall through to Gemini
    }
  }

  // --- LAYER 5: GEMINI API (final fallback) ---
  let systemPrompt = `You are a helpful, encouraging AI teaching assistant in an educational platform.
The student is currently learning a lesson titled: "${topic.title}".
Lesson description: "${topic.description || 'Core concepts'}".\n\n`;

  if (videoResource) {
    systemPrompt += `The student has access to a YouTube video for this lesson. Video Channel: ${videoResource.channelName || 'Unknown'}. Video Length: ${videoResource.durationSeconds ? Math.floor(videoResource.durationSeconds / 60) + ' mins' : 'Unknown'}.\n\n`;

    if (typeof videoTimestamp === 'number') {
      const minutes = Math.floor(videoTimestamp / 60);
      const seconds = Math.floor(videoTimestamp % 60).toString().padStart(2, '0');
      systemPrompt += `CRITICAL CONTEXT: The student is currently paused at EXACTLY ${minutes}:${seconds} in the video. If their question uses words like "here", "this part", "now", or asks about the instructor, they are referring to this exact moment in the video. Answer their question within the context of what is happening at ${minutes}:${seconds}.\n\n`;
    }
  }

  if (articleContent) {
    systemPrompt += `The student also has access to a Deep Dive article covering the lesson. Here is the full text of the article for your reference to answer questions accurately based on the course material:\n
--- ARTICLE START ---
${articleContent}
--- ARTICLE END ---\n\n`;
  }

  systemPrompt += `Your goal is to answer the student's questions specifically in the context of this lesson and the provided article material.
Be concise, clear, and pedagogical. Do not do their work for them, but guide them to the right answer.
Use markdown formatting where appropriate (e.g., code blocks, bold text for emphasis).`;

  try {
    // --- GEMINI RATE LIMIT CHECK ---
    const geminiLimit = await checkGeminiRateLimit(session.user.id);
    if (!geminiLimit.allowed) {
      return new Response(
        JSON.stringify({ error: `Gemini API quota reached. Try again in ${geminiLimit.resetInSeconds}s. You have ${geminiLimit.remaining} requests remaining this hour.` }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(geminiLimit.resetInSeconds) } }
      );
    }

    const modelMessages = await convertToModelMessages(
      messages as UIMessage[]
    );

    const result = streamText({
      model: google("gemini-3.6-flash"),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error instanceof Error ? error.message : error);
    return new Response("Failed to generate response", { status: 500 });
  }
}

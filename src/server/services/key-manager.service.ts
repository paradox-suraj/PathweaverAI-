import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { decryptText } from "@/lib/crypto";

export type ProviderType = "gemini" | "groq" | "cerebras" | "mistral" | "openrouter" | "kimi";
export type Sector = "CURRICULUM" | "DEEP_DIVE" | "QUIZ";

function parseKeyList(envVal: string | undefined): string[] {
  if (!envVal) return [];
  return envVal
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export class KeyManager {
  private indices: Record<ProviderType | "youtube", number> = {
    gemini: 0,
    groq: 0,
    cerebras: 0,
    mistral: 0,
    openrouter: 0,
    kimi: 0,
    youtube: 0,
  };

  private providerIndex = 0;
  private readonly allProviders: ProviderType[] = [
    "gemini",
    "groq",
    "cerebras",
    "mistral",
    "openrouter",
    "kimi",
  ];

  private getProviderKeys(provider: ProviderType): string[] {
    switch (provider) {
      case "gemini":
        return parseKeyList(
          process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
        );
      case "groq":
        return parseKeyList(process.env.GROQ_API_KEY);
      case "mistral":
        return parseKeyList(process.env.MISTRAL_API_KEY);
      case "cerebras":
        return parseKeyList(process.env.CEREBRAS_API_KEY);
      case "openrouter":
        return parseKeyList(process.env.OPENROUTER_API_KEY);
      case "kimi":
        return parseKeyList(
          process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY
        );
      default:
        return [];
    }
  }

  private getAvailableProviders(): ProviderType[] {
    const available = this.allProviders.filter(
      (p) => this.getProviderKeys(p).length > 0
    );
    return available.length > 0 ? available : ["gemini"];
  }

  private getNextProvider(): ProviderType {
    const providers = this.getAvailableProviders();
    const provider = providers[this.providerIndex % providers.length];
    this.providerIndex = (this.providerIndex + 1) % providers.length;
    return provider;
  }

  /**
   * Retrieves the next available client for a specific provider.
   * If userId is provided, attempts to load the user's custom API key first.
   */
  async getClient(provider: ProviderType, userId?: string) {
    let apiKey: string | null = null;

    if (userId) {
      // 1. Try to load user's BYOK key
      try {
        const userKeyData = await prisma.userApiKey.findUnique({
          where: { userId_provider: { userId, provider } },
        });

        if (userKeyData) {
          const decrypted = await decryptText(userKeyData.keyData, userKeyData.iv);
          if (decrypted) {
            apiKey = decrypted;
          }
        }
      } catch (err) {
        console.warn(`[KeyManager] Failed to load BYOK key for user ${userId}:`, err);
      }
    }

    if (!apiKey) {
      // 2. Fallback to environment variables pool
      const keyList = this.getProviderKeys(provider);
      if (keyList.length > 0) {
        const index = this.indices[provider] % keyList.length;
        apiKey = keyList[index];
        this.indices[provider] = (index + 1) % keyList.length;
      }
    }

    if (!apiKey) {
      // Fallback to Gemini if requested provider has no key configured
      const geminiKeys = this.getProviderKeys("gemini");
      if (geminiKeys.length > 0) {
        apiKey = geminiKeys[0];
        return {
          client: createGoogleGenerativeAI({ apiKey }),
          modelId: "gemini-1.5-flash",
        };
      }
      throw new Error(
        `No API key configured for provider "${provider}". Please set the corresponding environment variable (e.g. GEMINI_API_KEY).`
      );
    }

    switch (provider) {
      case "gemini":
        return {
          client: createGoogleGenerativeAI({ apiKey }),
          modelId: "gemini-1.5-flash",
        };
      case "groq":
        return { client: createGroq({ apiKey }), modelId: "llama-3.3-70b-versatile" };
      case "mistral":
        return { client: createMistral({ apiKey }), modelId: "mistral-large-latest" };
      case "cerebras":
        return {
          client: createOpenAI({ apiKey, baseURL: "https://api.cerebras.ai/v1" }),
          modelId: "llama3.1-70b",
        };
      case "openrouter":
        return {
          client: createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" }),
          modelId: "meta-llama/llama-3.1-8b-instruct",
        };
      case "kimi":
        return {
          client: createOpenAI({ apiKey, baseURL: "https://api.moonshot.cn/v1" }),
          modelId: "moonshot-v1-8k",
        };
      default:
        throw new Error(`Unknown provider ${provider}`);
    }
  }

  async getCurriculumClient(userId?: string) {
    return this.getClient(this.getNextProvider(), userId);
  }

  async getQuizClient(userId?: string) {
    return this.getClient(this.getNextProvider(), userId);
  }

  async getDeepDiveClient(userId?: string) {
    return this.getClient(this.getNextProvider(), userId);
  }

  getYoutubeKey(): string {
    const keyList = parseKeyList(
      process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS
    );
    if (keyList.length === 0) {
      throw new Error(
        "No YouTube API key configured. Please set YOUTUBE_API_KEY in your environment."
      );
    }
    const index = this.indices["youtube"] % keyList.length;
    const apiKey = keyList[index];
    this.indices["youtube"] = (index + 1) % keyList.length;
    return apiKey;
  }
}

export const keyManager = new KeyManager();

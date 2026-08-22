import keys from "./keys.json";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { decryptText } from "@/lib/crypto";

export type ProviderType = "gemini" | "groq" | "cerebras" | "mistral" | "openrouter" | "kimi";
export type Sector = "CURRICULUM" | "DEEP_DIVE" | "QUIZ";

export class KeyManager {
  private indices: Record<ProviderType | "youtube", number> = {
    gemini: 0,
    groq: 0,
    cerebras: 0,
    mistral: 0,
    openrouter: 0,
    kimi: 0,
    youtube: 0
  };

  private providerIndex = 0;
  private readonly providers: ProviderType[] = ["gemini", "groq", "cerebras", "mistral", "openrouter", "kimi"];

  private getNextProvider(): ProviderType {
    const provider = this.providers[this.providerIndex];
    this.providerIndex = (this.providerIndex + 1) % this.providers.length;
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
      const userKeyData = await prisma.userApiKey.findUnique({
        where: { userId_provider: { userId, provider } }
      });

      if (userKeyData) {
        const decrypted = await decryptText(userKeyData.keyData, userKeyData.iv);
        if (decrypted) {
          apiKey = decrypted;
        }
      }
    }

    if (!apiKey) {
      // 2. Fallback to Round-Robin pool
      const keyList = (keys as any)[provider];
      if (!keyList || keyList.length === 0) {
        throw new Error(`No keys configured for provider ${provider}`);
      }

      const index = this.indices[provider];
      apiKey = keyList[index];
      this.indices[provider] = (index + 1) % keyList.length;
    }

    if (!apiKey) throw new Error(`No valid key found for provider ${provider}`);

    switch (provider) {
      case "gemini":
        return { client: createGoogleGenerativeAI({ apiKey }), modelId: "gemini-3.6-flash" };
      case "groq":
        return { client: createGroq({ apiKey }), modelId: "openai/gpt-oss-20b" };
      case "mistral":
        return { client: createMistral({ apiKey }), modelId: "mistral-large-latest" };
      case "cerebras":
        return { 
          client: createOpenAI({ apiKey, baseURL: "https://api.cerebras.ai/v1" }), 
          modelId: "gpt-oss-120b" 
        };
      case "openrouter":
        return {
          client: createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" }),
          modelId: "meta-llama/llama-3.1-8b-instruct" 
        };
      case "kimi":
        return {
          client: createOpenAI({ apiKey, baseURL: "https://api.moonshot.cn/v1" }),
          modelId: "moonshot-v1-8k"
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

  getYoutubeKey() {
    const keyList = (keys as any)["youtube"];
    const index = this.indices["youtube"];
    const apiKey = keyList[index];
    this.indices["youtube"] = (index + 1) % keyList.length;
    return apiKey;
  }
}

export const keyManager = new KeyManager();

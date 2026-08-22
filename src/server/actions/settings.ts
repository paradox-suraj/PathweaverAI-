"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptText } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function saveApiKey(provider: string, rawKey: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!provider || !rawKey) {
      throw new Error("Provider and key are required");
    }

    // Encrypt the key
    const encrypted = await encryptText(rawKey);

    // Save to DB
    await prisma.userApiKey.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: provider,
        },
      },
      update: {
        keyData: encrypted.cipherText,
        iv: encrypted.iv,
      },
      create: {
        userId: session.user.id,
        provider: provider,
        keyData: encrypted.cipherText,
        iv: encrypted.iv,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving API key:", error);
    return { success: false, error: error.message };
  }
}

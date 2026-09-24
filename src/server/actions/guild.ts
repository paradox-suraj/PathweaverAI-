'use server';

import { auth } from '@/auth';
import { guildService } from '../services/guild.service';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

const CreateGuildSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(30),
  description: z.string().max(500).optional(),
  topic: z.string().min(2).max(50),
  isPublic: z.boolean().optional(),
});

export async function createGuildAction(data: { name: string; slug: string; description?: string; topic: string; isPublic?: boolean }) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const parsedData = CreateGuildSchema.parse(data);

    const guild = await guildService.createGuild(session.user.id, parsedData);
    revalidatePath('/guilds');
    return { success: true, guildId: guild.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function joinGuildAction(guildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await guildService.joinGuild(guildId, session.user.id);
    revalidatePath(`/guilds/${guildId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function leaveGuildAction(guildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const res = await guildService.leaveGuild(guildId, session.user.id);
    revalidatePath(`/guilds/${guildId}`);
    if (res.deleted) {
      revalidatePath('/guilds');
    }
    return { success: true, deleted: res.deleted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

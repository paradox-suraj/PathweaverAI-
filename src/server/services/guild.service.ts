import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export class GuildService {
  /**
   * Creates a new guild and automatically adds the founder as the FOUNDER role.
   */
  async createGuild(founderId: string, data: { name: string; slug: string; description?: string; topic: string; isPublic?: boolean }) {
    return prisma.guild.create({
      data: {
        founderId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        topic: data.topic,
        isPublic: data.isPublic ?? true,
        members: {
          create: {
            userId: founderId,
            role: 'FOUNDER',
          },
        },
      },
    });
  }

  /**
   * Joins a guild if it's public and not full.
   */
  async joinGuild(guildId: string, userId: string) {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!guild) throw new Error('Guild not found.');
    if (!guild.isPublic) throw new Error('This guild is private.');
    if (guild._count.members >= guild.maxMembers) throw new Error('This guild is full.');

    const existingMember = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
    });

    if (existingMember) throw new Error('You are already a member of this guild.');

    return prisma.guildMember.create({
      data: {
        guildId,
        userId,
        role: 'MEMBER',
      },
    });
  }

  /**
   * Leaves a guild. If the user is the founder and the only member, the guild is deleted.
   * If there are other members, the founder must transfer ownership first (not implemented in MVP).
   */
  async leaveGuild(guildId: string, userId: string) {
    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
      include: { guild: { include: { _count: { select: { members: true } } } } },
    });

    if (!member) throw new Error('You are not a member of this guild.');

    if (member.role === 'FOUNDER') {
      if (member.guild._count.members > 1) {
        throw new Error('You cannot leave as founder while there are other members. Transfer ownership or remove members first.');
      } else {
        // Last member and founder, delete the guild
        await prisma.guild.delete({ where: { id: guildId } });
        return { deleted: true };
      }
    }

    await prisma.guildMember.delete({
      where: { id: member.id },
    });

    return { deleted: false };
  }

  /**
   * Retrieves the guild dashboard data including its internal leaderboard.
   */
  async getGuildDashboard(guildId: string, userId: string) {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        founder: { select: { id: true, name: true, username: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true, userStat: { select: { xp: true, currentStreak: true } } } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!guild) throw new Error('Guild not found.');

    // Sort members by total XP for the internal leaderboard
    // We are using total XP (from UserStat) for the leaderboard as per MVP spec.
    const leaderboard = [...guild.members]
      .filter((m) => m.user.userStat)
      .sort((a, b) => (b.user.userStat?.xp || 0) - (a.user.userStat?.xp || 0))
      .slice(0, 20);

    const isMember = guild.members.some(m => m.userId === userId);

    return {
      guild,
      isMember,
      leaderboard,
    };
  }

  /**
   * Lists public guilds, optionally filtered by search query or topic.
   */
  async listGuilds(query?: string, topic?: string, skip = 0, take = 20) {
    return prisma.guild.findMany({
      where: {
        isPublic: true,
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
        ...(topic ? { topic } : {}),
      },
      include: {
        founder: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Gets all guilds a user is a member of.
   */
  async getUserGuilds(userId: string) {
    const memberships = await prisma.guildMember.findMany({
      where: { userId },
      include: {
        guild: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });
    return memberships.map(m => m.guild);
  }
}

export const guildService = new GuildService();

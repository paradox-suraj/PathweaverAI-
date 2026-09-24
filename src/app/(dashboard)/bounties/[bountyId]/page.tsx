import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BountyDetailClient from './BountyDetailClient';

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ bountyId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const { bountyId } = await params;

  const bounty = await prisma.bounty.findUnique({
    where: { id: bountyId },
    include: {
      creator: { select: { name: true, image: true, id: true } },
      answers: {
        include: { author: { select: { name: true, image: true, id: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!bounty) {
    notFound();
  }

  const isCreator = bounty.creatorId === userId;

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <BountyDetailClient
        bounty={bounty}
        isCreator={isCreator}
        currentUserId={userId}
      />
    </div>
  );
}

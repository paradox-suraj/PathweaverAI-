import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  
  const topicId = req.nextUrl.searchParams.get('topicId');
  if (!topicId) return new Response('Missing topicId', { status: 400 });
  
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      resources: { include: { articleResource: true } },
      module: { include: { course: { select: { userId: true } } } }
    }
  });
  
  if (!topic) return new Response('Not found', { status: 404 });
  if (topic.module.course.userId !== session.user.id) return new Response('Forbidden', { status: 403 });
  
  const article = topic.resources.find(r => r.type === 'ARTICLE')?.articleResource;
  
  return new Response(JSON.stringify({ content: article?.content || null }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=300'
    }
  });
}

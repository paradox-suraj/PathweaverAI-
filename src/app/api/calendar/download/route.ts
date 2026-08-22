import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tasks = await prisma.studyTask.findMany({
    where: {
      plan: { userId: session.user.id },
      status: "PENDING",
      scheduledAt: { not: null }
    },
    include: {
      topic: {
        include: {
          module: {
            include: { course: true }
          }
        }
      }
    },
    orderBy: { scheduledAt: "asc" }
  });

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = formatDate(new Date());

  let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PathWeaver AI//Study Plan//EN\r\nCALSCALE:GREGORIAN\r\n`;

  for (const task of tasks) {
    if (!task.scheduledAt) continue;

    const startDate = task.scheduledAt;
    const endDate = new Date(startDate.getTime() + task.topic.estimatedMins * 60000);

    // Escape characters according to RFC 5545
    const summary = `[PathWeaver AI] ${task.title}`.replace(/[,;]/g, '\\$&');
    const description = `Course: ${task.topic.module.course.title}\\nModule: ${task.topic.module.title}\\nTopic: ${task.title}`.replace(/[,;]/g, '\\$&');

    icsContent += `BEGIN:VEVENT\r\nUID:${task.id}@pathweaver.app\r\nDTSTAMP:${now}\r\nDTSTART:${formatDate(startDate)}\r\nDTEND:${formatDate(endDate)}\r\nSUMMARY:${summary}\r\nDESCRIPTION:${description}\r\nEND:VEVENT\r\n`;
  }

  icsContent += `END:VCALENDAR\r\n`;

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": 'attachment; filename="pathweaver-study-plan.ics"'
    }
  });
}

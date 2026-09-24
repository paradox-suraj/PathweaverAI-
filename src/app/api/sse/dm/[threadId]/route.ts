import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { eventManager } from "@/lib/events";
import { dmService } from "@/server/services/dm.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const isMember = await dmService.isParticipant(threadId, session.user.id);
  if (!isMember) {
    return new Response("Unauthorized", { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial ping
      sendEvent({ type: "ping" });

      const eventName = `dm:${threadId}`;
      const listener = (data: any) => {
        sendEvent({ type: "dm", data });
      };

      eventManager.on(eventName, listener);

      req.signal.addEventListener("abort", () => {
        eventManager.off(eventName, listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

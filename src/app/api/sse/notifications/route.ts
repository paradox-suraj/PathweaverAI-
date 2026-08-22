import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { eventManager, NotificationEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send an initial connected event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Keep-alive ping every 15 seconds to prevent browser/proxy disconnects
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
      }, 15000);

      const handleNotification = (data: NotificationEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      eventManager.on(`notification:${userId}`, handleNotification);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        eventManager.off(`notification:${userId}`, handleNotification);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

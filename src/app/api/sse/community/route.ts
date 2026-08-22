import { NextRequest } from "next/server";
import { eventManager, CommunityCoursePublishedEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Keep-alive ping every 15 seconds to prevent browser/proxy disconnects
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
      }, 15000);

      const handleCommunityCourse = (data: CommunityCoursePublishedEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      eventManager.on("community:course_published", handleCommunityCourse);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        eventManager.off("community:course_published", handleCommunityCourse);
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

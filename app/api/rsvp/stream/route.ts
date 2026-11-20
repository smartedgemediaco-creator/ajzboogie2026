import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const poll = async () => {
        if (closed) return;
        try {
          const rows = await sql`
            SELECT COUNT(*)::text as count FROM rsvps WHERE event_slug = 'ajzboogie-2026'
          `;
          const count = (rows[0] as { count: string })?.count ?? "0";
          safeEnqueue(`data: ${count}\n\n`);
        } catch {
          safeEnqueue(`data: 0\n\n`);
        }
      };

      poll();

      const timer = setInterval(poll, 5000);

      return () => {
        closed = true;
        clearInterval(timer);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
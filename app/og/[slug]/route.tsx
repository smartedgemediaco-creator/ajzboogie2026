import { ImageResponse } from "next/og";
import { getEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const event = await getEvent();

  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(160deg, #161520 0%, #0b0d13 60%, #05060a 100%)",
          fontFamily: "Marcellus",
          color: "#f5efe6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#a89b80",
            marginBottom: 24,
          }}
        >
          New RSVP
        </div>
        <div style={{ fontSize: 48, fontWeight: 600, letterSpacing: 1 }}>
          {event.name}
        </div>
        <div
          style={{
            width: 80,
            height: 1,
            background: "linear-gradient(90deg, transparent, #d4af37, transparent)",
            margin: "28px auto",
          }}
        />
        <div style={{ fontSize: 16, textAlign: "center" }}>
          {event.date}<br />
          {event.venue}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
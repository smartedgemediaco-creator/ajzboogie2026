import { NextResponse } from "next/server";
import { getEvent, getRSVPByCode } from "@/lib/events";
import { generateRSVPPdf } from "@/lib/rsvpPdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";

  if (!code.trim()) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const [rsvp, event] = await Promise.all([getRSVPByCode(code), getEvent()]);

  if (!rsvp || !event) {
    return NextResponse.json({ error: "Invite code not found." }, { status: 404 });
  }

  const pdf = await generateRSVPPdf(event, rsvp.name, rsvp.inviteCode ?? code.trim().toUpperCase());

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="AJZ-2026-Invite-${rsvp.inviteCode ?? "Pass"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

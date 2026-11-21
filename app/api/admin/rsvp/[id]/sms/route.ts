import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendSMS, markSMSAsSent, getRSVPs } from "@/lib/events";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rsvps = await getRSVPs();
    const rsvp = rsvps.find((r) => r.id === id);

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found." }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ajzboogie2026.vercel.app";
    const confirmLink = `${siteUrl}/ajzboogie-2026?invite=1&phone=${encodeURIComponent(rsvp.phone)}`;
    const firstName = rsvp.name.trim().split(/\s+/)[0] || "there";
    const smsMessage = `AJZ 2026: Hi ${firstName}, brotherhood & good food await. Confirm: ${confirmLink}`;

    const result = await sendSMS(rsvp.phone, smsMessage);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await markSMSAsSent(rsvp.phone);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send SMS." }, { status: 500 });
  }
}

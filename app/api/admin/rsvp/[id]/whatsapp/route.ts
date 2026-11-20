import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendWhatsApp, markWhatsAppAsSent, getRSVPs } from "@/lib/events";

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
    // We need the guest's phone and name to send WhatsApp
    // For now, we'll need to fetch the RSVP first
    // But we don't have a getRSVPById function... let's use getRSVPs and find
    const rsvps = await getRSVPs();
    const rsvp = rsvps.find((r) => r.id === id);

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found." }, { status: 404 });
    }

    const whatsappMessage = `Hello ${rsvp.name}, you're invited to AJZ 2026! Confirm your attendance: https://ajzboogie2026.vercel.app/ajzboogie-2026?invite=1&email=${encodeURIComponent(rsvp.email)}`;

    const result = await sendWhatsApp(rsvp.phone, whatsappMessage);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await markWhatsAppAsSent(rsvp.email);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send WhatsApp." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  createRSVP,
  acceptRSVP,
  getEvent,
  EVENT_SLUG,
  type EventConfig,
  type RSVP,
} from "@/lib/events";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: Request) {
  let body: { slug?: string; name?: string; phone?: string; invite?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const invite = body.invite === true;

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 }
    );
  }

  const slug = typeof body.slug === "string" && body.slug ? body.slug : EVENT_SLUG;
  const event = await getEvent();

  if (!event || slug !== EVENT_SLUG) {
    return NextResponse.json(
      { error: "Unknown event." },
      { status: 400 }
    );
  }

  let rsvp: RSVP | null = null;
  let isDuplicate = false;

  if (invite) {
    // Guest clicked the invitation link — mark existing pending record as accepted
    rsvp = await acceptRSVP(phone);
    if (!rsvp) {
      return NextResponse.json(
        { error: "No pending invitation found for this phone number." },
        { status: 404 }
      );
    }
  } else {
    // Direct RSVP form submission — accepted immediately
    const result = await createRSVP({ eventSlug: slug, name, phone }, true);
    rsvp = result.rsvp;
    isDuplicate = result.isDuplicate;
  }

  if (isDuplicate) {
    return NextResponse.json(
      { ok: false, error: "You have already RSVP'd for this event." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}

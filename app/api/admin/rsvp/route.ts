import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRSVP, getEvent } from "@/lib/events";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone number are required." },
      { status: 400 }
    );
  }

  const event = await getEvent();
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const { rsvp, isDuplicate } = await createRSVP(
    { eventSlug: event.slug, name, phone },
    false
  );

  if (isDuplicate) {
    return NextResponse.json(
      { ok: false, error: "This phone number has already RSVP'd." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, rsvp });
}

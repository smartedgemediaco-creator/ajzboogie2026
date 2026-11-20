import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateEventDate, updateEventVenue } from "@/lib/events";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { date?: string; venue?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const date = typeof body.date === "string" ? body.date.trim() : "";
  const venue = typeof body.venue === "string" ? body.venue.trim() : "";

  if (!date && !venue) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if (date) {
    const updated = await updateEventDate(date);
    if (!updated) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
  }

  if (venue) {
    const updated = await updateEventVenue(venue);
    if (!updated) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}

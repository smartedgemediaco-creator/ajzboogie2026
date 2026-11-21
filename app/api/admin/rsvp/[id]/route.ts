import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteRSVP, getRSVPs } from "@/lib/events";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const rsvp = (await getRSVPs()).find((guest) => guest.id === id);

  if (!rsvp) {
    return NextResponse.json({ error: "RSVP not found." }, { status: 404 });
  }

  await deleteRSVP(id);

  return NextResponse.json({ ok: true });
}

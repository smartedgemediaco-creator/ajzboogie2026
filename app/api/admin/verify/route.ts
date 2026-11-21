import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRSVPByCode } from "@/lib/events";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Enter an invite code." }, { status: 400 });
  }

  const rsvp = await getRSVPByCode(code);
  if (!rsvp) {
    return NextResponse.json({ error: "No guest matches this invite code." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, rsvp });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRSVP, getEvent } from "@/lib/events";
import { generateRSVPPdf } from "@/lib/rsvpPdf";
import { Resend } from "resend";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { name?: string; phone?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!name || !phone || !email) {
    return NextResponse.json(
      { error: "Name, phone number, and email are required." },
      { status: 400 }
    );
  }

  const event = await getEvent();
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const { rsvp, isDuplicate } = await createRSVP({
    eventSlug: event.slug,
    name,
    phone,
    email,
  });

  if (isDuplicate) {
    return NextResponse.json(
      { ok: false, error: "This email has already RSVP'd." },
      { status: 409 }
    );
  }

  // Send branded PDF confirmation to the invited guest via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL || "RSVPs <onboarding@resend.dev>";

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const pdfBuffer = await generateRSVPPdf(event, name);

      await resend.emails.send({
        from: resendFrom,
        to: [email],
        subject: `You&rsquo;re invited — ${event.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#0b0d13;font-family:Arial,Helvetica,sans-serif;">
              <div style="max-width:560px;margin:0 auto;background:linear-gradient(160deg,#161520 0%,#0b0d13 60%,#05060a 100%);border:1px solid rgba(212,175,55,0.35);border-radius:16px;padding:48px 40px;color:#f5efe6;">
                <div style="text-align:center;letter-spacing:6px;text-transform:uppercase;font-size:11px;color:#a89b80;margin-bottom:24px;">You&rsquo;re Invited</div>
                <div style="text-align:center;font-size:34px;font-weight:600;letter-spacing:1px;color:#f5efe6;">${escapeHtml(event.name)}</div>
                <div style="width:80px;height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:28px auto;"></div>
                <div style="text-align:center;font-size:16px;color:#f5efe6;margin-bottom:36px;">You have been personally invited by the host.</div>
                <div style="text-align:center;margin-bottom:36px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/ajzboogie-2026?invite=1&email=${encodeURIComponent(email)}" style="display:inline-block;background:#d4af37;color:#0b0d13;padding:14px 32px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Accept Invitation</a>
                </div>
                <div style="text-align:center;font-size:14px;color:#d4af37;margin-bottom:36px;">Your branded invitation PDF is attached.</div>
                <div style="margin-top:24px;text-align:center;font-size:11px;color:rgba(245,239,230,0.5);">Check your junk/spam folder if you don&rsquo;t see it.</div>
                <div style="margin-top:36px;text-align:center;letter-spacing:4px;text-transform:uppercase;font-size:10px;color:rgba(255,255,255,0.4);">Crafted with &hearts; by Afara Digital Solutions</div>
              </div>
            </body>
          </html>
        `,
        attachments: [
          {
            filename: `RSVP-${event.name.replace(/\s+/g, "-")}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });
    } catch (error) {
      console.error("Admin invite email failed:", error);
    }
  }

  return NextResponse.json({ ok: true, rsvp });
}

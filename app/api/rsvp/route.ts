import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import {
  createRSVP,
  getEvent,
  EVENT_SLUG,
  type EventConfig,
} from "@/lib/events";
import { generateRSVPPdf } from "@/lib/rsvpPdf";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildNotificationHtml = (event: EventConfig, name: string, phone: string, email: string) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0b0d13;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:linear-gradient(160deg,#161520 0%,#0b0d13 60%,#05060a 100%);border:1px solid rgba(212,175,55,0.35);border-radius:16px;padding:48px 40px;color:#f5efe6;">
      <div style="text-align:center;letter-spacing:6px;text-transform:uppercase;font-size:11px;color:#a89b80;margin-bottom:24px;">New RSVP</div>
      <div style="text-align:center;font-size:34px;font-weight:600;letter-spacing:1px;color:#f5efe6;">${escapeHtml(event.name)}</div>
      <div style="width:80px;height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:28px auto;"></div>
      <div style="text-align:center;font-size:14px;color:#f5efe6;margin-bottom:36px;">${escapeHtml(event.date)}<br/>${escapeHtml(event.venue)}</div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:16px 18px;width:50%;letter-spacing:3px;text-transform:uppercase;font-size:10px;color:#9a8c70;">Guest Name</td>
          <td style="padding:16px 18px;color:#f5efe6;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:16px 18px;letter-spacing:3px;text-transform:uppercase;font-size:10px;color:#9a8c70;">Phone Number</td>
          <td style="padding:16px 18px;color:#f5efe6;">${escapeHtml(phone)}</td>
        </tr>
        <tr>
          <td style="padding:16px 18px;letter-spacing:3px;text-transform:uppercase;font-size:10px;color:#9a8c70;">Email</td>
          <td style="padding:16px 18px;color:#f5efe6;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding:16px 18px;letter-spacing:3px;text-transform:uppercase;font-size:10px;color:#9a8c70;">RSVP Time</td>
          <td style="padding:16px 18px;color:#f5efe6;">${new Date().toLocaleString()}</td>
        </tr>
      </table>

      <div style="margin-top:24px;text-align:center;font-size:11px;color:rgba(245,239,230,0.5);">Check your junk/spam folder if you don&rsquo;t see it.</div>
      <div style="margin-top:36px;text-align:center;letter-spacing:4px;text-transform:uppercase;font-size:10px;color:rgba(255,255,255,0.4);">Crafted with &hearts; by Afara Digital Solutions</div>
    </div>
  </body>
</html>
`;

export async function POST(request: Request) {
  let body: { slug?: string; name?: string; phone?: string; email?: string; invite?: boolean };
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
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const invite = body.invite === true;

  if (invite) {
    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }
  } else {
    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: "Name, phone number, and email are required." },
        { status: 400 }
      );
    }
  }

  const slug = typeof body.slug === "string" && body.slug ? body.slug : EVENT_SLUG;
  const event = await getEvent();

  if (!event || slug !== EVENT_SLUG) {
    return NextResponse.json(
      { error: "Unknown event." },
      { status: 400 }
    );
  }

  const { isDuplicate } = await createRSVP({ eventSlug: slug, name, phone, email });

  if (isDuplicate) {
    return NextResponse.json(
      { ok: false, error: "You have already RSVP'd for this event." },
      { status: 409 }
    );
  }

  // Send branded PDF confirmation to the guest via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL || "RSVPs <onboarding@resend.dev>";

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const pdfBuffer = await generateRSVPPdf(event, name);

      await resend.emails.send({
        from: resendFrom,
        to: [email],
        subject: `You&rsquo;re on the list — ${event.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#0b0d13;font-family:Arial,Helvetica,sans-serif;">
              <div style="max-width:560px;margin:0 auto;background:linear-gradient(160deg,#161520 0%,#0b0d13 60%,#05060a 100%);border:1px solid rgba(212,175,55,0.35);border-radius:16px;padding:48px 40px;color:#f5efe6;">
                <div style="text-align:center;letter-spacing:6px;text-transform:uppercase;font-size:11px;color:#a89b80;margin-bottom:24px;">RSVP Confirmed</div>
                <div style="text-align:center;font-size:34px;font-weight:600;letter-spacing:1px;color:#f5efe6;">${escapeHtml(event.name)}</div>
                <div style="width:80px;height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:28px auto;"></div>
                <div style="text-align:center;font-size:16px;color:#f5efe6;margin-bottom:36px;">Thank you, ${escapeHtml(name)}. We can&rsquo;t wait to share the night with you.</div>
                <div style="text-align:center;margin-bottom:36px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/ajzboogie-2026" style="display:inline-block;background:#d4af37;color:#0b0d13;padding:14px 32px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Accept Invitation</a>
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
      console.error("Resend confirmation email failed:", error);
    }
  }

  // Notify the host via nodemailer (Zoho SMTP) if configured
  const recipient = process.env.RSVP_NOTIFY_EMAIL;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (recipient && host && user && pass) {
    try {
      const port = Number(process.env.SMTP_PORT || "465");
      const secure = (process.env.SMTP_SECURE || "true").toLowerCase() === "true";

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${event.name}" <${user}>`,
        to: recipient,
        subject: `RSVP — ${name} — ${event.name}`,
        html: buildNotificationHtml(event, name, phone, email),
      });
    } catch (error) {
      console.error("RSVP notification email failed:", error);
    }
  }

  return NextResponse.json({ ok: true });
}

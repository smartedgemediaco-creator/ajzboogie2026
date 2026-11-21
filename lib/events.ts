import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

export type EventConfig = {
  id: string;
  slug: string;
  name: string;
  date: string;
  venue: string;
  video: string;
  kicker: string;
  closingNote: string;
  heroImage?: string;
  theme: "dark" | "light" | "gold";
  createdAt: Date;
  updatedAt: Date;
};

export type RSVP = {
  id: string;
  eventSlug: string;
  name: string;
  phone: string;
  createdAt: Date;
  accepted: boolean;
  smsSent: boolean;
  inviteCode: string | null;
};

export type RSVPInput = Omit<RSVP, "id" | "createdAt" | "accepted" | "smsSent" | "inviteCode">;

const sql = neon(process.env.DATABASE_URL!);

export const EVENT_SLUG = "ajzboogie-2026";

function generateInviteCode(): string {
  const hex = randomBytes(4).toString("hex").toUpperCase();
  return `AJZ26-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export const eventConfig: Omit<EventConfig, "id" | "createdAt" | "updatedAt"> = {
  slug: EVENT_SLUG,
  name: "AJZ 2026",
  date: "To be announced",
  venue: "To be announced",
  video: process.env.NEXT_PUBLIC_VIDEO_URL || "/videos/hero.mp4",
  heroImage: "/images/hero-poster.jpg",
  kicker: "Reunited in brotherhood - Premium e-invite experience by Àfárà Digital Solutions",
  closingNote: "Your presence completes the frequency",
  theme: "dark",
};

export async function getEvent(): Promise<EventConfig | null> {
  try {
    const rows = await sql`
      SELECT * FROM events WHERE slug = ${EVENT_SLUG} LIMIT 1
    `;
    return (rows[0] as EventConfig) ?? null;
  } catch {
    return {
      id: "",
      slug: eventConfig.slug,
      name: eventConfig.name,
      date: eventConfig.date,
      venue: eventConfig.venue,
      video: eventConfig.video,
      kicker: eventConfig.kicker,
      closingNote: eventConfig.closingNote,
      heroImage: eventConfig.heroImage,
      theme: eventConfig.theme,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function ensureEventExists(): Promise<EventConfig> {
  const existing = await getEvent();
  if (existing) return existing;

  try {
    const rows = await sql`
      INSERT INTO events (slug, name, date, venue, video, hero_image, kicker, closing_note, theme)
      VALUES (${eventConfig.slug}, ${eventConfig.name}, ${eventConfig.date}, ${eventConfig.venue}, ${eventConfig.video}, ${eventConfig.heroImage ?? null}, ${eventConfig.kicker}, ${eventConfig.closingNote}, ${eventConfig.theme})
      RETURNING *
    `;
    return rows[0] as EventConfig;
  } catch {
    return {
      id: "",
      slug: eventConfig.slug,
      name: eventConfig.name,
      date: eventConfig.date,
      venue: eventConfig.venue,
      video: eventConfig.video,
      kicker: eventConfig.kicker,
      closingNote: eventConfig.closingNote,
      heroImage: eventConfig.heroImage,
      theme: eventConfig.theme,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function createRSVP(input: RSVPInput, accepted: boolean = false): Promise<{ rsvp: RSVP; isDuplicate: boolean }> {
  const existing = await getRSVPByPhone(input.eventSlug, input.phone);
  if (existing) {
    return { rsvp: existing, isDuplicate: true };
  }

  try {
    const rows = await sql`
      INSERT INTO rsvps (event_slug, name, phone, accepted, whatsapp_sent, invite_code)
      VALUES (${input.eventSlug}, ${input.name}, ${input.phone}, ${accepted}, false, ${accepted ? generateInviteCode() : null})
      RETURNING *
    `;
    return { rsvp: {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      createdAt: new Date(rows[0].created_at),
      accepted: rows[0].accepted,
      smsSent: rows[0].whatsapp_sent,
      inviteCode: rows[0].invite_code,
    }, isDuplicate: false };
  } catch {
    return {
      rsvp: {
        id: "",
        eventSlug: input.eventSlug,
        name: input.name,
        phone: input.phone,
        createdAt: new Date(),
        accepted: false,
        smsSent: false,
        inviteCode: null,
      },
      isDuplicate: false,
    };
  }
}

export async function acceptRSVP(phone: string): Promise<RSVP | null> {
  try {
    const rows = await sql`
      UPDATE rsvps
      SET accepted = true, invite_code = COALESCE(invite_code, ${generateInviteCode()})
      WHERE phone = ${phone}
      RETURNING *
    `;
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      createdAt: new Date(rows[0].created_at),
      accepted: rows[0].accepted,
      smsSent: rows[0].whatsapp_sent,
      inviteCode: rows[0].invite_code,
    } as RSVP;
  } catch {
    return null;
  }
}

export async function getRSVPByPhone(eventSlug: string, phone: string): Promise<RSVP | null> {
  try {
    const rows = await sql`
      SELECT * FROM rsvps WHERE event_slug = ${eventSlug} AND phone = ${phone} LIMIT 1
    `;
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      createdAt: new Date(rows[0].created_at),
      accepted: rows[0].accepted,
      smsSent: rows[0].whatsapp_sent,
      inviteCode: rows[0].invite_code,
    } as RSVP;
  } catch {
    return null;
  }
}

export async function getRSVPs(): Promise<RSVP[]> {
  try {
    const rows = await sql`SELECT * FROM rsvps WHERE event_slug = ${EVENT_SLUG} ORDER BY created_at DESC`;
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      eventSlug: row.event_slug as string,
      name: row.name as string,
      phone: row.phone as string,
      createdAt: new Date(row.created_at as string),
      accepted: row.accepted as boolean,
      smsSent: row.whatsapp_sent as boolean,
      inviteCode: (row.invite_code as string | null) ?? null,
    })) as RSVP[];
  } catch {
    return [];
  }
}

export async function getRSVPByCode(code: string): Promise<RSVP | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const rows = await sql`
      SELECT * FROM rsvps
      WHERE event_slug = ${EVENT_SLUG} AND UPPER(invite_code) = ${cleanCode}
      LIMIT 1
    `;
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      createdAt: new Date(rows[0].created_at),
      accepted: rows[0].accepted,
      smsSent: rows[0].whatsapp_sent,
      inviteCode: rows[0].invite_code,
    } as RSVP;
  } catch {
    return null;
  }
}

export async function markSMSAsSent(phone: string): Promise<void> {
  try {
    await sql`UPDATE rsvps SET whatsapp_sent = true WHERE phone = ${phone}`;
  } catch {
    // silently fail
  }
}

function normalizePhoneRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const username = process.env.EBULKSMS_USERNAME;
  const apiKey = process.env.EBULKSMS_API_KEY;
  const senderId = process.env.EBULKSMS_SENDER_ID || "AJZ2026";

  if (!username) {
    return { success: false, error: "EBULKSMS_USERNAME not configured" };
  }
  if (!apiKey) {
    return { success: false, error: "EBULKSMS_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.ebulksms.com/sendsms.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        SMS: {
          auth: { username, apikey: apiKey },
          message: { sender: senderId, messagetext: message, flash: "0" },
          recipients: {
            gsm: [{ msidn: normalizePhoneRecipient(to), msgid: crypto.randomUUID() }],
          },
          dndsender: "0",
        },
      }),
    });

    const data = await res.json().catch(() => null);
    const statusKey = typeof data?.response?.status === "string" ? data.response.status : "";

    if (res.ok && statusKey === "SUCCESS") {
      return { success: true };
    }

    const friendlyErrors: Record<string, string> = {
      AUTH_FAILURE: "EbulkSMS username or API key is incorrect.",
      MISSING_USERNAME: "EBULKSMS_USERNAME is missing.",
      MISSING_APIKEY: "EBULKSMS_API_KEY is missing.",
      MISSING_SENDER: "EBULKSMS_SENDER_ID is missing.",
      INVALID_SENDER: "EbulkSMS sender name is invalid.",
      INVALID_RECIPIENT: "The phone number is invalid.",
      INVALID_MESSAGE: "The SMS message is invalid or too long.",
      INSUFFICIENT_CREDIT: "EbulkSMS wallet balance is too low.",
    };

    return {
      success: false,
      error:
        friendlyErrors[statusKey] ||
        statusKey ||
        (data ? JSON.stringify(data) : `EbulkSMS request failed with status ${res.status}.`),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteRSVP(id: string): Promise<void> {
  try {
    await sql`DELETE FROM rsvps WHERE id = ${id}`;
  } catch {
    // silently fail
  }
}

export async function getRSVPCount(): Promise<number> {
  try {
    const rows = await sql`SELECT COUNT(*) as count FROM rsvps WHERE event_slug = ${EVENT_SLUG} AND accepted = true`;
    return Number((rows[0] as { count: string | number })?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function updateEventDate(date: string): Promise<EventConfig | null> {
  try {
    const rows = await sql`
      UPDATE events SET date = ${date}, updated_at = NOW() WHERE slug = ${EVENT_SLUG}
      RETURNING *
    `;
    return (rows[0] as EventConfig) ?? null;
  } catch {
    return null;
  }
}

export async function updateEventVenue(venue: string): Promise<EventConfig | null> {
  try {
    const rows = await sql`
      UPDATE events SET venue = ${venue}, updated_at = NOW() WHERE slug = ${EVENT_SLUG}
      RETURNING *
    `;
    return (rows[0] as EventConfig) ?? null;
  } catch {
    return null;
  }
}

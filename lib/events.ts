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
  whatsappSent: boolean;
};

export type RSVPInput = Omit<RSVP, "id" | "createdAt" | "accepted" | "whatsappSent">;

const sql = neon(process.env.DATABASE_URL!);

export const EVENT_SLUG = "ajzboogie-2026";

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
      INSERT INTO rsvps (event_slug, name, phone, accepted, whatsapp_sent)
      VALUES (${input.eventSlug}, ${input.name}, ${input.phone}, ${accepted}, false)
      RETURNING *
    `;
    return { rsvp: {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      createdAt: new Date(rows[0].created_at),
      accepted: rows[0].accepted,
      whatsappSent: rows[0].whatsapp_sent,
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
        whatsappSent: false,
      },
      isDuplicate: false,
    };
  }
}

export async function acceptRSVP(phone: string): Promise<RSVP | null> {
  try {
    const rows = await sql`
      UPDATE rsvps SET accepted = true WHERE phone = ${phone}
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
      whatsappSent: rows[0].whatsapp_sent,
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
      whatsappSent: rows[0].whatsapp_sent,
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
      whatsappSent: row.whatsapp_sent as boolean,
    })) as RSVP[];
  } catch {
    return [];
  }
}

export async function markWhatsAppAsSent(phone: string): Promise<void> {
  try {
    await sql`UPDATE rsvps SET whatsapp_sent = true WHERE phone = ${phone}`;
  } catch {
    // silently fail
  }
}

export async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDCHAMP_API_KEY;
  const senderName = process.env.SENDCHAMP_SENDER_NAME || "AJZ 2026";

  if (!apiKey) {
    return { success: false, error: "SENDCHAMP_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.sendchamp.com/api/v1/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: [to],
        message,
        sender_name: senderName,
        route: "international",
      }),
    });

    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: JSON.stringify(data) };
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

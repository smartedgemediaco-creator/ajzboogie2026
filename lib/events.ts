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
  email: string;
  createdAt: Date;
};

export type RSVPInput = Omit<RSVP, "id" | "createdAt">;

const sql = neon(process.env.DATABASE_URL!);

export const EVENT_SLUG = "ajzboogie-2026";

export const eventConfig: Omit<EventConfig, "id" | "createdAt" | "updatedAt"> = {
  slug: EVENT_SLUG,
  name: "AJZ 2026",
  date: "To be announced",
  venue: "To be announced",
  video: "/videos/hero.mp4",
  heroImage: "/images/hero-poster.jpg",
  kicker: "Reunited in brotherhood",
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

export async function createRSVP(input: RSVPInput): Promise<{ rsvp: RSVP; isDuplicate: boolean }> {
  const existing = await getRSVPByEmail(input.eventSlug, input.email);
  if (existing) {
    return { rsvp: existing, isDuplicate: true };
  }

  try {
    const rows = await sql`
      INSERT INTO rsvps (event_slug, name, phone, email)
      VALUES (${input.eventSlug}, ${input.name}, ${input.phone}, ${input.email})
      RETURNING *
    `;
    return { rsvp: {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      email: rows[0].email,
      createdAt: new Date(rows[0].created_at),
    }, isDuplicate: false };
  } catch {
    return {
      rsvp: {
        id: "",
        eventSlug: input.eventSlug,
        name: input.name,
        phone: input.phone,
        email: input.email,
        createdAt: new Date(),
      },
      isDuplicate: false,
    };
  }
}

export async function getRSVPByEmail(eventSlug: string, email: string): Promise<RSVP | null> {
  try {
    const rows = await sql`
      SELECT * FROM rsvps WHERE event_slug = ${eventSlug} AND email = ${email} LIMIT 1
    `;
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      eventSlug: rows[0].event_slug,
      name: rows[0].name,
      phone: rows[0].phone,
      email: rows[0].email,
      createdAt: new Date(rows[0].created_at),
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
      email: row.email as string,
      createdAt: new Date(row.created_at as string),
    })) as RSVP[];
  } catch {
    return [];
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
    const rows = await sql`SELECT COUNT(*) as count FROM rsvps WHERE event_slug = ${EVENT_SLUG}`;
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
# AJB Oogie — Cinematic E-Invitation

A Next.js 15 e-invitation experience for AJB Oogie, built with Neon Postgres, Tailwind CSS v4, Framer Motion, and Nodemailer.

## Features

- **Cinematic intro** — Single-tap entry with Web Audio API sounds (click, orchestral swell, outro), mute toggle, skip option, and reduced-motion support
- **Scene flow** — Intro gate → "you are invited" reveal → fullscreen video (hero.mp4 from bin) → scroll-unlocked RSVP details
- **RSVP form** — Name + phone submission with HTML email notification via Nodemailer (Zoho Mail SMTP)
- **Realtime RSVP count** — Server-Sent Events polling updates the guest count live without page reload
- **Admin dashboard** — Password-protected admin area to view all RSVPs with timestamps
- **OG image generation** — Dynamic social sharing cards via Next.js Image Response
- **Database** — Neon Postgres with events and rsvps tables, realtime-ready schema

## Tech Stack

- Next.js 15 (App Router, Turbopack)
- React 19, TypeScript
- Tailwind CSS v4
- Framer Motion (animations)
- Neon Postgres (@neondatabase/serverless)
- Nodemailer (email notifications)
- Lucide React (icons)

## Project Structure

```
ajzboogie/
├── app/
│   ├── page.tsx                    # Redirect to event slug
│   ├── layout.tsx                  # Root layout with Inter font
│   ├── globals.css                 # Global styles
│   ├── IntroGate.tsx               # Cinematic single-tap intro
│   ├── [slug]/page.tsx             # Dynamic event route
│   ├── og/[slug]/route.tsx         # OG image generation
│   ├── api/
│   │   ├── rsvp/route.ts           # RSVP POST + email
│   │   ├── rsvp/stream/route.ts    # SSE realtime count
│   │   └── admin/login/route.ts    # Admin auth
│   ├── admin/
│   │   ├── login/page.tsx          # Admin login
│   │   └── dashboard/page.tsx      # RSVP management (server)
│   └── components/
│       ├── InviteExperience.tsx    # Stage orchestrator
│       ├── AdminDashboard.tsx      # Admin UI client component
│       ├── SceneOne/               # "you are invited" reveal
│       ├── SceneTwo/               # Video player + scroll unlock
│       └── SceneThree/             # Details + RSVP form
├── lib/
│   ├── events.ts                   # Event config + Neon DB queries
│   └── schema.sql                  # Database schema
├── public/
│   ├── videos/
│   │   └── hero.mp4                # Renamed from "Ajz Boogie renewed.mp4"
│   └── images/
│       └── hero-poster.jpg         # Video poster (add your own)
├── .env.local                      # Local environment (create from .env.example)
├── .env.example                    # Environment template
├── lib/schema.sql                  # Neon Postgres schema
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `RSVP_NOTIFY_EMAIL` | Email that receives RSVP notifications |
| `SMTP_HOST` | SMTP host (e.g. smtp.zoho.com) |
| `SMTP_PORT` | SMTP port (465 for SSL, 587 for STARTTLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app-specific password |
| `SMTP_SECURE` | `true` for SSL on 465, `false` for STARTTLS on 587 |
| `ADMIN_PASSWORD` | Password for admin dashboard access |
| `EBULKSMS_USERNAME` | EbulkSMS login email |
| `EBULKSMS_API_KEY` | EbulkSMS API key |
| `EBULKSMS_SENDER_ID` | Sender name for SMS invitations, e.g. `AJZ2026` (max 11 alphanumeric characters) |

### 3. Set up the database

Run the schema in your Neon SQL Editor or via the Neon CLI:

```bash
neon sql < lib/schema.sql
```

This creates the `events` and `rsvps` tables and inserts the AJB Oogie event.

### 4. Add media files

- Place your event video at `public/videos/hero.mp4` (already copied from `bin/Ajz Boogie renewed.mp4`)
- Add a poster image at `public/images/hero-poster.jpg` (optional, used as video placeholder)

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the invitation.

### 6. Admin dashboard

Access the admin area at [http://localhost:3000/admin](http://localhost:3000/admin) and log in with the `ADMIN_PASSWORD` from your `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Database Schema

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date VARCHAR(255) NOT NULL,
  venue VARCHAR(500) NOT NULL,
  video VARCHAR(500) NOT NULL,
  hero_image VARCHAR(500),
  kicker VARCHAR(500) NOT NULL,
  closing_note VARCHAR(500) NOT NULL,
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug VARCHAR(255) NOT NULL REFERENCES events(slug) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Deployment

Deploy on Vercel:

```bash
vercel
```

Make sure to add all environment variables in your Vercel project settings, including `DATABASE_URL` pointing to your Neon database.

## License

Private — Afara Digital Solutions
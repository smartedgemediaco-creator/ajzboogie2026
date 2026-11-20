import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEvent, getRSVPCount, ensureEventExists, EVENT_SLUG } from "@/lib/events";
import InviteExperience from "@/app/components/InviteExperience/InviteExperience";

export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: EVENT_SLUG }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent();

  if (!event || slug !== EVENT_SLUG) {
    return { title: "Invite Not Found" };
  }

  return {
    title: event.name,
    description: `${event.date} · ${event.venue}`,
    openGraph: {
      title: event.name,
      description: `You are invited. ${event.date} · ${event.venue}.`,
      url: `/${event.slug}`,
      type: "website",
      images: [
        {
          url: `/og/${event.slug}`,
          width: 1200,
          height: 630,
          alt: `${event.name} — tap to begin`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: event.name,
      description: `${event.date} · ${event.venue}`,
      images: [`/og/${event.slug}`],
    },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== EVENT_SLUG) {
    notFound();
  }

  await ensureEventExists();
  const event = await getEvent();
  const count = await getRSVPCount();

  if (!event) {
    notFound();
  }

  return <InviteExperience event={event} initialRsvpCount={count} />;
}
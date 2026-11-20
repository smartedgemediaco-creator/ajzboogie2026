"use client";

import { useState, useEffect } from "react";
import type { EventConfig } from "@/lib/events";
import SceneThree from "@/app/components/SceneThree/SceneThree";

export default function InviteExperience({
  event,
  initialRsvpCount,
}: {
  event: EventConfig;
  initialRsvpCount: number;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <SceneThree data={event} initialCount={initialRsvpCount} />
    </main>
  );
}

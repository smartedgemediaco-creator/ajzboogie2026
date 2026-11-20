"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { EventConfig } from "@/lib/events";
import IntroGate from "@/app/IntroGate";
import SceneOne from "@/app/components/SceneOne/SceneOne";
import SceneTwo from "@/app/components/SceneTwo/SceneTwo";
import SceneThree from "@/app/components/SceneThree/SceneThree";

type Stage = "intro" | "scene1" | "scene2";

const smoothScrollTo = (targetY: number, duration = 1500) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  let start: number | null = null;

  const easeInOutQuad = (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const step = (timestamp: number) => {
    if (!start) start = timestamp;
    const time = timestamp - start;
    const percent = Math.min(time / duration, 1);
    const eased = easeInOutQuad(percent);

    window.scrollTo(0, startY + diff * eased);

    if (time < duration) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

export default function InviteExperience({
  event,
  initialRsvpCount,
}: {
  event: EventConfig;
  initialRsvpCount: number;
}) {
  const [stage, setStage] = useState<Stage>("intro");
  const [scrollUnlocked, setScrollUnlocked] = useState(false);
  const sceneThreeRef = useRef<HTMLDivElement | null>(null);
  const didScrollToSceneThreeRef = useRef(false);

  useEffect(() => {
    if ((stage === "intro" || stage === "scene1" || stage === "scene2") && !scrollUnlocked) {
      document.body.classList.add("lock-scroll");
    } else {
      document.body.classList.remove("lock-scroll");
    }
    return () => {
      document.body.classList.remove("lock-scroll");
    };
  }, [stage, scrollUnlocked]);

  useEffect(() => {
    if (!scrollUnlocked) return;
    if (didScrollToSceneThreeRef.current) return;

    const target = sceneThreeRef.current;
    if (!target) return;

    const checkAndScroll = () => {
      const scrollH = document.documentElement.scrollHeight;
      const offsetT = target.offsetTop;

      if (scrollH > offsetT) {
        smoothScrollTo(offsetT, 2000);
        didScrollToSceneThreeRef.current = true;
      } else {
        requestAnimationFrame(checkAndScroll);
      }
    };

    requestAnimationFrame(checkAndScroll);
  }, [scrollUnlocked]);

  return (
    <main className="min-h-screen bg-black text-white">
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <IntroGate key="intro" onEnter={() => setStage("scene1")} />
        )}

        {stage === "scene1" && (
          <SceneOne key="scene1" onFinish={() => setStage("scene2")} />
        )}
      </AnimatePresence>

      {stage === "scene2" && (
        <SceneTwo
          key="scene2"
          videoSrc={event.video}
          onFirstVideoComplete={() => {}}
          onRequestUnlock={() => {
            setScrollUnlocked(true);
          }}
        />
      )}

      <div
        ref={sceneThreeRef}
        style={{ display: scrollUnlocked ? "block" : "none" }}
      >
        <SceneThree data={event} initialCount={initialRsvpCount} />
      </div>
    </main>
  );
}
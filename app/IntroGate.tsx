"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroGateProps {
  onEnter: () => void;
}

function splitLetters(text: string) {
  return text.split("").map((char, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
      style={{ display: "inline-block" }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  ));
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  try {
    return new AudioCtx();
  } catch {
    return null;
  }
}

function playClick(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

function playSwell(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.25, now + 2.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 8);
  master.connect(ctx.destination);

  [164.81, 220, 277.18, 329.63].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(master);
    osc.start(now);
    osc.stop(now + 8.2);
  });
}

function playOutro(ctx: AudioContext, onEnd: () => void) {
  const now = ctx.currentTime;
  const duration = 1.8;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(ctx.destination);

  [329.63, 392, 440, 523.25].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  });

  setTimeout(() => {
    try { ctx.close(); } catch {}
    onEnd();
  }, duration * 1000);
}

export default function IntroGate({ onEnter }: IntroGateProps) {
  const [exiting, setExiting] = useState(false);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [audioCtx] = useState(() => createAudioContext());
  const overlayRef = useRef<HTMLDivElement>(null);
  const swellPlayedRef = useRef(false);
  const audioStartedRef = useRef(false);

  const resumeAudio = useCallback(async () => {
    const ctx = audioCtx;
    if (!ctx || audioStartedRef.current) return;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    audioStartedRef.current = true;
  }, [audioCtx]);

  useEffect(() => {
    const ctx = audioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      const onPointerDown = async () => {
        await resumeAudio();
      };
      window.addEventListener("pointerdown", onPointerDown, { once: true, passive: true });
      return () => window.removeEventListener("pointerdown", onPointerDown);
    }
    audioStartedRef.current = true;
    return undefined;
  }, [audioCtx, resumeAudio]);

  const handleEnter = useCallback(async () => {
    if (exiting) return;
    await resumeAudio();
    const ctx = audioCtx;
    if (ctx && !prefersReducedMotion) playClick(ctx);
    setExiting(true);
  }, [exiting, audioCtx, prefersReducedMotion, resumeAudio]);

  useEffect(() => {
    if (!exiting) return;

    const FADE_MS = 600;
    overlayRef.current?.classList.add("fade-out");

    const timer = setTimeout(() => {
      const ctx = audioCtx;
      if (ctx && !prefersReducedMotion && !swellPlayedRef.current) {
        playSwell(ctx);
        swellPlayedRef.current = true;
        setTimeout(() => {
          playOutro(ctx, () => {
            onEnter();
          });
        }, 2500);
      } else if (ctx && !prefersReducedMotion) {
        playOutro(ctx, () => {
          onEnter();
        });
      } else {
        try { ctx?.close(); } catch {}
        onEnter();
      }
    }, FADE_MS);

    return () => clearTimeout(timer);
  }, [exiting, onEnter, audioCtx, prefersReducedMotion]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleEnter();
    }
  };

  return (
    <motion.div
      ref={overlayRef}
      onClick={handleEnter}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Invitation introduction"
      aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "#000",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      className="cursor-pointer intro-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 1.2, ease: "easeInOut" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/10 mb-12"
          style={{ boxShadow: "0 0 40px rgba(212, 175, 55, 0.15)" }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.p
          className="text-center text-xl md:text-5xl tracking-[0.5em] uppercase font-light leading-tight"
          style={{
            color: "#F5EFE6",
            fontFamily: "var(--font-marcellus)",
            letterSpacing: "0.5em",
            textShadow: "0 0 30px rgba(212, 175, 55, 0.2)",
          }}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 1.1 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {splitLetters("tap to begin…")}
        </motion.p>
      </AnimatePresence>

      <style jsx global>{`
        .intro-overlay.fade-out {
          animation: fadeOut 0.6s ease-in-out forwards;
        }
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
        @media (prefers-reduced-motion: reduce) {
          .intro-overlay.fade-out {
            animation: none;
            opacity: 0;
            visibility: hidden;
          }
        }
      `}</style>
    </motion.div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { EventConfig } from "@/lib/events";
import styles from "./SceneThree.module.css";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (delay: number = 0) => {
  const transition = { delay, duration: 1.2, ease: EASE };
  return {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    transition,
    viewport: { once: true, margin: "-80px" },
  };
};

const galleryImages = [
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251878/1a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251877/2a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251878/3a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251878/4a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251878/6a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251878/7a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251878/8a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251879/9a.jpg",
  "https://res.cloudinary.com/oyp2arv8/image/upload/v1795251879/10a.jpg",
];

export default function SceneThree({ data, initialCount }: { data: EventConfig; initialCount: number }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [rsvpCount, setRsvpCount] = useState(initialCount);
  const [inviteMode, setInviteMode] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("invite") === "1" && params.get("phone")) {
      setInviteMode(true);
      setInvitePhone(params.get("phone")!);
      setPhone(params.get("phone")!);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: data.slug,
          name: name.trim(),
          phone: phone.trim(),
          invite: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 409) {
          setAlreadySubmitted(true);
          setSending(false);
          return;
        }
        throw new Error(errData?.error || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      if (!alreadySubmitted) setSending(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (sending) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: data.slug,
          name: name.trim(),
          phone: invitePhone,
          invite: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 409) {
          setAlreadySubmitted(true);
          setSending(false);
          return;
        }
        throw new Error(errData?.error || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      if (!alreadySubmitted) setSending(false);
    }
  };

  return (
    <section className={styles.container}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.glowTwo} aria-hidden />

      <div className={styles.inner}>
        <motion.p {...fadeUp(0.1)} className={styles.kicker}>
          {data.kicker}
        </motion.p>

        <motion.h2 {...fadeUp(0.35)} className={styles.title}>
          You Are <span className={styles.titleAccent}>Invited</span>
        </motion.h2>

        <motion.div {...fadeUp(0.5)} className={styles.count}>
          <span className={styles.countNumber}>{rsvpCount}</span>
          <span className={styles.countLabel}>guests confirmed</span>
        </motion.div>

        <motion.div {...fadeUp(0.6)} className={styles.divider} aria-hidden />

        <motion.div {...fadeUp(0.85)} className={styles.details}>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>The Date</span>
            <span className={`${styles.detailValue} ${data.date.toLowerCase().includes("to be announced") || data.date.toLowerCase().includes("tbd") ? styles.detailTbd : ""}`}>
              {data.date.toLowerCase().includes("to be announced") || data.date.toLowerCase().includes("tbd") ? "TBD — To be announced" : data.date}
            </span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>The Venue</span>
            <span className={`${styles.detailValue} ${data.venue.toLowerCase().includes("to be announced") || data.venue.toLowerCase().includes("tbd") ? styles.detailTbd : ""}`}>
              {data.venue.toLowerCase().includes("to be announced") || data.venue.toLowerCase().includes("tbd") ? "TBD — To be announced" : data.venue}
            </span>
          </div>
        </motion.div>

        <motion.div {...fadeUp(1.2)} className={styles.rsvpCard}>
          <p className={styles.rsvpLabel}>RSVP</p>

          {(submitted || alreadySubmitted) ? (
            <motion.div
              className={styles.confirmation}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <span className={styles.confirmationMark} aria-hidden>
                ✦
              </span>
              <p className={styles.confirmationTitle}>
                {alreadySubmitted ? "You're already on the list" : "You're on the list"}
              </p>
              {alreadySubmitted ? (
                <p className={styles.confirmationSub}>
                  We already have your RSVP, {name.trim() || invitePhone}. No need to submit again.
                </p>
              ) : (
                <>
                  <p className={styles.confirmationSub}>
                    Thank you, {name.trim() || invitePhone}. We can&apos;t wait to share the night with you.
                  </p>
                </>
              )}
            </motion.div>
          ) : inviteMode ? (
            <>
              <p className={styles.confirmationSub}>
                You&apos;re invited, {invitePhone}. Accept to confirm your spot.
              </p>
              <form className={styles.form} onSubmit={(e) => {
                e.preventDefault();
                void handleAcceptInvite();
              }}>
                <div className={styles.field}>
                  <label htmlFor="rsvp-name" className={styles.fieldLabel}>
                    Full Name (optional)
                  </label>
                  <input
                    id="rsvp-name"
                    type="text"
                    autoComplete="name"
                    className={styles.input}
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={sending}
                >
                  {sending ? "Accepting…" : "Accept Invitation"}
                </button>
                {error && <p className={styles.formError}>{error}</p>}
              </form>
            </>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="rsvp-name" className={styles.fieldLabel}>
                  Full Name
                </label>
                <input
                  id="rsvp-name"
                  type="text"
                  autoComplete="name"
                  className={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={sending}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="rsvp-phone" className={styles.fieldLabel}>
                  Phone Number
                </label>
                <input
                  id="rsvp-phone"
                  type="tel"
                  autoComplete="tel"
                  className={styles.input}
                  placeholder="080 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={sending}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={sending}
              >
                {sending ? "Sending…" : "I Will Be There"}
              </button>

              {error && <p className={styles.formError}>{error}</p>}
            </form>
          )}
        </motion.div>

        {/* Premium Gallery */}
        <motion.div {...fadeUp(1.2)} className={styles.gallerySection}>
          <h2 className={styles.galleryTitle}>Moments Preserved</h2>
          <div className={styles.galleryGrid}>
            {galleryImages.map((src, i) => (
              <div
                key={i}
                className={styles.galleryItem}
                onClick={() => {
                  setGalleryIndex(i);
                  setGalleryOpen(true);
                }}
              >
                <img
                  src={src}
                  alt={`AJB Oogie ${i + 1}`}
                  className={styles.galleryImage}
                  loading="lazy"
                />
                <div className={styles.galleryOverlay}>
                  <span className={styles.galleryCount}>{i + 1} / {galleryImages.length}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Event Video */}
        <motion.div {...fadeUp(1.2)} className={styles.videoSection}>
          <h2 className={styles.galleryTitle}>Event Highlights</h2>
          <div className={styles.videoWrapper}>
            <video
              ref={null}
              className={styles.video}
              controls
              playsInline
              loop={true}
              poster=""
              preload="metadata"
            >
              <source
                src={`https://res.cloudinary.com/oyp2arv8/video/upload/f_mp4,vc:h264,ac:aac,q_auto/v1795165754/Ajz_Boogie_renewed.mp4`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className={styles.videoCaption}>
            AJZ 2026 — Reunited in Brotherhood
          </p>
        </motion.div>

        {/* Lightbox Modal */}
        {galleryOpen && (
          <div
            className={styles.lightboxOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setGalleryOpen(false);
            }}
          >
            <div className={styles.lightbox} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setGalleryOpen(false)}
                className={styles.lightboxClose}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)}
                className={styles.lightboxPrev}
                aria-label="Previous"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <img
                src={galleryImages[galleryIndex]}
                alt={`AJB Oogie ${galleryIndex + 1}`}
                className={styles.lightboxImage}
              />
              <button
                onClick={() => setGalleryIndex((i) => (i + 1) % galleryImages.length)}
                className={styles.lightboxNext}
                aria-label="Next"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className={styles.lightboxCaption}>
                {galleryIndex + 1} / {galleryImages.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

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

export default function SceneThree({ data, initialCount }: { data: EventConfig; initialCount: number }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [rsvpCount, setRsvpCount] = useState(initialCount);
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("invite") === "1" && params.get("email")) {
      setInviteMode(true);
      setInviteEmail(params.get("email")!);
      setEmail(params.get("email")!);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || sending) return;

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
          email: email.trim(),
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
          phone: phone.trim(),
          email: inviteEmail,
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
                  We already have your RSVP, {name.trim() || inviteEmail}. No need to submit again.
                </p>
              ) : (
                <>
                  <p className={styles.confirmationSub}>
                    Thank you, {name.trim() || inviteEmail}. We can&apos;t wait to share the night with you.
                  </p>
                  <p className={styles.confirmationJunk}>
                    Check your junk/spam folder if you don&apos;t see it.
                  </p>
                </>
              )}
            </motion.div>
          ) : inviteMode ? (
            <>
              <p className={styles.confirmationSub}>
                You&apos;re invited, {inviteEmail}. Accept to confirm your spot.
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
                <div className={styles.field}>
                  <label htmlFor="rsvp-phone" className={styles.fieldLabel}>
                    Phone Number (optional)
                  </label>
                  <input
                    id="rsvp-phone"
                    type="tel"
                    autoComplete="tel"
                    className={styles.input}
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  placeholder="Your full name"
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
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={sending}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="rsvp-email" className={styles.fieldLabel}>
                  Email Address
                </label>
                <input
                  id="rsvp-email"
                  type="email"
                  autoComplete="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

        <motion.p {...fadeUp(1.5)} className={styles.closing}>
          {data.closingNote}
        </motion.p>
      </div>
    </section>
  );
}

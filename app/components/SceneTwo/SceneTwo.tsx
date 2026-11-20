"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import styles from "./SceneTwo.module.css";

interface SceneTwoProps {
  videoSrc: string;
  onRequestUnlock: () => void;
  onFirstVideoComplete?: () => void;
}

export default function SceneTwo({
  videoSrc,
  onRequestUnlock,
  onFirstVideoComplete,
}: SceneTwoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [isFixed, setIsFixed] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [userStarted, setUserStarted] = useState(false);
  const releaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startReleaseSequence = useCallback(() => {
    if (isReleasing || !isFixed) return;

    setIsReleasing(true);
    releaseTimerRef.current = setTimeout(() => {
      setIsFixed(false);
      requestAnimationFrame(() => {
        onRequestUnlock();
      });
    }, 400);
  }, [isReleasing, isFixed, onRequestUnlock]);

  const handleVideoEnd = useCallback(() => {
    if (!hasCompletedOnce) {
      setHasCompletedOnce(true);
      onFirstVideoComplete?.();
      startReleaseSequence();
    }
    setIsPlaying(false);
  }, [hasCompletedOnce, onFirstVideoComplete, startReleaseSequence]);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsReleasing(false);
    setHasCompletedOnce(false);
    setIsFixed(true);
    setUserStarted(false);
    setIsMuted(true);

    video.currentTime = 0;
    video.muted = true;
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = false;
      setIsMuted(false);
      video.play().then(() => {
        setUserStarted(true);
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [isPlaying]);

  const handleVideoError = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    if (!userStarted && !hasCompletedOnce) {
      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.play().then(() => setIsPlaying(true)).catch(() => {
          // Autoplay blocked (iOS) — play button shows
        });
      }
    }
  }, [userStarted, hasCompletedOnce]);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    };
  }, []);

  return (
    <section
      className={`${styles.sceneTwoContainer} ${isFixed ? styles.fixed : ""}`}
      role="region"
      aria-label="Event video"
    >
      <motion.div
        className={styles.videoWrapper}
        initial={{ opacity: 1 }}
        animate={{ opacity: isReleasing ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          loop={false}
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          onCanPlay={handleCanPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          poster=""
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {!hasCompletedOnce && (
          <>
            <button
              onClick={handleToggleMute}
              className={styles.muteButton}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5L6 9l2 4V9l5 5v-3.5l4.5 4.5L19 8l-5-5zM19.5 4.5L17 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 5h6.4M5 5h6a9 9 0 019 9v2.4M5 5v12c0 5.5 4.5 10 10 10h5.5M18 18h.01" />
                </svg>
              )}
            </button>

            <button
              onClick={handlePlayPause}
              className={styles.playPauseButton}
              aria-label={isPlaying ? "Pause" : "Play"}
              aria-pressed={isPlaying}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          </>
        )}
      </motion.div>

      {hasCompletedOnce && (
        <div className={styles.replayControls}>
          <button onClick={handleReplay} className={styles.replayButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5V1L7 6l5 5V7c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H4c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z" />
            </svg>
            <span>REPLAY</span>
          </button>
        </div>
      )}

      <div className={styles.scrollHint} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
        <span>Scroll to continue</span>
      </div>
    </section>
  );
}

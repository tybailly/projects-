"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Hls from "hls.js";

interface VideoPlayerProps {
  titleId: string;
  src: string;
  startPosition: number;
  title: string;
}

const PROGRESS_SAVE_INTERVAL_MS = 5000;

export function VideoPlayer({ titleId, src, startPosition, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    function seekToStart() {
      if (video && startPosition > 0) {
        video.currentTime = startPosition;
      }
    }

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, seekToStart);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari plays HLS natively.
      video.src = src;
      video.addEventListener("loadedmetadata", seekToStart, { once: true });
    }

    let lastSaved = 0;
    function onTimeUpdate() {
      if (!video) return;
      const now = Date.now();
      if (now - lastSaved < PROGRESS_SAVE_INTERVAL_MS) return;
      lastSaved = now;
      saveProgress(video.currentTime, video.duration);
    }

    function saveProgress(position: number, duration: number) {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId,
          positionSeconds: Math.floor(position),
          durationSeconds: Number.isFinite(duration) ? Math.floor(duration) : undefined
        }),
        keepalive: true
      }).catch(() => null);
    }

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", () => saveProgress(video.currentTime, video.duration));

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      hls?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className="relative h-full w-full">
      <Link href={`/title/${titleId}`} className="absolute left-6 top-6 z-10 text-2xl text-white hover:text-neutral-300">
        ← {title}
      </Link>
      <video ref={videoRef} controls autoPlay className="h-full w-full" />
    </div>
  );
}

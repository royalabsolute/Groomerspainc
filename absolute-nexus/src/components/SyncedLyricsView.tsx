"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useMusicStore } from "@/store/useMusicStore";

interface LyricLine {
  timeMs: number;
  text: string;
}

export default function SyncedLyricsView() {
  const { currentLyrics, playbackProgressMs, seekTo } = useMusicStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // 1. Parse LRC formatted lyrics string to object array
  const parsedLines = useMemo<LyricLine[]>(() => {
    if (!currentLyrics) return [];

    return currentLyrics
      .split(/\r?\n/)
      .map((line) => {
        // Matches [mm:ss.xx] or [mm:ss.xxx] at the start of the line
        const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (!match) return null;

        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        
        // Parse fraction accurately (handles both 2-digit and 3-digit decimals)
        const msStr = match[3];
        const ms = parseInt(msStr.padEnd(3, "0").substring(0, 3), 10);
        
        const timeMs = (mins * 60 + secs) * 1000 + ms;
        const text = match[4].trim();

        return { timeMs, text };
      })
      .filter((line): line is LyricLine => line !== null)
      .sort((a, b) => a.timeMs - b.timeMs);
  }, [currentLyrics]);

  // 2. Determine index of currently active line
  const activeIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      if (playbackProgressMs >= parsedLines[i].timeMs) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [parsedLines, playbackProgressMs]);

  // 3. Smooth auto-scroll active lyric line to center of container
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  const handleLineClick = (timeMs: number) => {
    seekTo(timeMs / 1000);
  };

  if (!currentLyrics) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 italic text-sm text-center px-4">
        Letras no disponibles para esta canción
      </div>
    );
  }

  if (parsedLines.length === 0) {
    // If lyrics exist but could not be parsed as LRC, render them as plain text
    return (
      <div className="h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800 text-zinc-300 text-base leading-relaxed whitespace-pre-wrap select-text select-none">
        {currentLyrics}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-2 py-24 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800/60 select-none relative"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)",
      }}
    >
      {parsedLines.map((line, idx) => {
        const isActive = idx === activeIndex;
        return (
          <div
            key={idx}
            ref={isActive ? activeLineRef : null}
            onClick={() => handleLineClick(line.timeMs)}
            className={`text-base font-bold text-center transition-all duration-300 cursor-pointer py-1 select-none ${
              isActive
                ? "text-emerald-400 scale-[1.06] opacity-100 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                : "text-zinc-500 opacity-55 hover:opacity-85 hover:text-zinc-300"
            }`}
          >
            {line.text || "•••"}
          </div>
        );
      })}
    </div>
  );
}

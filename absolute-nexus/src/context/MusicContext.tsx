"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SongData {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  thumbnail: string;
  type: "LOCAL" | "YOUTUBE";
  localFilePath?: string | null;
}

interface MusicContextValue {
  currentSong: SongData | null;
  isPlaying: boolean;
  playbackProgress: number; // in seconds
  volume: number; // 0 to 100
  isSyncActive: boolean;
  queue: SongData[];
  history: SongData[];
  isLoading: boolean;
  isBuffering: boolean;
  toastMessage: string | null;
  
  playSong: (song: SongData) => void;
  addToQueue: (song: SongData) => void;
  nextSong: () => void;
  previousSong: () => void;
  clearQueue: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleSync: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setProgress: (progress: number) => void;
  showToast: (msg: string) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [volume, setVolumeState] = useState(50);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [queue, setQueue] = useState<SongData[]>([]);
  const [history, setHistory] = useState<SongData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast notification
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const playSong = useCallback((song: SongData) => {
    setCurrentSong((prev) => {
      if (prev) {
        setHistory((hist) => [...hist, prev]);
      }
      return song;
    });
    setPlaybackProgress(0);
    setIsPlaying(true);
  }, []);

  const addToQueue = useCallback((song: SongData) => {
    setCurrentSong((current) => {
      if (!current) {
        // Nothing is playing, play immediately
        setPlaybackProgress(0);
        setIsPlaying(true);
        return song;
      } else {
        // Add to queue
        setQueue((q) => [...q, song]);
        showToast(`"${song.title}" añadida a la cola`);
        return current;
      }
    });
  }, [showToast]);

  const nextSong = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) {
        setIsPlaying(false);
        return q;
      }
      const next = q[0];
      setCurrentSong((current) => {
        if (current) {
          setHistory((hist) => [...hist, current]);
        }
        return next;
      });
      setPlaybackProgress(0);
      setIsPlaying(true);
      return q.slice(1);
    });
  }, []);

  const previousSong = useCallback(() => {
    setHistory((hist) => {
      if (hist.length === 0) {
        showToast("No hay canciones previas en el historial");
        return hist;
      }
      const prev = hist[hist.length - 1];
      setCurrentSong((current) => {
        if (current) {
          setQueue((q) => [current, ...q]);
        }
        return prev;
      });
      setPlaybackProgress(0);
      setIsPlaying(true);
      return hist.slice(0, -1);
    });
  }, [showToast]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    showToast("Cola de reproducción vaciada");
  }, [showToast]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seek = useCallback((seconds: number) => {
    setPlaybackProgress(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
  }, []);

  const toggleSync = useCallback(() => {
    setIsSyncActive((prev) => !prev);
  }, []);

  const setProgress = useCallback((progress: number) => {
    setPlaybackProgress(progress);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        playbackProgress,
        volume,
        isSyncActive,
        queue,
        history,
        isLoading,
        isBuffering,
        toastMessage,
        playSong,
        addToQueue,
        nextSong,
        previousSong,
        clearQueue,
        togglePlay,
        seek,
        setVolume,
        toggleSync,
        setIsLoading,
        setIsBuffering,
        setProgress,
        showToast,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}

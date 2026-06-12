"use client";

import React, { useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  Users,
  Loader2,
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Helper to format time (e.g. 128 -> "2:08")
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    playbackProgress,
    volume,
    isSyncActive,
    isLoading,
    isBuffering,
    togglePlay,
    seek,
    setVolume,
    toggleSync,
    previousSong,
    nextSong,
    setProgress,
    setIsLoading,
    setIsBuffering,
  } = useMusic();

  const playerRef = useRef<any>(null);

  // Set loading state when song changes
  useEffect(() => {
    if (currentSong) {
      setIsLoading(true);
      setIsBuffering(false);
    }
  }, [currentSong, setIsLoading, setIsBuffering]);

  if (!currentSong) return null;

  // Determine streaming URL and badge type based on localFilePath
  const isLocal = !!currentSong.localFilePath || currentSong.type === "LOCAL";
  
  // Dynamic stream url: uses stream API if local, YouTube watch page otherwise
  const streamUrl = currentSong.localFilePath
    ? `/api/music/stream?id=${currentSong.id}`
    : `https://www.youtube.com/watch?v=${currentSong.id}`;

  const handleSeek = (value: number) => {
    seek(value);
    if (playerRef.current) {
      playerRef.current.seekTo(value, "seconds");
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const isBusy = isLoading || isBuffering;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#1E1F22] border-t border-[#1F2023] z-50 flex items-center justify-between px-6 select-none shadow-2xl">
      {/* Headless Player Engine */}
      <ReactPlayer
        ref={playerRef}
        url={streamUrl}
        playing={isPlaying}
        volume={volume / 100}
        onProgress={(state) => {
          // Sync playback progress if player is active and we aren't loading
          if (!isBusy) {
            setProgress(Math.round(state.playedSeconds));
          }
        }}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onReady={() => setIsLoading(false)}
        onStart={() => setIsLoading(false)}
        onPlay={() => setIsLoading(false)}
        onPause={() => setIsLoading(false)}
        onEnded={nextSong}
        width={0}
        height={0}
        style={{ display: "none" }}
      />

      {/* ── Left: Song Info ── */}
      <div className="flex items-center gap-3 w-1/4 min-w-[240px]">
        <div className="w-14 h-14 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0 relative group">
          {currentSong.thumbnail ? (
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              🎵
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#F2F3F5] text-sm truncate select-text">
              {currentSong.title}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none flex-shrink-0 ${
                isLocal
                  ? "bg-[#23A55A]/20 text-[#23A55A] border border-[#23A55A]/30"
                  : "bg-[#F23F43]/20 text-[#F23F43] border border-[#F23F43]/30"
              }`}
            >
              {isLocal ? "LOCAL" : "YOUTUBE"}
            </span>
          </div>
          <span className="text-xs text-[#B5BAC1] truncate select-text">
            {currentSong.artist}
          </span>
        </div>
      </div>

      {/* ── Center: Control Deck & Progress Bar ── */}
      <div className="flex flex-col items-center gap-2 w-2/5 max-w-xl">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={previousSong}
            className="text-[#B5BAC1] hover:text-[#F2F3F5] transition-colors"
            title="Anterior"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button
            onClick={togglePlay}
            disabled={isBusy}
            className={`w-8 h-8 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center justify-center transition-all shadow-md transform active:scale-95 ${
              isBusy ? "opacity-75 cursor-not-allowed bg-zinc-700 hover:bg-zinc-700" : ""
            }`}
            title={isBusy ? "Cargando..." : isPlaying ? "Pausar" : "Reproducir"}
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          
          <button
            onClick={nextSong}
            className="text-[#B5BAC1] hover:text-[#F2F3F5] transition-colors"
            title="Siguiente"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Progress Slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] text-[#B5BAC1] font-mono w-8 text-right">
            {formatTime(playbackProgress)}
          </span>
          <div className={`flex-grow relative flex items-center group ${isBusy ? "pointer-events-none opacity-50" : ""}`}>
            <input
              type="range"
              min={0}
              max={currentSong.duration || 1}
              value={playbackProgress}
              disabled={isBusy}
              onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#5865F2] group-hover:h-1.5 transition-all outline-none disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, #5865F2 0%, #5865F2 ${
                  (playbackProgress / (currentSong.duration || 1)) * 100
                }%, #2d2f34 ${(playbackProgress / (currentSong.duration || 1)) * 100}%, #2d2f34 100%)`,
              }}
            />
          </div>
          <span className="text-[10px] text-[#B5BAC1] font-mono w-8">
            {formatTime(currentSong.duration)}
          </span>
        </div>
      </div>

      {/* ── Right: Volume & Sync Mode ── */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
        {/* Sync / Listen Along */}
        <button
          onClick={toggleSync}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
            isSyncActive
              ? "bg-[#23A55A]/20 text-[#23A55A] border-[#23A55A]/40"
              : "bg-transparent text-[#B5BAC1] border-[#3F4147] hover:text-[#F2F3F5] hover:border-[#B5BAC1]/30"
          }`}
          title={isSyncActive ? "Sincronización activa" : "Activar Sincronización Pública"}
        >
          {isSyncActive ? (
            <>
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Sincronizando</span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              <span>Listen Along</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-5 bg-[#3F4147]" />

        {/* Volume controls */}
        <div className="flex items-center gap-2 group/volume">
          <button
            onClick={() => handleVolumeChange(volume > 0 ? 0 : 50)}
            className="text-[#B5BAC1] hover:text-[#F2F3F5] transition-colors"
            title="Volumen"
          >
            {volume === 0 ? (
              <VolumeX className="w-4.5 h-4.5" />
            ) : (
              <Volume2 className="w-4.5 h-4.5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
            className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#5865F2] outline-none"
            style={{
              background: `linear-gradient(to right, #5865F2 0%, #5865F2 ${volume}%, #2d2f34 ${volume}%, #2d2f34 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

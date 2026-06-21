import { create } from "zustand";

export interface SongData {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  thumbnail: string;
  type: "LOCAL" | "YOUTUBE";
  localFilePath?: string | null;
}

interface MusicState {
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
  toastTimeoutId: any | null;
  playbackProgressMs: number;
  currentLyrics: string;

  playSong: (song: SongData) => void;
  addToQueue: (song: SongData) => void;
  nextSong: () => void;
  previousSong: () => void;
  clearQueue: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  seekTarget: number | null;
  clearSeekTarget: () => void;
  setVolume: (vol: number) => void;
  toggleSync: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setProgress: (progress: number) => void;
  setLyrics: (lyrics: string) => void;
  setPlaybackProgressMs: (ms: number) => void;
  showToast: (msg: string) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  playbackProgress: 0,
  playbackProgressMs: 0,
  currentLyrics: "",
  volume: 50,
  isSyncActive: false,
  seekTarget: null,
  queue: [],
  history: [],
  isLoading: false,
  isBuffering: false,
  toastMessage: null,
  toastTimeoutId: null,

  showToast: (msg) => {
    const existingTimeout = get().toastTimeoutId;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      set({ toastMessage: null, toastTimeoutId: null });
    }, 3000);

    set({ toastMessage: msg, toastTimeoutId: timeoutId });
  },

  playSong: (song) => {
    const current = get().currentSong;
    if (current) {
      set((state) => ({ history: [...state.history, current] }));
    }
    set({
      currentSong: song,
      playbackProgress: 0,
      playbackProgressMs: 0,
      currentLyrics: "",
      isPlaying: true,
    });
  },

  addToQueue: (song) => {
    const current = get().currentSong;
    if (!current) {
      set({
        currentSong: song,
        playbackProgress: 0,
        playbackProgressMs: 0,
        currentLyrics: "",
        isPlaying: true,
      });
    } else {
      set((state) => ({ queue: [...state.queue, song] }));
      get().showToast(`"${song.title}" añadida a la cola`);
    }
  },

  nextSong: () => {
    const q = get().queue;
    if (q.length === 0) {
      set({ isPlaying: false });
      return;
    }
    const next = q[0];
    const current = get().currentSong;
    if (current) {
      set((state) => ({ history: [...state.history, current] }));
    }
    set({
      currentSong: next,
      playbackProgress: 0,
      playbackProgressMs: 0,
      currentLyrics: "",
      isPlaying: true,
      queue: q.slice(1),
    });
  },

  previousSong: () => {
    const hist = get().history;
    if (hist.length === 0) {
      get().showToast("No hay canciones previas en el historial");
      return;
    }
    const prev = hist[hist.length - 1];
    const current = get().currentSong;
    if (current) {
      set((state) => ({ queue: [current, ...state.queue] }));
    }
    set({
      currentSong: prev,
      playbackProgress: 0,
      playbackProgressMs: 0,
      currentLyrics: "",
      isPlaying: true,
      history: hist.slice(0, -1),
    });
  },

  clearQueue: () => {
    set({ queue: [] });
    get().showToast("Cola de reproducción vaciada");
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  seek: (seconds) => {
    set({ playbackProgress: seconds, playbackProgressMs: seconds * 1000 });
  },

  seekTo: (seconds) => {
    set({ seekTarget: seconds, playbackProgress: seconds, playbackProgressMs: seconds * 1000 });
  },

  clearSeekTarget: () => {
    set({ seekTarget: null });
  },

  setVolume: (vol) => {
    set({ volume: vol });
  },

  toggleSync: () => {
    set((state) => ({ isSyncActive: !state.isSyncActive }));
  },

  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  setIsBuffering: (buffering) => {
    set({ isBuffering: buffering });
  },

  setProgress: (progress) => {
    set({ playbackProgress: progress });
  },

  setLyrics: (lyrics) => {
    set({ currentLyrics: lyrics });
  },

  setPlaybackProgressMs: (ms) => {
    set({ playbackProgressMs: ms });
  },
}));

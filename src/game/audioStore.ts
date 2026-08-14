import { create } from "zustand";
import { isMuted, setMuted, getVolume, setVolume } from "../audio/sound";

interface AudioState {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  changeVolume: (v: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  muted: isMuted(),
  volume: getVolume(),

  toggleMute: () => {
    const next = !get().muted;
    setMuted(next);
    set({ muted: next });
  },

  changeVolume: (v) => {
    setVolume(v);
    // Dragging the slider implies wanting sound back, unless dragged to zero.
    const nextMuted = v === 0 ? get().muted : false;
    if (nextMuted !== get().muted) setMuted(nextMuted);
    set({ volume: v, muted: nextMuted });
  },
}));

import { create } from "zustand";
import { runSort } from "../graph/sort";
import type { SortAlgorithm, SortResult } from "../graph/sort";
import { playScanStart } from "../audio/sound";

export const SORT_ARRAY: number[] = [62, 23, 48, 8, 91, 35, 71, 15];
export const SORT_ANIM_DURATION_MS = 4200;

interface SortState {
  algorithm: SortAlgorithm;
  result: SortResult;
  comparisonCounts: Partial<Record<SortAlgorithm, { comparisons: number; writes: number }>>;
  solvedAt: number;

  setAlgorithm: (a: SortAlgorithm) => void;
  replay: () => void;
}

const initialResult = runSort("bubble", SORT_ARRAY);

export const useSortStore = create<SortState>((set, get) => ({
  algorithm: "bubble",
  result: initialResult,
  comparisonCounts: { bubble: { comparisons: initialResult.comparisons, writes: initialResult.writes } },
  solvedAt: Date.now(),

  setAlgorithm: (a) => {
    const { comparisonCounts } = get();
    const result = runSort(a, SORT_ARRAY);
    playScanStart();
    set({
      algorithm: a,
      result,
      comparisonCounts: { ...comparisonCounts, [a]: { comparisons: result.comparisons, writes: result.writes } },
      solvedAt: Date.now(),
    });
  },

  replay: () => {
    playScanStart();
    set({ solvedAt: Date.now() });
  },
}));

import { create } from "zustand";
import { astar } from "../graph/astar";
import type { AStarResult, Heuristic } from "../graph/astar";
import type { GridSpec } from "../graph/astar";
import { generateMaze, MAZE_START, MAZE_GOAL } from "./maze";
import { playScanStart } from "../audio/sound";

interface MazeState {
  grid: GridSpec;
  heuristic: Heuristic;
  result: AStarResult;
  comparisonCounts: Partial<Record<Heuristic, number>>;
  solvedAt: number;

  setHeuristic: (h: Heuristic) => void;
  replay: () => void;
}

export const MAZE_ANIM_DURATION_MS = 3200;

const initialGrid = generateMaze();
const initialResult = astar(initialGrid, MAZE_START, MAZE_GOAL, "manhattan");

export const useMazeStore = create<MazeState>((set, get) => ({
  grid: initialGrid,
  heuristic: "manhattan",
  result: initialResult,
  comparisonCounts: { manhattan: initialResult.expandedCount },
  solvedAt: Date.now(),

  setHeuristic: (h) => {
    const { grid, comparisonCounts } = get();
    const result = astar(grid, MAZE_START, MAZE_GOAL, h);
    playScanStart();
    set({
      heuristic: h,
      result,
      comparisonCounts: { ...comparisonCounts, [h]: result.expandedCount },
      solvedAt: Date.now(),
    });
  },

  replay: () => {
    playScanStart();
    set({ solvedAt: Date.now() });
  },
}));

export { MAZE_START, MAZE_GOAL };

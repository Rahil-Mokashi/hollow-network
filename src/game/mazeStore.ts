import { create } from "zustand";
import { astar } from "../graph/astar";
import type { AStarResult, Heuristic } from "../graph/astar";
import type { GridSpec } from "../graph/astar";
import { generateMaze, mazeStart, mazeGoal, MAZE_TRIALS } from "./maze";
import { playScanStart } from "../audio/sound";

interface MazeState {
  trialIndex: number;
  grid: GridSpec;
  heuristic: Heuristic;
  result: AStarResult;
  comparisonCounts: Partial<Record<Heuristic, number>>;
  solvedAt: number;

  setHeuristic: (h: Heuristic) => void;
  replay: () => void;
  advanceTrial: () => void;
}

export const MAZE_ANIM_DURATION_MS = 3200;

function solveFor(trialIndex: number, heuristic: Heuristic) {
  const trial = MAZE_TRIALS[trialIndex];
  const grid = generateMaze(trial);
  const result = astar(grid, mazeStart(), mazeGoal(trial), heuristic);
  return { grid, result };
}

const initial = solveFor(0, "manhattan");

export const useMazeStore = create<MazeState>((set, get) => ({
  trialIndex: 0,
  grid: initial.grid,
  heuristic: "manhattan",
  result: initial.result,
  comparisonCounts: { manhattan: initial.result.expandedCount },
  solvedAt: Date.now(),

  setHeuristic: (h) => {
    const { trialIndex, comparisonCounts, grid } = get();
    const trial = MAZE_TRIALS[trialIndex];
    const result = astar(grid, mazeStart(), mazeGoal(trial), h);
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

  advanceTrial: () => {
    const { trialIndex } = get();
    const nextIndex = Math.min(trialIndex + 1, MAZE_TRIALS.length - 1);
    const { grid, result } = solveFor(nextIndex, "manhattan");
    playScanStart();
    set({
      trialIndex: nextIndex,
      grid,
      heuristic: "manhattan",
      result,
      comparisonCounts: { manhattan: result.expandedCount },
      solvedAt: Date.now(),
    });
  },
}));

export { MAZE_TRIALS, mazeStart, mazeGoal };

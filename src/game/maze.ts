import type { GridSpec, Cell } from "../graph/astar";

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface MazeTrial {
  label: string;
  seed: number;
  cells: number;
  braidChance: number;
}

/** Two trials: a first maze to learn the controls on, then a meaningfully
 * bigger one once the player has already run both heuristics once. */
export const MAZE_TRIALS: MazeTrial[] = [
  { label: "Trial I", seed: 1337, cells: 8, braidChance: 0.24 },
  { label: "Trial II", seed: 2024, cells: 12, braidChance: 0.2 },
];

/** A perfect maze (single unique path between any two cells) carved with a
 * seeded randomized depth-first backtracker over a logical cells x cells
 * grid, expanded onto a (2n+1) grid so every carved cell gets a wall on
 * every side by default, then lightly braided with extra loops — without
 * loops, a heuristic's quality barely matters, since a single-path maze
 * forces near-identical exploration regardless of how good the guess is.
 * Deterministic — same seed, same maze, every time. */
export function generateMaze(trial: MazeTrial): GridSpec {
  const { seed, cells, braidChance } = trial;
  const gridSize = cells * 2 + 1;
  const rand = seededRandom(seed);
  const visited: boolean[][] = Array.from({ length: cells }, () => new Array(cells).fill(false));
  const walls = new Set<string>();

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      walls.add(`${r},${c}`);
    }
  }

  function carveCell(cr: number, cc: number): void {
    walls.delete(`${cr * 2 + 1},${cc * 2 + 1}`);
  }

  function carveBetween(cr1: number, cc1: number, cr2: number, cc2: number): void {
    const r = cr1 * 2 + 1 + (cr2 - cr1);
    const c = cc1 * 2 + 1 + (cc2 - cc1);
    walls.delete(`${r},${c}`);
  }

  function shuffled<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function walk(cr: number, cc: number): void {
    visited[cr][cc] = true;
    carveCell(cr, cc);
    const dirs = shuffled([
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]);
    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr >= 0 && nr < cells && nc >= 0 && nc < cells && !visited[nr][nc]) {
        carveBetween(cr, cc, nr, nc);
        walk(nr, nc);
      }
    }
  }

  walk(0, 0);

  for (let cr = 0; cr < cells; cr++) {
    for (let cc = 0; cc < cells; cc++) {
      if (cc + 1 < cells) {
        const wallPos = `${cr * 2 + 1},${cc * 2 + 2}`;
        if (walls.has(wallPos) && rand() < braidChance) walls.delete(wallPos);
      }
      if (cr + 1 < cells) {
        const wallPos = `${cr * 2 + 2},${cc * 2 + 1}`;
        if (walls.has(wallPos) && rand() < braidChance) walls.delete(wallPos);
      }
    }
  }

  return { width: gridSize, height: gridSize, walls };
}

export function mazeGridSize(trial: MazeTrial): number {
  return trial.cells * 2 + 1;
}

export function mazeStart(): Cell {
  return [1, 1];
}

export function mazeGoal(trial: MazeTrial): Cell {
  const size = mazeGridSize(trial);
  return [size - 2, size - 2];
}

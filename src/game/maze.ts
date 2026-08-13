import type { GridSpec, Cell } from "../graph/astar";

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const MAZE_SEED = 1337;
export const MAZE_CELLS = 8;
export const MAZE_GRID_SIZE = MAZE_CELLS * 2 + 1;

/** A perfect maze (single unique path between any two cells) carved with a
 * seeded randomized depth-first backtracker over a logical MAZE_CELLS x
 * MAZE_CELLS grid, expanded onto a (2n+1) grid so every carved cell gets a
 * wall on every side by default. Deterministic — same seed, same maze,
 * every time, so it's a real hand-designed level rather than dynamic noise. */
export function generateMaze(seed: number = MAZE_SEED): GridSpec {
  const rand = seededRandom(seed);
  const visited: boolean[][] = Array.from({ length: MAZE_CELLS }, () => new Array(MAZE_CELLS).fill(false));
  const walls = new Set<string>();

  for (let r = 0; r < MAZE_GRID_SIZE; r++) {
    for (let c = 0; c < MAZE_GRID_SIZE; c++) {
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
      if (nr >= 0 && nr < MAZE_CELLS && nc >= 0 && nc < MAZE_CELLS && !visited[nr][nc]) {
        carveBetween(cr, cc, nr, nc);
        walk(nr, nc);
      }
    }
  }

  walk(0, 0);

  // A perfect maze (pure spanning tree) has exactly one route between any
  // two cells, which forces both heuristics to expand almost the same set
  // of dead-end branches regardless of how good the heuristic is. Braiding
  // — deterministically knocking out a handful of the remaining interior
  // walls — introduces real loops, so a weaker heuristic (Euclidean) can
  // actually be lured into exploring more of a loop than it needs to.
  const BRAID_CHANCE = 0.24;
  for (let cr = 0; cr < MAZE_CELLS; cr++) {
    for (let cc = 0; cc < MAZE_CELLS; cc++) {
      if (cc + 1 < MAZE_CELLS) {
        const wallPos = `${cr * 2 + 1},${cc * 2 + 2}`;
        if (walls.has(wallPos) && rand() < BRAID_CHANCE) walls.delete(wallPos);
      }
      if (cr + 1 < MAZE_CELLS) {
        const wallPos = `${cr * 2 + 2},${cc * 2 + 1}`;
        if (walls.has(wallPos) && rand() < BRAID_CHANCE) walls.delete(wallPos);
      }
    }
  }

  return { width: MAZE_GRID_SIZE, height: MAZE_GRID_SIZE, walls };
}

export const MAZE_START: Cell = [1, 1];
export const MAZE_GOAL: Cell = [MAZE_GRID_SIZE - 2, MAZE_GRID_SIZE - 2];

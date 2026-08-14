export type Cell = [number, number];

export interface GridSpec {
  width: number;
  height: number;
  walls: Set<string>;
}

// "dijkstra" is not really a heuristic — it's the deliberate absence of
// one (h(n) = 0 for every cell). Modeling it as a third Heuristic value
// keeps astar() itself completely unchanged: Dijkstra's algorithm IS just
// A* with a heuristic that never guesses.
export type Heuristic = "manhattan" | "euclidean" | "dijkstra";

export function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function isWalkable(grid: GridSpec, r: number, c: number): boolean {
  return r >= 0 && r < grid.height && c >= 0 && c < grid.width && !grid.walls.has(cellKey(r, c));
}

export function heuristicDistance(type: Heuristic, a: Cell, b: Cell): number {
  if (type === "dijkstra") return 0;
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return type === "manhattan" ? dr + dc : Math.sqrt(dr * dr + dc * dc);
}

export interface AStarStep {
  cell: Cell;
  g: number;
  h: number;
  f: number;
}

export interface AStarResult {
  path: Cell[] | null;
  steps: AStarStep[];
  expandedCount: number;
}

/** Classic A* over a 4-directional grid, uniform step cost 1. Returns the
 * full expansion trace (in the order nodes were popped off the open set)
 * so the renderer can replay exactly what the algorithm actually did. */
export function astar(grid: GridSpec, start: Cell, goal: Cell, heuristic: Heuristic): AStarResult {
  const startKey = cellKey(...start);
  const goalKey = cellKey(...goal);

  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristicDistance(heuristic, start, goal)]]);
  const cameFrom = new Map<string, string>();
  const open = new Map<string, Cell>([[startKey, start]]);
  const closed = new Set<string>();
  const steps: AStarStep[] = [];

  while (open.size > 0) {
    let currentKey = "";
    let bestF = Infinity;
    for (const k of open.keys()) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        currentKey = k;
      }
    }

    const current = open.get(currentKey)!;
    open.delete(currentKey);
    closed.add(currentKey);

    const g = gScore.get(currentKey) ?? 0;
    const h = heuristicDistance(heuristic, current, goal);
    steps.push({ cell: current, g, h, f: bestF });

    if (currentKey === goalKey) {
      const path: Cell[] = [current];
      let k = currentKey;
      while (cameFrom.has(k)) {
        k = cameFrom.get(k)!;
        const [r, c] = k.split(",").map(Number);
        path.unshift([r, c]);
      }
      return { path, steps, expandedCount: steps.length };
    }

    const [r, c] = current;
    const neighbors: Cell[] = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    for (const neighbor of neighbors) {
      const [nr, nc] = neighbor;
      if (!isWalkable(grid, nr, nc)) continue;
      const nKey = cellKey(nr, nc);
      if (closed.has(nKey)) continue;

      const tentativeG = g + 1;
      const existingG = gScore.get(nKey);
      if (existingG === undefined || tentativeG < existingG) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + heuristicDistance(heuristic, neighbor, goal));
        open.set(nKey, neighbor);
      }
    }
  }

  return { path: null, steps, expandedCount: steps.length };
}

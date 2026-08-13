import { describe, it, expect } from "vitest";
import { astar, heuristicDistance } from "./astar";
import type { GridSpec } from "./astar";
import { generateMaze, MAZE_START, MAZE_GOAL, MAZE_SEED } from "../game/maze";

function openGrid(size: number): GridSpec {
  return { width: size, height: size, walls: new Set() };
}

describe("heuristicDistance", () => {
  it("Manhattan is the sum of axis differences", () => {
    expect(heuristicDistance("manhattan", [0, 0], [3, 4])).toBe(7);
  });

  it("Euclidean is the straight-line distance", () => {
    expect(heuristicDistance("euclidean", [0, 0], [3, 4])).toBe(5);
  });

  it("Euclidean never overestimates Manhattan on a grid (both are admissible, but Manhattan is tighter)", () => {
    expect(heuristicDistance("euclidean", [2, 5], [7, 1])).toBeLessThanOrEqual(heuristicDistance("manhattan", [2, 5], [7, 1]));
  });
});

describe("astar on an open grid", () => {
  it("finds the true shortest path when nothing blocks it", () => {
    const grid = openGrid(8);
    const result = astar(grid, [0, 0], [4, 3], "manhattan");
    expect(result.path).not.toBeNull();
    expect(result.path!.length - 1).toBe(7); // Manhattan distance = path length on an open grid
  });

  it("returns null when the goal is unreachable", () => {
    const grid = openGrid(5);
    grid.walls.add("0,1");
    grid.walls.add("1,1");
    grid.walls.add("2,1");
    grid.walls.add("3,1");
    grid.walls.add("4,1"); // a solid wall column cuts the grid in half
    const result = astar(grid, [0, 0], [0, 4], "manhattan");
    expect(result.path).toBeNull();
  });

  it("routes around a wall rather than claiming a false path", () => {
    const grid = openGrid(5);
    grid.walls.add("0,1");
    grid.walls.add("1,1");
    grid.walls.add("2,1"); // wall with a gap at row 3 and 4
    const result = astar(grid, [0, 0], [0, 4], "manhattan");
    expect(result.path).not.toBeNull();
    for (const [r, c] of result.path!) {
      expect(grid.walls.has(`${r},${c}`)).toBe(false);
    }
  });
});

describe("the hand-designed maze level", () => {
  const grid = generateMaze(MAZE_SEED);

  it("is solvable from start to goal", () => {
    const result = astar(grid, MAZE_START, MAZE_GOAL, "manhattan");
    expect(result.path).not.toBeNull();
    expect(result.path![0]).toEqual(MAZE_START);
    expect(result.path![result.path!.length - 1]).toEqual(MAZE_GOAL);
  });

  it("the path never crosses a wall cell", () => {
    const result = astar(grid, MAZE_START, MAZE_GOAL, "manhattan");
    for (const [r, c] of result.path!) {
      expect(grid.walls.has(`${r},${c}`)).toBe(false);
    }
  });

  it("generation is deterministic for a fixed seed", () => {
    const gridAgain = generateMaze(MAZE_SEED);
    expect([...gridAgain.walls].sort()).toEqual([...grid.walls].sort());
  });

  it("Manhattan expands no more nodes than Euclidean on 4-directional grid movement", () => {
    // True cost-to-goal here IS Manhattan distance, so Manhattan is a
    // perfectly tight heuristic while Euclidean under-informs (it's always
    // <= Manhattan), causing A* to explore at least as many nodes.
    const manhattanResult = astar(grid, MAZE_START, MAZE_GOAL, "manhattan");
    const euclideanResult = astar(grid, MAZE_START, MAZE_GOAL, "euclidean");
    expect(manhattanResult.expandedCount).toBeLessThanOrEqual(euclideanResult.expandedCount);
  });
});

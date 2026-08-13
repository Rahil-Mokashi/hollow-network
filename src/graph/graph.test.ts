import { describe, it, expect } from "vitest";
import { Graph } from "./types";
import { bfs, bfsOneRing, bfsShortestPath } from "./bfs";
import { dfs, dfsPath } from "./dfs";
import { detectCycle } from "./cycleDetect";
import { UnionFind, unionTrace } from "./unionFind";

function makeLineGraph(): Graph {
  // A - B - C - D
  const g = new Graph();
  ["A", "B", "C", "D"].forEach((id) => g.addNode({ id, position: [0, 0, 0] }));
  g.addEdge("A", "B");
  g.addEdge("B", "C");
  g.addEdge("C", "D");
  return g;
}

function makeStarGraph(): Graph {
  //     B
  //     |
  // C - A - D
  //     |
  //     E
  const g = new Graph();
  ["A", "B", "C", "D", "E"].forEach((id) => g.addNode({ id, position: [0, 0, 0] }));
  g.addEdge("A", "B");
  g.addEdge("A", "C");
  g.addEdge("A", "D");
  g.addEdge("A", "E");
  return g;
}

function makeCyclicGraph(): Graph {
  // A - B - C - A  (triangle) plus a dangling D off B
  const g = new Graph();
  ["A", "B", "C", "D"].forEach((id) => g.addNode({ id, position: [0, 0, 0] }));
  g.addEdge("A", "B");
  g.addEdge("B", "C");
  g.addEdge("C", "A");
  g.addEdge("B", "D");
  return g;
}

describe("BFS", () => {
  it("visits nodes in increasing hop-distance order", () => {
    const g = makeStarGraph();
    const steps = bfs(g, "A");
    expect(steps[0].frontier).toEqual(["A"]);
    expect(steps[1].frontier.sort()).toEqual(["B", "C", "D", "E"]);
  });

  it("reveals the full one-ring simultaneously (Torch ability)", () => {
    const g = makeStarGraph();
    expect(bfsOneRing(g, "A").sort()).toEqual(["B", "C", "D", "E"]);
  });

  it("finds the true shortest hop-count path, not just a path", () => {
    const g = makeLineGraph();
    g.addEdge("A", "D"); // shortcut
    const path = bfsShortestPath(g, "A", "D");
    expect(path).toEqual(["A", "D"]);
  });

  it("returns null when no path exists", () => {
    const g = new Graph();
    g.addNode({ id: "X", position: [0, 0, 0] });
    g.addNode({ id: "Y", position: [0, 0, 0] });
    expect(bfsShortestPath(g, "X", "Y")).toBeNull();
  });
});

describe("DFS", () => {
  it("pushes and pops in a matched, well-formed stack sequence", () => {
    const g = makeLineGraph();
    const steps = dfs(g, "A");
    const pushes = steps.filter((s) => s.action === "push").length;
    const pops = steps.filter((s) => s.action === "pop").length;
    expect(pushes).toBe(4);
    expect(pops).toBe(4);
    expect(steps[steps.length - 1]).toMatchObject({ action: "pop", stack: [] });
  });

  it("commits fully down one branch before backtracking", () => {
    const g = makeLineGraph();
    const steps = dfs(g, "A");
    const pushOrder = steps.filter((s) => s.action === "push").map((s) => s.node);
    expect(pushOrder).toEqual(["A", "B", "C", "D"]);
  });

  it("finds a real connecting path between two nodes", () => {
    const g = makeStarGraph();
    const path = dfsPath(g, "C", "E");
    expect(path).not.toBeNull();
    expect(path![0]).toBe("C");
    expect(path![path!.length - 1]).toBe("E");
  });
});

describe("Cycle detection", () => {
  it("finds no cycle in a tree-shaped graph", () => {
    const g = makeStarGraph();
    const result = detectCycle(g, "A");
    expect(result.hasCycle).toBe(false);
  });

  it("finds no false cycle from walking straight back to a parent", () => {
    const g = makeLineGraph();
    const result = detectCycle(g, "A");
    expect(result.hasCycle).toBe(false);
  });

  it("detects a real cycle and identifies the closing node", () => {
    const g = makeCyclicGraph();
    const result = detectCycle(g, "A");
    expect(result.hasCycle).toBe(true);
    expect(["A", "B", "C"]).toContain(result.closingNode);
  });
});

describe("Union-Find", () => {
  it("starts with every node in its own component", () => {
    const uf = new UnionFind(["A", "B", "C"]);
    expect(uf.connected("A", "B")).toBe(false);
    expect(uf.components().length).toBe(3);
  });

  it("merges two components into one on union", () => {
    const uf = new UnionFind(["A", "B", "C", "D"]);
    uf.union("A", "B");
    uf.union("C", "D");
    expect(uf.components().length).toBe(2);

    const trace = unionTrace(uf, "B", "C");
    expect(trace.merged).toEqual(["B", "C"]);
    expect(trace.components.length).toBe(1);
    expect(uf.connected("A", "D")).toBe(true);
  });

  it("reports no merge when the bridge already connects two connected nodes", () => {
    const uf = new UnionFind(["A", "B"]);
    uf.union("A", "B");
    const trace = unionTrace(uf, "A", "B");
    expect(trace.merged).toBeNull();
  });
});

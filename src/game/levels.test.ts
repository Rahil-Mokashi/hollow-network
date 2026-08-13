import { describe, it, expect } from "vitest";
import { ACT1, ACT2, ACT3, ACT4, ACT5 } from "./levels";
import { bfsShortestPath } from "../graph/bfs";
import { detectCycle } from "../graph/cycleDetect";
import { UnionFind } from "../graph/unionFind";

describe("Level graphs", () => {
  it("Act I: portal is reachable from the hub", () => {
    expect(bfsShortestPath(ACT1.graph, ACT1.startId, ACT1.goalId!)).not.toBeNull();
  });

  it("Act II: the beacon is reachable, and the 2-hop route beats the 3-hop route", () => {
    const path = bfsShortestPath(ACT2.graph, ACT2.startId, ACT2.goalId!);
    expect(path).not.toBeNull();
    expect(path!.length - 1).toBe(2);
  });

  it("Act III: goal is reachable, and d3 is a genuine dead end forcing a rewind", () => {
    const path = bfsShortestPath(ACT3.graph, ACT3.startId, ACT3.goalId!);
    expect(path).not.toBeNull();
    expect(ACT3.graph.neighbors("d3")).toEqual(["d2"]);
  });

  it("Act IV: the ring is a real, detected cycle — not just visually implied", () => {
    const result = detectCycle(ACT4.graph, ACT4.startId);
    expect(result.hasCycle).toBe(true);
    const path = bfsShortestPath(ACT4.graph, ACT4.startId, ACT4.goalId!);
    expect(path).not.toBeNull();
  });

  it("Act V: pylon and relay start in different components until the bridge unions them", () => {
    const uf = new UnionFind(ACT5.graph.nodeIds());
    for (const edge of ACT5.graph.edges) uf.union(edge.a, edge.b);
    expect(uf.connected(ACT5.bridge!.a, ACT5.bridge!.b)).toBe(false);

    uf.union(ACT5.bridge!.a, ACT5.bridge!.b);
    expect(uf.connected("start5", "goal5")).toBe(true);
  });
});

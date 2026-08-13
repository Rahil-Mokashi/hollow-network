import { describe, it, expect } from "vitest";
import { ACT1, ACT2, ACT2B, ACT3, ACT3B, ACT4, ACT4B, ACT5, ACTS } from "./levels";
import { bfsShortestPath } from "../graph/bfs";
import { detectCycle } from "../graph/cycleDetect";
import { UnionFind } from "../graph/unionFind";

describe("Level graphs", () => {
  it("Act I: portal is reachable from the hub", () => {
    expect(bfsShortestPath(ACT1.graph, ACT1.startId, ACT1.goalId!)).not.toBeNull();
  });

  it("Act II stage 1: the beacon is reachable, and the 2-hop route beats the 3-hop route", () => {
    const path = bfsShortestPath(ACT2.graph, ACT2.startId, ACT2.goalId!);
    expect(path).not.toBeNull();
    expect(path!.length - 1).toBe(2);
  });

  it("Act II stage 2: the 3-hop route beats the 4-hop route, and fits the move budget", () => {
    const path = bfsShortestPath(ACT2B.graph, ACT2B.startId, ACT2B.goalId!);
    expect(path).not.toBeNull();
    expect(path!.length - 1).toBe(3);
    expect(ACT2B.moveBudget).toBeGreaterThanOrEqual(path!.length - 1);
  });

  it("Act III stage 1: goal is reachable, and d3 is a genuine dead end forcing a rewind", () => {
    const path = bfsShortestPath(ACT3.graph, ACT3.startId, ACT3.goalId!);
    expect(path).not.toBeNull();
    expect(ACT3.graph.neighbors("d3")).toEqual(["d2"]);
  });

  it("Act III stage 2: goal is reachable, and both f3 and f6 are genuine dead ends", () => {
    const path = bfsShortestPath(ACT3B.graph, ACT3B.startId, ACT3B.goalId!);
    expect(path).not.toBeNull();
    expect(ACT3B.graph.neighbors("f3")).toEqual(["f2"]);
    expect(ACT3B.graph.neighbors("f6")).toEqual(["f5"]);
    // Exploring both dead ends costs 2 of the 3 rewind charges — still solvable, but tight.
    expect(ACT3B.rewindCharges).toBeGreaterThanOrEqual(2);
  });

  it("Act IV stage 1: the ring is a real, detected cycle — not just visually implied", () => {
    const result = detectCycle(ACT4.graph, ACT4.startId);
    expect(result.hasCycle).toBe(true);
    const path = bfsShortestPath(ACT4.graph, ACT4.startId, ACT4.goalId!);
    expect(path).not.toBeNull();
  });

  it("Act IV stage 2: the chorded ring still contains a real cycle and is solvable", () => {
    const result = detectCycle(ACT4B.graph, ACT4B.startId);
    expect(result.hasCycle).toBe(true);
    const path = bfsShortestPath(ACT4B.graph, ACT4B.startId, ACT4B.goalId!);
    expect(path).not.toBeNull();
  });

  it("Act V: pylon and relay start in different components until the bridge unions them", () => {
    const uf = new UnionFind(ACT5.graph.nodeIds());
    for (const edge of ACT5.graph.edges) uf.union(edge.a, edge.b);
    expect(uf.connected(ACT5.bridge!.a, ACT5.bridge!.b)).toBe(false);

    uf.union(ACT5.bridge!.a, ACT5.bridge!.b);
    expect(uf.connected("start5", "goal5")).toBe(true);
  });

  it("every act's ids are unique across the full campaign", () => {
    const ids = ACTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every act is internally solvable start-to-goal (Act V excluded — its graph is deliberately disconnected until the bridge unions it, covered by its own test above)", () => {
    for (const act of ACTS.filter((a) => a.id !== "act5")) {
      const path = bfsShortestPath(act.graph, act.startId, act.goalId!);
      expect(path, `${act.id} should be solvable`).not.toBeNull();
    }
  });
});

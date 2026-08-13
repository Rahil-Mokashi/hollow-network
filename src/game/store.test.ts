import { describe, it, expect, beforeEach } from "vitest";
import { Graph } from "../graph/types";
import { useGameStore } from "./store";
import type { LevelDef } from "./levels";

// A minimal, deliberately unforgiving DFS level: one edge, zero rewind
// charges. The only legal move is the forced descent into the dead end,
// after which there is nothing left to do but fail — this exercises the
// generalized stuck-detection path that no shipped act naturally reaches
// (every real level keeps at least one spare rewind charge by design).
function buildStrandedTestLevel(): LevelDef {
  const g = new Graph();
  g.addNode({ id: "start", position: [0, 0, 0] });
  g.addNode({ id: "deadend", position: [-2, 0, -2] });
  g.addNode({ id: "goal", position: [5, 0, 5] }); // unreachable from this component on purpose
  g.addEdge("start", "deadend");

  return {
    id: "test-stranded",
    title: "Test",
    graph: g,
    startId: "start",
    goalId: "goal",
    ability: "dfsGrapple",
    rewindCharges: 0,
    briefing: "",
  };
}

describe("stuck-detection (DFS Grapple, no legal move remaining)", () => {
  beforeEach(() => {
    useGameStore.getState().loadLevel(buildStrandedTestLevel());
  });

  it("is not stuck at the start (a forward move exists)", () => {
    expect(useGameStore.getState().failed).toBe(false);
  });

  it("fires failed/'stuck' the moment the forced dead-end leaves no legal move", () => {
    const { beginTravel, finishTravel } = useGameStore.getState();
    beginTravel("deadend"); // the only move: commits into the dead end
    finishTravel(); // simulates the travel animation completing

    const state = useGameStore.getState();
    expect(state.currentNodeId).toBe("deadend");
    expect(state.failed).toBe(true);
    expect(state.failReason).toBe("stuck");
  });

  it("Retry (restartLevel) clears the stuck state and returns to the start", () => {
    const { beginTravel, finishTravel, restartLevel } = useGameStore.getState();
    beginTravel("deadend");
    finishTravel();
    expect(useGameStore.getState().failed).toBe(true);

    restartLevel();
    const state = useGameStore.getState();
    expect(state.failed).toBe(false);
    expect(state.currentNodeId).toBe("start");
  });

  it("does not misfire stuck-detection for abilities other than dfsGrapple", () => {
    // Same shape, but BFS Torch — canTravelTo always allows re-treading
    // revealed ground for non-dfsGrapple abilities, so "only one neighbor"
    // should never be misread as a dead end.
    const g = new Graph();
    g.addNode({ id: "s2", position: [0, 0, 0] });
    g.addNode({ id: "e2", position: [-2, 0, -2] });
    g.addEdge("s2", "e2");
    const level: LevelDef = {
      id: "test-bfs-single-edge",
      title: "Test",
      graph: g,
      startId: "s2",
      goalId: null,
      ability: "bfsTorch",
      briefing: "",
    };
    useGameStore.getState().loadLevel(level);
    // Simulate the Torch having already revealed e2, without depending on
    // the ability's real setTimeout — that timing is covered elsewhere.
    useGameStore.setState({ revealedNodeIds: new Set(["s2", "e2"]) });
    const { beginTravel, finishTravel } = useGameStore.getState();
    beginTravel("e2");
    finishTravel();
    expect(useGameStore.getState().currentNodeId).toBe("e2");
    expect(useGameStore.getState().failed).toBe(false);
  });
});

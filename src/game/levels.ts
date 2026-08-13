import { Graph } from "../graph/types";

export type Ability = "none" | "bfsTorch" | "dfsGrapple" | "cycleWard" | "unionFindKey";

export interface LevelDef {
  id: "act1" | "act2" | "act3" | "act4" | "act5";
  title: string;
  graph: Graph;
  startId: string;
  goalId: string | null;
  ability: Ability;
  briefing: string;
  // Act III — DFS Grapple
  rewindCharges?: number;
  // Act IV — Cycle Ward
  loopFailThreshold?: number;
  // Act V — Union-Find Key
  bridge?: { a: string; b: string };
  clusterBIds?: string[];
  clusterBOffset?: [number, number, number];
}

function buildAct1(): Graph {
  // Intro cluster — fully connected-ish hub, no ability required.
  // Teaches: an edge is a way through; multi-hop travel; portal is a real goal node.
  const g = new Graph();
  g.addNode({ id: "hub", position: [0, 0, 0], label: "Hollow Entrance" });
  g.addNode({ id: "a", position: [-6, 0, -2], label: "Chamber A" });
  g.addNode({ id: "b", position: [6, 0, -2], label: "Chamber B" });
  g.addNode({ id: "c", position: [-4, 0, 6], label: "Chamber C" });
  g.addNode({ id: "d", position: [4, 0, 6], label: "Chamber D" });
  g.addNode({ id: "portal", position: [4, 0, 13], label: "The First Threshold" });

  g.addEdge("hub", "a");
  g.addEdge("hub", "b");
  g.addEdge("hub", "c");
  g.addEdge("hub", "d");
  g.addEdge("d", "portal");

  return g;
}

function buildAct2(): Graph {
  // Flood vault — BFS Torch required. Two routes to the goal: a visually
  // "short" 3-hop route (start-n1-n3-goal, tight cluster) and a visually
  // "long" 2-hop route (start-n2-goal, a corridor stretching across the
  // map). Hop count, not raw distance, is what actually wins.
  const g = new Graph();
  g.addNode({ id: "start", position: [0, 0, 0], label: "Flood Vault Entrance" });
  g.addNode({ id: "n1", position: [-4, 0, -3], label: "Near Hollow" });
  g.addNode({ id: "n2", position: [5, 0, -3], label: "Far Hollow" });
  g.addNode({ id: "n3", position: [-6, 0, -9], label: "Deeper Hollow" });
  g.addNode({ id: "goal", position: [-5, 0, -12], label: "The Beacon Vault" });

  g.addEdge("start", "n1");
  g.addEdge("start", "n2");
  g.addEdge("n1", "n3");
  g.addEdge("n3", "goal");
  g.addEdge("n2", "goal");

  return g;
}

function buildAct3(): Graph {
  // Deep vaults — DFS Grapple required. A single committed spine with one
  // genuine dead end, so the player is forced to spend a rewind charge to
  // backtrack before finding the real route to the goal.
  const g = new Graph();
  g.addNode({ id: "start3", position: [0, 0, 0], label: "Deep Vault Entrance" });
  g.addNode({ id: "d1", position: [-3, 0, -5], label: "First Descent" });
  g.addNode({ id: "d2", position: [-2, 0, -10], label: "The Fork" });
  g.addNode({ id: "d3", position: [-8, 0, -13], label: "Dead End" });
  g.addNode({ id: "d4", position: [3, 0, -14], label: "True Descent" });
  g.addNode({ id: "goal3", position: [4, 0, -19], label: "The Grapple Anchor" });

  g.addEdge("start3", "d1");
  g.addEdge("d1", "d2");
  g.addEdge("d2", "d3");
  g.addEdge("d2", "d4");
  g.addEdge("d4", "goal3");

  return g;
}

function buildAct4(): Graph {
  // The Loop — Cycle Ward boss. c1-c2-c3-c4-c1 is a genuine cycle; verified
  // with detectCycle() in graph.test.ts rather than eyeballed. The goal
  // hangs off c3, reachable either direction around the ring.
  const g = new Graph();
  g.addNode({ id: "start4", position: [0, 0, 0], label: "The Loop Entrance" });
  g.addNode({ id: "c1", position: [-5, 0, -4], label: "Ring — North" });
  g.addNode({ id: "c2", position: [-9, 0, -9], label: "Ring — West" });
  g.addNode({ id: "c3", position: [-5, 0, -14], label: "Ring — South" });
  g.addNode({ id: "c4", position: [-1, 0, -9], label: "Ring — East" });
  g.addNode({ id: "goal4", position: [-5, 0, -19], label: "The Ward Beacon" });

  g.addEdge("start4", "c1");
  g.addEdge("c1", "c2");
  g.addEdge("c2", "c3");
  g.addEdge("c3", "c4");
  g.addEdge("c4", "c1");
  g.addEdge("c3", "goal4");

  return g;
}

function buildAct5(): Graph {
  // The Bridge — Union-Find finale. Two real, disconnected components:
  // {start5, pylon} and {relay, goal5}. No edge joins them until the
  // player finds the bridge at the pylon and the real union-find merges
  // the two components — rendered as the second cluster drifting in from
  // a visually distant "island."
  const g = new Graph();
  g.addNode({ id: "start5", position: [0, 0, 0], label: "The Bridgeworks" });
  g.addNode({ id: "pylon", position: [-4, 0, -4], label: "The Pylon" });
  g.addNode({ id: "relay", position: [4, 0, -5], label: "Far Relay" });
  g.addNode({ id: "goal5", position: [7, 0, -11], label: "The Convergence" });

  g.addEdge("start5", "pylon");
  g.addEdge("relay", "goal5");
  // Deliberately no pylon<->relay edge — that's the bridge, added live by unionFind.

  return g;
}

export const ACT1: LevelDef = {
  id: "act1",
  title: "Act I — The Entrance",
  graph: buildAct1(),
  startId: "hub",
  goalId: "portal",
  ability: "none",
  briefing: "Walk between connected chambers to reach the First Threshold.",
};

export const ACT2: LevelDef = {
  id: "act2",
  title: "Act II — The Flood Vault",
  graph: buildAct2(),
  startId: "start",
  goalId: "goal",
  ability: "bfsTorch",
  briefing:
    "Fog hides everything beyond this chamber. Use the BFS Torch to reveal every neighboring chamber at once, then find the Beacon in the fewest hops — the shortest route isn't always the one that looks closest.",
};

export const ACT3: LevelDef = {
  id: "act3",
  title: "Act III — The Deep Vaults",
  graph: buildAct3(),
  startId: "start3",
  goalId: "goal3",
  ability: "dfsGrapple",
  rewindCharges: 3,
  briefing:
    "The Grapple commits you fully down one corridor at a time — there's no free retreat. Backtracking to where you came from costs a rewind charge, so choose branches carefully.",
};

export const ACT4: LevelDef = {
  id: "act4",
  title: "Act IV — The Loop",
  graph: buildAct4(),
  startId: "start4",
  goalId: "goal4",
  ability: "cycleWard",
  loopFailThreshold: 3,
  briefing:
    "This ring loops back on itself. Re-entering a chamber you've already visited this loop will tint the world violet — that's your only warning. Escape before you lose the thread three times.",
};

export const ACT5: LevelDef = {
  id: "act5",
  title: "Act V — The Bridge",
  graph: buildAct5(),
  startId: "start5",
  goalId: "goal5",
  ability: "unionFindKey",
  bridge: { a: "pylon", b: "relay" },
  clusterBIds: ["relay", "goal5"],
  clusterBOffset: [16, 4, 10],
  briefing:
    "Two networks, disconnected. Reach the Pylon and use the Union-Find Key to merge them — but only if they're truly separate.",
};

export const ACTS: LevelDef[] = [ACT1, ACT2, ACT3, ACT4, ACT5];

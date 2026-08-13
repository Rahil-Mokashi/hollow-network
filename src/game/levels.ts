import { Graph } from "../graph/types";

export type Ability = "none" | "bfsTorch" | "dfsGrapple" | "cycleWard" | "unionFindKey";

export interface LevelDef {
  id: string;
  title: string;
  graph: Graph;
  startId: string;
  goalId: string | null;
  ability: Ability;
  briefing: string;
  // Real stakes: exceeding this many hops without reaching the goal fails the level.
  moveBudget?: number;
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

function buildAct2Stage1(): Graph {
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

function buildAct2Stage2(): Graph {
  // A bigger flood vault: the same "looks-shortest-isn't" trick, but now
  // needs three separate Torch fires in sequence, and the true 3-hop route
  // (start2b-p1-p3-goal2b) is deliberately drawn as the longer-looking,
  // more spread-out path, while the false 4-hop route (via p2-p4-p5) reads
  // as the tight, "obviously short" cluster.
  const g = new Graph();
  g.addNode({ id: "start2b", position: [0, 0, 0], label: "Deeper Flood Entrance" });
  g.addNode({ id: "p1", position: [-5, 0, -3], label: "Hollow Bend" });
  g.addNode({ id: "p2", position: [5, 0, -3], label: "Near Cluster" });
  g.addNode({ id: "p3", position: [-9, 0, -9], label: "Far Reach" });
  g.addNode({ id: "p4", position: [7, 0, -8], label: "Cluster Two" });
  g.addNode({ id: "p5", position: [9, 0, -14], label: "Cluster Three" });
  g.addNode({ id: "goal2b", position: [2, 0, -15], label: "The Deep Beacon" });

  g.addEdge("start2b", "p1");
  g.addEdge("start2b", "p2");
  g.addEdge("p1", "p3");
  g.addEdge("p2", "p4");
  g.addEdge("p4", "p5");
  g.addEdge("p3", "goal2b");
  g.addEdge("p5", "goal2b");

  return g;
}

function buildAct3Stage1(): Graph {
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

function buildAct3Stage2(): Graph {
  // A longer commit chain with two genuine dead ends instead of one —
  // tighter tension against the same 3 rewind charges, since exploring
  // both wrong branches leaves no margin for a third mistake.
  const g = new Graph();
  g.addNode({ id: "start3b", position: [0, 0, 0], label: "Lower Vault Entrance" });
  g.addNode({ id: "f1", position: [-3, 0, -4], label: "First Descent" });
  g.addNode({ id: "f2", position: [-2, 0, -9], label: "First Fork" });
  g.addNode({ id: "f3", position: [-8, 0, -11], label: "Dead End — North" });
  g.addNode({ id: "f4", position: [3, 0, -13], label: "Second Descent" });
  g.addNode({ id: "f5", position: [2, 0, -18], label: "Second Fork" });
  g.addNode({ id: "f6", position: [8, 0, -20], label: "Dead End — South" });
  g.addNode({ id: "f7", position: [-3, 0, -21], label: "True Descent" });
  g.addNode({ id: "goal3b", position: [-4, 0, -26], label: "The Lower Anchor" });

  g.addEdge("start3b", "f1");
  g.addEdge("f1", "f2");
  g.addEdge("f2", "f3");
  g.addEdge("f2", "f4");
  g.addEdge("f4", "f5");
  g.addEdge("f5", "f6");
  g.addEdge("f5", "f7");
  g.addEdge("f7", "goal3b");

  return g;
}

function buildAct4Stage1(): Graph {
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

function buildAct4Stage2(): Graph {
  // A bigger ring plus a chord (g2-g5), which nests a second, shorter cycle
  // inside the first — two overlapping loops instead of one, escalating the
  // boss without changing the underlying rule: recognize the back-edge.
  const g = new Graph();
  g.addNode({ id: "start4b", position: [0, 0, 0], label: "The Deeper Loop Entrance" });
  g.addNode({ id: "g1", position: [-6, 0, -3], label: "Ring — NW" });
  g.addNode({ id: "g2", position: [-10, 0, -9], label: "Ring — W" });
  g.addNode({ id: "g3", position: [-8, 0, -16], label: "Ring — SW" });
  g.addNode({ id: "g4", position: [-2, 0, -19], label: "Ring — S" });
  g.addNode({ id: "g5", position: [4, 0, -14], label: "Ring — E" });
  g.addNode({ id: "g6", position: [3, 0, -6], label: "Ring — NE" });
  g.addNode({ id: "goal4b", position: [-2, 0, -25], label: "The Deep Ward Beacon" });

  g.addEdge("start4b", "g1");
  g.addEdge("g1", "g2");
  g.addEdge("g2", "g3");
  g.addEdge("g3", "g4");
  g.addEdge("g4", "g5");
  g.addEdge("g5", "g6");
  g.addEdge("g6", "g1");
  g.addEdge("g2", "g5"); // the chord — nests a second cycle inside the ring
  g.addEdge("g4", "goal4b");

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
  title: "Act II — The Flood Vault (1/2)",
  graph: buildAct2Stage1(),
  startId: "start",
  goalId: "goal",
  ability: "bfsTorch",
  moveBudget: 6,
  briefing:
    "Fog hides everything beyond this chamber. Use the BFS Torch to reveal every neighboring chamber at once, then find the Beacon in the fewest hops — the shortest route isn't always the one that looks closest.",
};

export const ACT2B: LevelDef = {
  id: "act2b",
  title: "Act II — The Flood Vault (2/2)",
  graph: buildAct2Stage2(),
  startId: "start2b",
  goalId: "goal2b",
  ability: "bfsTorch",
  moveBudget: 8,
  briefing:
    "The vault runs deeper this time — the same trick, stretched further. You'll need the Torch more than once before the true route reveals itself.",
};

export const ACT3: LevelDef = {
  id: "act3",
  title: "Act III — The Deep Vaults (1/2)",
  graph: buildAct3Stage1(),
  startId: "start3",
  goalId: "goal3",
  ability: "dfsGrapple",
  rewindCharges: 3,
  briefing:
    "The Grapple commits you fully down one corridor at a time — there's no free retreat. Backtracking to where you came from costs a rewind charge, so choose branches carefully.",
};

export const ACT3B: LevelDef = {
  id: "act3b",
  title: "Act III — The Deep Vaults (2/2)",
  graph: buildAct3Stage2(),
  startId: "start3b",
  goalId: "goal3b",
  ability: "dfsGrapple",
  rewindCharges: 3,
  briefing:
    "Two dead ends this time, against the same three charges. Explore both carelessly and you'll strand yourself with nowhere left to retreat.",
};

export const ACT4: LevelDef = {
  id: "act4",
  title: "Act IV — The Loop (1/2)",
  graph: buildAct4Stage1(),
  startId: "start4",
  goalId: "goal4",
  ability: "cycleWard",
  loopFailThreshold: 3,
  briefing:
    "This ring loops back on itself. Re-entering a chamber you've already visited this loop will tint the world violet — that's your only warning. Escape before you lose the thread three times.",
};

export const ACT4B: LevelDef = {
  id: "act4b",
  title: "Act IV — The Loop (2/2)",
  graph: buildAct4Stage2(),
  startId: "start4b",
  goalId: "goal4b",
  ability: "cycleWard",
  loopFailThreshold: 3,
  briefing:
    "A second loop nests inside the first — two ways to lose the thread instead of one. The Ward still fires on the same rule: any chamber revisited this loop.",
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

export const ACTS: LevelDef[] = [ACT1, ACT2, ACT2B, ACT3, ACT3B, ACT4, ACT4B, ACT5];

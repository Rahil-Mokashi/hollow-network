import { Graph } from "../graph/types";

export interface LevelDef {
  id: "act1" | "act2";
  title: string;
  graph: Graph;
  startId: string;
  goalId: string | null;
  requiresTorch: boolean;
  briefing: string;
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

export const ACT1: LevelDef = {
  id: "act1",
  title: "Act I — The Entrance",
  graph: buildAct1(),
  startId: "hub",
  goalId: "portal",
  requiresTorch: false,
  briefing: "Walk between connected chambers to reach the First Threshold.",
};

export const ACT2: LevelDef = {
  id: "act2",
  title: "Act II — The Flood Vault",
  graph: buildAct2(),
  startId: "start",
  goalId: "goal",
  requiresTorch: true,
  briefing:
    "Fog hides everything beyond this chamber. Use the BFS Torch to reveal every neighboring chamber at once, then find the Beacon in the fewest hops — the shortest route isn't always the one that looks closest.",
};

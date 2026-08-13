import { create } from "zustand";
import { Graph } from "../graph/types";
import { bfsOneRing, bfsShortestPath } from "../graph/bfs";
import { ACT1, ACT2 } from "./levels";
import type { LevelDef } from "./levels";

interface TravelAnim {
  from: string;
  to: string;
}

interface GameState {
  level: LevelDef;
  graph: Graph;
  currentNodeId: string;
  revealedNodeIds: Set<string>;
  hopsTaken: number;
  optimalHops: number | null;
  won: boolean;
  torchUnlocked: boolean;
  torchUsed: boolean;
  torchPulseAt: number | null;
  travelAnim: TravelAnim | null;
  lastAbilityLog: string | null;

  loadLevel: (level: LevelDef) => void;
  canTravelTo: (nodeId: string) => boolean;
  beginTravel: (nodeId: string) => void;
  finishTravel: () => void;
  triggerTorch: () => void;
  advanceToAct2: () => void;
  restartAct2: () => void;
}

function initialReveal(level: LevelDef): Set<string> {
  if (level.requiresTorch) return new Set([level.startId]);
  return new Set(level.graph.nodeIds());
}

export const useGameStore = create<GameState>((set, get) => ({
  level: ACT1,
  graph: ACT1.graph,
  currentNodeId: ACT1.startId,
  revealedNodeIds: initialReveal(ACT1),
  hopsTaken: 0,
  optimalHops: ACT1.goalId ? bfsShortestPath(ACT1.graph, ACT1.startId, ACT1.goalId)!.length - 1 : null,
  won: false,
  torchUnlocked: false,
  torchUsed: false,
  torchPulseAt: null,
  travelAnim: null,
  lastAbilityLog: null,

  loadLevel: (level) =>
    set({
      level,
      graph: level.graph,
      currentNodeId: level.startId,
      revealedNodeIds: initialReveal(level),
      hopsTaken: 0,
      optimalHops: level.goalId ? bfsShortestPath(level.graph, level.startId, level.goalId)!.length - 1 : null,
      won: false,
      travelAnim: null,
    }),

  canTravelTo: (nodeId) => {
    const { graph, currentNodeId, revealedNodeIds, travelAnim } = get();
    if (travelAnim) return false;
    return graph.hasEdge(currentNodeId, nodeId) && revealedNodeIds.has(nodeId);
  },

  beginTravel: (nodeId) => {
    if (!get().canTravelTo(nodeId)) return;
    set({ travelAnim: { from: get().currentNodeId, to: nodeId } });
  },

  finishTravel: () => {
    const { travelAnim, level, hopsTaken } = get();
    if (!travelAnim) return;
    const won = travelAnim.to === level.goalId;
    set({
      currentNodeId: travelAnim.to,
      travelAnim: null,
      hopsTaken: hopsTaken + 1,
      won,
    });
  },

  triggerTorch: () => {
    const { level, currentNodeId, revealedNodeIds } = get();
    if (!level.requiresTorch) return;
    set({ torchPulseAt: Date.now(), lastAbilityLog: "bfsTorch", torchUsed: true });
    const ring = bfsOneRing(level.graph, currentNodeId);
    setTimeout(() => {
      const next = new Set(revealedNodeIds);
      ring.forEach((id) => next.add(id));
      set({ revealedNodeIds: next });
    }, 420);
  },

  advanceToAct2: () => {
    set({ torchUnlocked: true });
    get().loadLevel(ACT2);
  },

  restartAct2: () => get().loadLevel(ACT2),
}));

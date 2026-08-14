import { create } from "zustand";
import { Graph } from "../graph/types";
import { bfsOneRing, bfsShortestPath } from "../graph/bfs";
import { UnionFind } from "../graph/unionFind";
import { ACT1, ACTS } from "./levels";
import type { LevelDef } from "./levels";
import { playChime, playCommit, playRewind, playDejaVu, playFanfare, playSwell, playWhoosh } from "../audio/sound";

interface TravelAnim {
  from: string;
  to: string;
  isBacktrack: boolean;
}

interface GameState {
  screen: "title" | "playing" | "maze" | "archive" | "sort";
  runStartAt: number | null;
  runHops: number;
  runRewinds: number;
  runDejaVu: number;

  level: LevelDef;
  graph: Graph;
  currentNodeId: string;
  revealedNodeIds: Set<string>;
  hopsTaken: number;
  optimalHops: number | null;
  won: boolean;
  travelAnim: TravelAnim | null;
  failed: boolean;
  failReason: "stuck" | "budget" | null;

  // BFS Torch (Act II)
  torchUsed: boolean;
  torchPulseAt: number | null;

  // DFS Grapple (Act III)
  dfsPath: string[];
  rewindCharges: number;
  grappleUsed: boolean;

  // Cycle Ward (Act IV)
  visitedThisLoop: Set<string>;
  loopRepeats: number;
  dejaVuAt: number | null;
  cycleWardUsed: boolean;

  // Union-Find Key (Act V)
  bridgeActive: boolean;
  mergeAt: number | null;
  unionFindUsed: boolean;
  wonFinale: boolean;

  loadLevel: (level: LevelDef) => void;
  canTravelTo: (nodeId: string) => boolean;
  beginTravel: (nodeId: string) => void;
  finishTravel: () => void;
  triggerAbility: () => void;
  advanceToLevel: (level: LevelDef) => void;
  restartLevel: () => void;
  skipLevel: () => void;
  startRun: () => void;
  returnToTitle: () => void;
  enterMaze: () => void;
  enterArchive: () => void;
  enterSort: () => void;
}

function initialReveal(level: LevelDef): Set<string> {
  if (level.ability === "none") return new Set(level.graph.nodeIds());
  return new Set([level.startId]);
}

function computeOptimal(level: LevelDef): number | null {
  if (!level.goalId) return null;
  const path = bfsShortestPath(level.graph, level.startId, level.goalId);
  return path ? path.length - 1 : null;
}

export const TOTAL_OPTIMAL_HOPS = ACTS.reduce((sum, act) => sum + (computeOptimal(act) ?? 0), 0);

export const useGameStore = create<GameState>((set, get) => ({
  screen: "title",
  runStartAt: null,
  runHops: 0,
  runRewinds: 0,
  runDejaVu: 0,

  level: ACT1,
  graph: ACT1.graph,
  currentNodeId: ACT1.startId,
  revealedNodeIds: initialReveal(ACT1),
  hopsTaken: 0,
  optimalHops: computeOptimal(ACT1),
  won: false,
  travelAnim: null,
  failed: false,
  failReason: null,

  torchUsed: false,
  torchPulseAt: null,

  dfsPath: [ACT1.startId],
  rewindCharges: 0,
  grappleUsed: false,

  visitedThisLoop: new Set([ACT1.startId]),
  loopRepeats: 0,
  dejaVuAt: null,
  cycleWardUsed: false,

  bridgeActive: false,
  mergeAt: null,
  unionFindUsed: false,
  wonFinale: false,

  loadLevel: (level) =>
    set({
      level,
      graph: level.graph,
      currentNodeId: level.startId,
      revealedNodeIds: initialReveal(level),
      hopsTaken: 0,
      optimalHops: computeOptimal(level),
      won: false,
      travelAnim: null,
      failed: false,
      failReason: null,
      dfsPath: [level.startId],
      rewindCharges: level.rewindCharges ?? 0,
      visitedThisLoop: new Set([level.startId]),
      loopRepeats: 0,
      dejaVuAt: null,
      bridgeActive: false,
      mergeAt: null,
      wonFinale: false,
    }),

  canTravelTo: (nodeId) => {
    const { level, graph, currentNodeId, revealedNodeIds, travelAnim, dfsPath, rewindCharges, failed } = get();
    if (travelAnim || failed) return false;
    if (!graph.hasEdge(currentNodeId, nodeId)) return false;

    // BFS Torch is the only ability that gates movement behind an explicit
    // reveal step — every other ability treats "graph-adjacent" as reachable,
    // since for those, moving IS the exploration.
    if (level.ability === "bfsTorch") {
      return revealedNodeIds.has(nodeId);
    }

    if (level.ability === "dfsGrapple") {
      const alreadyVisited = revealedNodeIds.has(nodeId);
      if (!alreadyVisited) return true;
      const parent = dfsPath.length >= 2 ? dfsPath[dfsPath.length - 2] : null;
      return nodeId === parent && rewindCharges > 0;
    }

    return true;
  },

  beginTravel: (nodeId) => {
    const { level, currentNodeId, dfsPath, canTravelTo } = get();
    if (!canTravelTo(nodeId)) return;

    let isBacktrack = false;
    if (level.ability === "dfsGrapple") {
      const parent = dfsPath.length >= 2 ? dfsPath[dfsPath.length - 2] : null;
      isBacktrack = nodeId === parent;
      isBacktrack ? playRewind() : playCommit();
    } else {
      playWhoosh();
    }

    set({ travelAnim: { from: currentNodeId, to: nodeId, isBacktrack } });
  },

  finishTravel: () => {
    const state = get();
    const { travelAnim, level, hopsTaken, revealedNodeIds, dfsPath, rewindCharges, visitedThisLoop, loopRepeats, runHops, runRewinds, runDejaVu } = state;
    if (!travelAnim) return;
    const { to, isBacktrack } = travelAnim;

    const nextRevealed = new Set(revealedNodeIds);
    nextRevealed.add(to);

    const patch: Partial<GameState> = {
      currentNodeId: to,
      travelAnim: null,
      hopsTaken: hopsTaken + 1,
      revealedNodeIds: nextRevealed,
      runHops: runHops + 1,
    };

    if (level.ability === "dfsGrapple") {
      patch.grappleUsed = true;
      if (isBacktrack) {
        patch.dfsPath = dfsPath.slice(0, -1);
        patch.rewindCharges = rewindCharges - 1;
        patch.runRewinds = runRewinds + 1;
      } else {
        patch.dfsPath = [...dfsPath, to];
      }
    }

    if (level.ability === "cycleWard") {
      patch.cycleWardUsed = true;
      const isDejaVu = visitedThisLoop.has(to);
      if (isDejaVu) {
        patch.dejaVuAt = Date.now();
        patch.loopRepeats = loopRepeats + 1;
        patch.runDejaVu = runDejaVu + 1;
        playDejaVu();
      } else {
        const nextLoop = new Set(visitedThisLoop);
        nextLoop.add(to);
        patch.visitedThisLoop = nextLoop;
      }
      const threshold = level.loopFailThreshold ?? 3;
      if ((patch.loopRepeats ?? loopRepeats) >= threshold) {
        patch.currentNodeId = level.startId;
        patch.visitedThisLoop = new Set([level.startId]);
        patch.loopRepeats = 0;
      }
    }

    const won = to === level.goalId;
    patch.won = won;
    if (won) {
      playFanfare();
      if (level.id === "act5") patch.wonFinale = true;
    }

    set(patch);

    if (!won) {
      const after = get();
      if (after.level.moveBudget && after.hopsTaken >= after.level.moveBudget) {
        set({ failed: true, failReason: "budget" });
      } else if (after.level.ability === "dfsGrapple") {
        const canMove = after.graph.neighbors(after.currentNodeId).some((n) => after.canTravelTo(n));
        if (!canMove) set({ failed: true, failReason: "stuck" });
      }
    }
  },

  triggerAbility: () => {
    const { level, graph, currentNodeId, revealedNodeIds, failed } = get();
    if (failed) return;

    if (level.ability === "bfsTorch") {
      set({ torchPulseAt: Date.now(), torchUsed: true });
      playChime();
      const ring = bfsOneRing(level.graph, currentNodeId);
      setTimeout(() => {
        const next = new Set(get().revealedNodeIds);
        ring.forEach((id) => next.add(id));
        set({ revealedNodeIds: next });
      }, 420);
      return;
    }

    if (level.ability === "unionFindKey" && level.bridge) {
      if (currentNodeId !== level.bridge.a) return;
      const uf = new UnionFind(graph.nodeIds());
      for (const edge of graph.edges) uf.union(edge.a, edge.b);
      if (uf.connected(level.bridge.a, level.bridge.b)) return;

      graph.addEdge(level.bridge.a, level.bridge.b);
      const nextRevealed = new Set(revealedNodeIds);
      (level.clusterBIds ?? []).forEach((id) => nextRevealed.add(id));
      playSwell();
      set({ bridgeActive: true, mergeAt: Date.now(), unionFindUsed: true, revealedNodeIds: nextRevealed });
    }
  },

  advanceToLevel: (level) => get().loadLevel(level),
  restartLevel: () => get().loadLevel(get().level),

  skipLevel: () => {
    const { level } = get();
    const idx = ACTS.findIndex((a) => a.id === level.id);
    const next = idx >= 0 && idx < ACTS.length - 1 ? ACTS[idx + 1] : null;
    if (next) {
      get().loadLevel(next);
    } else {
      // Last stage (Act V) — skipping it means completing the campaign.
      set({ won: true, wonFinale: true, failed: false, travelAnim: null });
    }
  },

  startRun: () => {
    set({ screen: "playing", runStartAt: Date.now(), runHops: 0, runRewinds: 0, runDejaVu: 0 });
    get().loadLevel(ACT1);
  },

  returnToTitle: () => set({ screen: "title" }),
  enterMaze: () => set({ screen: "maze" }),
  enterArchive: () => set({ screen: "archive" }),
  enterSort: () => set({ screen: "sort" }),
}));

export { ACTS };
export const nextActAfter = (levelId: string): LevelDef | null => {
  const idx = ACTS.findIndex((a) => a.id === levelId);
  return idx >= 0 && idx < ACTS.length - 1 ? ACTS[idx + 1] : null;
};

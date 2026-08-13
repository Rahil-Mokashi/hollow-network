import { Graph } from "./types";
import type { CycleResult } from "./types";

/**
 * Detects a cycle in an undirected graph via DFS, tracking each node's
 * parent so the edge back to the node you just came from doesn't count as
 * a cycle. The first true back-edge found (to an already-visited,
 * non-parent node) is what triggers the Cycle Ward's déjà-vu tint.
 */
export function detectCycle(graph: Graph, startId: string): CycleResult {
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const visitOrder: string[] = [];

  function walk(nodeId: string, parentId: string | null): CycleResult | null {
    visited.add(nodeId);
    visitOrder.push(nodeId);
    if (parentId) parent.set(nodeId, parentId);

    for (const neighbor of graph.neighbors(nodeId)) {
      if (neighbor === parentId) continue;
      if (visited.has(neighbor)) {
        return {
          hasCycle: true,
          closingNode: neighbor,
          backEdge: [nodeId, neighbor],
          visitOrder: [...visitOrder],
        };
      }
      const found = walk(neighbor, nodeId);
      if (found) return found;
    }
    return null;
  }

  const result = walk(startId, null);
  return (
    result ?? {
      hasCycle: false,
      closingNode: null,
      backEdge: null,
      visitOrder: [...visitOrder],
    }
  );
}

/** True if entering `nodeId` this step revisits a node already seen in the current loop attempt. */
export function isDejaVu(visitedThisLoop: Set<string>, nodeId: string): boolean {
  return visitedThisLoop.has(nodeId);
}

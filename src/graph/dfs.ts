import { Graph } from "./types";
import type { DFSStep } from "./types";

/**
 * Depth-first search with an explicit call stack, recorded as push/pop
 * steps. The DFS Grapple's rewind charges consume exactly one "pop" each,
 * so the stack here must match the traversal the player actually walks.
 */
export function dfs(graph: Graph, startId: string): DFSStep[] {
  const steps: DFSStep[] = [];
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(nodeId: string): void {
    visited.add(nodeId);
    stack.push(nodeId);
    steps.push({ node: nodeId, action: "push", stack: [...stack] });

    for (const neighbor of graph.neighbors(nodeId)) {
      if (!visited.has(neighbor)) {
        visit(neighbor);
      }
    }

    stack.pop();
    steps.push({ node: nodeId, action: "pop", stack: [...stack] });
  }

  visit(startId);
  return steps;
}

/** Depth-first path from start to goal (first path found, not necessarily shortest). */
export function dfsPath(graph: Graph, startId: string, goalId: string): string[] | null {
  const visited = new Set<string>();
  const path: string[] = [];

  function walk(nodeId: string): boolean {
    visited.add(nodeId);
    path.push(nodeId);
    if (nodeId === goalId) return true;

    for (const neighbor of graph.neighbors(nodeId)) {
      if (!visited.has(neighbor) && walk(neighbor)) return true;
    }

    path.pop();
    return false;
  }

  return walk(startId) ? path : null;
}

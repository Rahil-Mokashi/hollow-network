import { Graph } from "./types";
import type { BFSStep } from "./types";

/**
 * Breadth-first search. Returns the full step trace so the renderer can
 * replay it; each step records every node that entered the frontier during
 * that same "ring" (depth), which is what makes BFS Torch reveal a whole
 * ring of neighbors at once instead of one at a time.
 */
export function bfs(graph: Graph, startId: string): BFSStep[] {
  const steps: BFSStep[] = [];
  const visited = new Set<string>([startId]);
  let frontier = [startId];
  let depth = 0;

  steps.push({ visited: startId, frontier: [startId], depth });

  while (frontier.length > 0) {
    const nextFrontier: string[] = [];
    depth += 1;
    for (const nodeId of frontier) {
      for (const neighbor of graph.neighbors(nodeId)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextFrontier.push(neighbor);
        }
      }
    }
    if (nextFrontier.length === 0) break;
    steps.push({ visited: nextFrontier[nextFrontier.length - 1], frontier: nextFrontier, depth });
    frontier = nextFrontier;
  }

  return steps;
}

/** Neighbors reachable in exactly one hop from a node — what BFS Torch reveals. */
export function bfsOneRing(graph: Graph, fromId: string): string[] {
  return graph.neighbors(fromId);
}

/** Shortest hop-count path between two nodes (BFS shortest path). */
export function bfsShortestPath(graph: Graph, startId: string, goalId: string): string[] | null {
  if (startId === goalId) return [startId];
  const cameFrom = new Map<string, string>();
  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of graph.neighbors(current)) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      cameFrom.set(neighbor, current);
      if (neighbor === goalId) {
        const path = [goalId];
        let node = goalId;
        while (cameFrom.has(node)) {
          node = cameFrom.get(node)!;
          path.unshift(node);
        }
        return path;
      }
      queue.push(neighbor);
    }
  }
  return null;
}

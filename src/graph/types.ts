export type Vec3 = [number, number, number];

export interface GraphNode {
  id: string;
  position: Vec3;
  label?: string;
}

export interface GraphEdge {
  a: string;
  b: string;
  weight?: number;
}

export class Graph {
  nodes: Map<string, GraphNode> = new Map();
  edges: GraphEdge[] = [];
  private adjacency: Map<string, string[]> = new Map();

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) this.adjacency.set(node.id, []);
  }

  addEdge(a: string, b: string, weight = 1): void {
    this.edges.push({ a, b, weight });
    this.adjacency.get(a)?.push(b);
    this.adjacency.get(b)?.push(a);
  }

  neighbors(id: string): string[] {
    return this.adjacency.get(id) ?? [];
  }

  nodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  hasEdge(a: string, b: string): boolean {
    return this.neighbors(a).includes(b);
  }
}

export interface BFSStep {
  visited: string;
  frontier: string[];
  depth: number;
}

export interface DFSStep {
  node: string;
  action: "push" | "pop";
  stack: string[];
}

export interface CycleResult {
  hasCycle: boolean;
  closingNode: string | null;
  backEdge: [string, string] | null;
  visitOrder: string[];
}

export interface UnionFindTrace {
  merged: [string, string] | null;
  components: string[][];
}

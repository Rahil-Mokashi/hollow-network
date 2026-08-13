import type { UnionFindTrace } from "./types";

/** Classic disjoint-set with path compression and union by rank. */
export class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  constructor(ids: string[]) {
    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(id: string): string {
    const p = this.parent.get(id);
    if (p === undefined) throw new Error(`Unknown id: ${id}`);
    if (p !== id) {
      const root = this.find(p);
      this.parent.set(id, root);
      return root;
    }
    return id;
  }

  /** Merges the components containing a and b. Returns false if they were already connected. */
  union(a: string, b: string): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;

    const rankA = this.rank.get(rootA) ?? 0;
    const rankB = this.rank.get(rootB) ?? 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
    return true;
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }

  /** Groups every id into its connected component, for rendering the "islands." */
  components(): string[][] {
    const groups = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(id);
    }
    return Array.from(groups.values());
  }
}

/** Traces the merge of two components after unioning a bridge edge — drives the finale animation. */
export function unionTrace(uf: UnionFind, bridgeA: string, bridgeB: string): UnionFindTrace {
  const alreadyConnected = uf.connected(bridgeA, bridgeB);
  const merged = alreadyConnected ? null : ([bridgeA, bridgeB] as [string, string]);
  if (!alreadyConnected) uf.union(bridgeA, bridgeB);
  return { merged, components: uf.components() };
}

export interface BSTNode {
  id: string;
  value: number;
  left: string | null;
  right: string | null;
  parent: string | null;
  depth: number;
}

export type Direction = "left" | "right";

/** The comparison rule a BST is built from: which side a value belongs on
 * relative to a node. The entire game (insert AND search) is just this
 * one function, applied repeatedly. */
export function correctDirection(nodeValue: number, targetValue: number): Direction {
  return targetValue < nodeValue ? "left" : "right";
}

/** A binary search tree keyed by generated ids (not values), so the same
 * value could in principle appear as a fresh node without id collisions —
 * though the game itself only ever inserts distinct values. */
export class BST {
  nodes: Map<string, BSTNode> = new Map();
  rootId: string | null = null;
  private nextId = 0;

  private allocate(value: number, parent: string | null, depth: number): BSTNode {
    const id = `n${this.nextId++}`;
    const node: BSTNode = { id, value, left: null, right: null, parent, depth };
    this.nodes.set(id, node);
    return node;
  }

  /** Places the root directly — used once, to seed the tree before play begins. */
  seedRoot(value: number): BSTNode {
    const node = this.allocate(value, null, 0);
    this.rootId = node.id;
    return node;
  }

  /** Attaches `value` as the given child of `parentId`. Throws if that slot is occupied. */
  attach(parentId: string, direction: Direction, value: number): BSTNode {
    const parent = this.nodes.get(parentId);
    if (!parent) throw new Error(`Unknown parent id: ${parentId}`);
    if (parent[direction] !== null) throw new Error(`${direction} of ${parentId} is already occupied`);
    const node = this.allocate(value, parentId, parent.depth + 1);
    parent[direction] = node.id;
    return node;
  }

  /** Full, real BST insert — used only for tests and for computing "what
   * the correct path looks like," never called directly during play (play
   * walks it one comparison at a time via correctDirection + attach). */
  insert(value: number): { path: string[]; newNodeId: string } {
    const path: string[] = [];
    if (this.rootId === null) {
      const node = this.seedRoot(value);
      return { path, newNodeId: node.id };
    }
    let currentId = this.rootId;
    for (;;) {
      path.push(currentId);
      const current = this.nodes.get(currentId)!;
      const dir = correctDirection(current.value, value);
      const childId = current[dir];
      if (childId === null) {
        const node = this.attach(currentId, dir, value);
        return { path, newNodeId: node.id };
      }
      currentId = childId;
    }
  }

  /** Real BST search — walks left/right by comparison until it finds the
   * value or falls off the tree. Returns the full path either way. */
  search(value: number): { path: string[]; foundId: string | null } {
    const path: string[] = [];
    let currentId = this.rootId;
    while (currentId !== null) {
      path.push(currentId);
      const current = this.nodes.get(currentId)!;
      if (value === current.value) return { path, foundId: currentId };
      currentId = current[correctDirection(current.value, value)];
    }
    return { path, foundId: null };
  }

  /** In-order traversal — for a real BST this is always the values in
   * sorted order, which is the load-bearing correctness property tested
   * against every tree the game actually builds. */
  inorder(): number[] {
    const out: number[] = [];
    const visit = (id: string | null): void => {
      if (id === null) return;
      const node = this.nodes.get(id)!;
      visit(node.left);
      out.push(node.value);
      visit(node.right);
    };
    visit(this.rootId);
    return out;
  }
}

import { describe, it, expect } from "vitest";
import { BST, correctDirection } from "./bst";

describe("correctDirection", () => {
  it("smaller values go left, larger (or equal) go right", () => {
    expect(correctDirection(50, 30)).toBe("left");
    expect(correctDirection(50, 70)).toBe("right");
    expect(correctDirection(50, 50)).toBe("right");
  });
});

describe("BST.insert", () => {
  it("the first insert becomes the root at depth 0", () => {
    const tree = new BST();
    const { newNodeId } = tree.insert(50);
    expect(tree.rootId).toBe(newNodeId);
    expect(tree.nodes.get(newNodeId)!.depth).toBe(0);
  });

  it("in-order traversal is always sorted order, for any insertion sequence", () => {
    const sequences = [
      [50, 30, 70, 20, 40, 60, 80],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
      [10, 5, 15, 3, 7, 12, 20, 1, 4, 6, 8],
    ];
    for (const seq of sequences) {
      const tree = new BST();
      for (const v of seq) tree.insert(v);
      expect(tree.inorder()).toEqual([...seq].sort((a, b) => a - b));
    }
  });

  it("depth grows by exactly one per level down the correct branch", () => {
    const tree = new BST();
    tree.insert(50);
    tree.insert(30);
    tree.insert(20);
    const depths = [...tree.nodes.values()].sort((a, b) => a.depth - b.depth).map((n) => n.value);
    expect(depths).toEqual([50, 30, 20]);
  });
});

describe("BST.search", () => {
  it("finds an inserted value and the path ends at it", () => {
    const tree = new BST();
    [50, 30, 70, 20, 40, 60, 80].forEach((v) => tree.insert(v));
    const { path, foundId } = tree.search(60);
    expect(foundId).not.toBeNull();
    expect(tree.nodes.get(foundId!)!.value).toBe(60);
    expect(tree.nodes.get(path[path.length - 1])!.value).toBe(60);
  });

  it("a value that was never inserted is correctly reported as not found", () => {
    const tree = new BST();
    [50, 30, 70, 20, 40].forEach((v) => tree.insert(v));
    const { foundId } = tree.search(45);
    expect(foundId).toBeNull();
  });

  it("the search path always follows correctDirection at every step", () => {
    const tree = new BST();
    [50, 30, 70, 20, 40, 60, 80, 35].forEach((v) => tree.insert(v));
    const { path } = tree.search(35);
    for (let i = 0; i < path.length - 1; i++) {
      const node = tree.nodes.get(path[i])!;
      const expectedDir = correctDirection(node.value, 35);
      expect(node[expectedDir]).toBe(path[i + 1]);
    }
  });
});

describe("BST.attach (the step-by-step path the actual game plays through)", () => {
  it("matches the result of a direct insert when following correctDirection manually", () => {
    const tree = new BST();
    const root = tree.seedRoot(50);
    // Manually walk to where 35 belongs, one comparison at a time.
    let cursor = root;
    const target = 35;
    while (true) {
      const dir = correctDirection(cursor.value, target);
      const childId = cursor[dir];
      if (childId === null) {
        tree.attach(cursor.id, dir, target);
        break;
      }
      cursor = tree.nodes.get(childId)!;
    }

    const reference = new BST();
    reference.insert(50);
    reference.insert(35);
    expect(tree.inorder()).toEqual(reference.inorder());
  });

  it("throws if the slot is already occupied — attach never silently overwrites", () => {
    const tree = new BST();
    const root = tree.seedRoot(50);
    tree.attach(root.id, "left", 30);
    expect(() => tree.attach(root.id, "left", 20)).toThrow();
  });
});

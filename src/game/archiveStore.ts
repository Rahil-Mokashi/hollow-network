import { create } from "zustand";
import { BST, correctDirection } from "../graph/bst";
import type { Direction } from "../graph/bst";
import { playCommit, playRewind, playChime, playFanfare } from "../audio/sound";

const INSERT_ROOT = 50;
const INSERT_QUEUE = [30, 70, 20, 40, 60, 80, 35];
const SEARCH_TARGETS = [60, 35, 45]; // 45 doesn't exist — a real "not found" case

type Phase = "insert" | "search" | "done";

interface ArchiveState {
  tree: BST;
  version: number; // bumped on every tree mutation, since BST mutates in place
  phase: Phase;
  cursorId: string;
  insertQueue: number[];
  searchIndex: number;
  mistakes: number;
  lastAttempt: { direction: Direction; correct: boolean; at: number } | null;
  justPlacedId: string | null;
  justPlacedAt: number | null;
  notFoundAt: number | null;

  currentTarget: () => number | null;
  chooseDirection: (dir: Direction) => void;
  reset: () => void;
}

function freshTree(): { tree: BST; rootId: string } {
  const tree = new BST();
  const root = tree.seedRoot(INSERT_ROOT);
  return { tree, rootId: root.id };
}

const { tree: initialTree, rootId: initialRoot } = freshTree();

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  tree: initialTree,
  version: 0,
  phase: "insert",
  cursorId: initialRoot,
  insertQueue: [...INSERT_QUEUE],
  searchIndex: 0,
  mistakes: 0,
  lastAttempt: null,
  justPlacedId: null,
  justPlacedAt: null,
  notFoundAt: null,

  currentTarget: () => {
    const { phase, insertQueue, searchIndex } = get();
    if (phase === "insert") return insertQueue[0] ?? null;
    if (phase === "search") return SEARCH_TARGETS[searchIndex] ?? null;
    return null;
  },

  chooseDirection: (dir) => {
    const state = get();
    const { tree, phase, cursorId } = state;
    const target = state.currentTarget();
    if (target === null) return;

    const cursorNode = tree.nodes.get(cursorId)!;

    if (phase === "search" && target === cursorNode.value) {
      // The cursor already sits on the match (this only happens if a
      // search target equals the value it starts on) — complete the find
      // immediately rather than waiting on a button press that has
      // nothing left to decide.
      playFanfare();
      advanceSearch(set, get);
      return;
    }

    const correct = correctDirection(cursorNode.value, target);
    const isCorrect = dir === correct;
    set({ lastAttempt: { direction: dir, correct: isCorrect, at: Date.now() } });

    if (!isCorrect) {
      set((s) => ({ mistakes: s.mistakes + 1 }));
      playRewind();
      return;
    }

    playCommit();
    const childId = cursorNode[dir];

    if (phase === "insert") {
      if (childId === null) {
        const node = tree.attach(cursorId, dir, target);
        const remaining = state.insertQueue.slice(1);
        playChime();
        set({
          version: state.version + 1,
          justPlacedId: node.id,
          justPlacedAt: Date.now(),
          insertQueue: remaining,
          cursorId: tree.rootId!,
        });
        if (remaining.length === 0) {
          set({ phase: "search", searchIndex: 0, cursorId: tree.rootId! });
        }
        return;
      }
      set({ cursorId: childId, version: state.version + 1 });
      return;
    }

    if (phase === "search") {
      if (childId === null) {
        // Correct direction, but nothing there — a real, valid "not found."
        set({ notFoundAt: Date.now() });
        advanceSearch(set, get);
        return;
      }
      const childNode = tree.nodes.get(childId)!;
      if (childNode.value === target) {
        playFanfare();
        set({ cursorId: childId, version: state.version + 1 });
        advanceSearch(set, get);
        return;
      }
      set({ cursorId: childId, version: state.version + 1 });
    }
  },

  reset: () => {
    const { tree, rootId } = freshTree();
    set({
      tree,
      version: 0,
      phase: "insert",
      cursorId: rootId,
      insertQueue: [...INSERT_QUEUE],
      searchIndex: 0,
      mistakes: 0,
      lastAttempt: null,
      justPlacedId: null,
      justPlacedAt: null,
      notFoundAt: null,
    });
  },
}));

function advanceSearch(set: (partial: Partial<ArchiveState>) => void, get: () => ArchiveState) {
  const nextIndex = get().searchIndex + 1;
  if (nextIndex >= SEARCH_TARGETS.length) {
    set({ phase: "done" });
    return;
  }
  setTimeout(() => {
    set({ searchIndex: nextIndex, cursorId: get().tree.rootId! });
  }, 900);
}

export { INSERT_ROOT, INSERT_QUEUE, SEARCH_TARGETS };

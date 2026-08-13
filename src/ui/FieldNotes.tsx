import { useGameStore } from "../game/store";

const ENTRIES: { key: string; title: string; body: string; unlocked: (s: ReturnType<typeof useGameStore.getState>) => boolean }[] = [
  {
    key: "movement",
    title: "Graph traversal",
    body: "This world is a graph: chambers are nodes, corridors are edges. You can only ever move along an edge that actually exists — there's no walking through open space.",
    unlocked: () => true,
  },
  {
    key: "bfs",
    title: "Breadth-first search",
    body: "The Torch reveals every neighboring chamber the instant it fires — not one at a time, but all at once. That's what \"breadth\"-first means: explore everything one step away before going any further.",
    unlocked: (s) => s.torchUsed,
  },
  {
    key: "dfs",
    title: "Depth-first search",
    body: "The Grapple commits you fully down one branch before backtracking — that's \"depth\"-first. Backtracking to where you came from pops your path, exactly like a call stack unwinding.",
    unlocked: (s) => s.grappleUsed,
  },
  {
    key: "cycle",
    title: "Cycle detection",
    body: "A cycle exists when you can walk back to a chamber you've already visited without retracing your steps. The violet tint fires the instant that back-edge is detected — not on a hunch, on the real algorithm.",
    unlocked: (s) => s.cycleWardUsed,
  },
  {
    key: "unionfind",
    title: "Union-find",
    body: "Two chambers are \"connected\" if some path links them, even indirectly. Union-find tracks which chambers belong to the same connected group, and merges two groups the instant a bridge joins them.",
    unlocked: (s) => s.unionFindUsed,
  },
];

export function FieldNotes() {
  const state = useGameStore();
  const unlocked = ENTRIES.filter((e) => e.unlocked(state));

  return (
    <div className="panel field-notes">
      <div className="panel-label">Field Notes</div>
      {unlocked.map((entry) => (
        <div key={entry.key} className="note-entry">
          <div className="note-title">{entry.title}</div>
          <p>{entry.body}</p>
        </div>
      ))}
    </div>
  );
}

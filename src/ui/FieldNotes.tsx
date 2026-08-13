import { useGameStore } from "../game/store";

const ENTRIES: { key: string; title: string; body: string }[] = [
  {
    key: "movement",
    title: "Graph traversal",
    body: "This world is a graph: chambers are nodes, corridors are edges. You can only ever move along an edge that actually exists — there's no walking through open space.",
  },
  {
    key: "bfs",
    title: "Breadth-first search",
    body: "The Torch reveals every neighboring chamber the instant it fires — not one at a time, but all at once. That's what \"breadth\"-first means: explore everything one step away before going any further.",
  },
];

export function FieldNotes() {
  const torchUsed = useGameStore((s) => s.torchUsed);
  const unlocked = ENTRIES.filter((e) => e.key === "movement" || (e.key === "bfs" && torchUsed));

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

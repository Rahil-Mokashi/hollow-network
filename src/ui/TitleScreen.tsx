import { useGameStore } from "../game/store";
import { loadBestRun, formatTime } from "../game/score";

export function TitleScreen() {
  const startRun = useGameStore((s) => s.startRun);
  const best = loadBestRun();

  return (
    <div className="title-screen">
      <div className="title-scrim" />
      <div className="title-content">
        <div className="title-eyebrow">A 3D game built entirely out of graph algorithms</div>
        <h1 className="title-heading">THE HOLLOW NETWORK</h1>
        <p className="title-tagline">
          Every chamber is a node. Every corridor is an edge. Every ability you earn is a real,
          tested algorithm running underneath you — not a visual approximation of one.
        </p>
        <div className="title-algos">
          <span>Breadth-first search</span>
          <span>Depth-first search</span>
          <span>Cycle detection</span>
          <span>Union-find</span>
        </div>
        <button className="title-start-btn" onClick={startRun}>
          Enter the Network
        </button>
        {best && (
          <div className="title-best">
            Best run: <strong>{best.grade}</strong> rank · {best.hops} hops · {formatTime(best.timeMs)}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useMazeStore, MAZE_ANIM_DURATION_MS } from "../game/mazeStore";
import { useGameStore } from "../game/store";
import type { Heuristic } from "../graph/astar";

const HEURISTIC_LABEL: Record<Heuristic, string> = {
  manhattan: "Manhattan",
  euclidean: "Euclidean",
};

export function MazeUI() {
  const heuristic = useMazeStore((s) => s.heuristic);
  const result = useMazeStore((s) => s.result);
  const comparisonCounts = useMazeStore((s) => s.comparisonCounts);
  const solvedAt = useMazeStore((s) => s.solvedAt);
  const setHeuristic = useMazeStore((s) => s.setHeuristic);
  const replay = useMazeStore((s) => s.replay);
  const returnToTitle = useGameStore((s) => s.returnToTitle);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = now - solvedAt;
  const totalSteps = result.steps.length;
  const revealedCount = Math.min(Math.floor((elapsedMs / MAZE_ANIM_DURATION_MS) * totalSteps), totalSteps);
  const currentStep = revealedCount > 0 ? result.steps[Math.min(revealedCount, totalSteps) - 1] : null;
  const solving = elapsedMs < MAZE_ANIM_DURATION_MS;
  const pathLength = result.path ? result.path.length - 1 : null;

  const manhattanCount = comparisonCounts.manhattan;
  const euclideanCount = comparisonCounts.euclidean;
  const bothRun = manhattanCount !== undefined && euclideanCount !== undefined;

  return (
    <div className="ui-layer">
      <div className="panel top-bar maze-top-bar">
        <div>
          <div className="level-title">Bonus Trial — The Maze</div>
          <div className="briefing">
            A* pathfinding, weighed against itself: the same maze, two heuristics. Watch how much
            the choice of heuristic changes how much ground the search has to cover.
          </div>
        </div>
      </div>

      <div className="panel maze-controls">
        <span className="panel-label">Heuristic</span>
        <div className="heuristic-toggle">
          {(Object.keys(HEURISTIC_LABEL) as Heuristic[]).map((h) => (
            <button
              key={h}
              className={"heuristic-btn" + (heuristic === h ? " heuristic-btn-active" : "")}
              onClick={() => setHeuristic(h)}
            >
              {HEURISTIC_LABEL[h]}
            </button>
          ))}
        </div>
        <button className="replay-btn" onClick={replay}>
          ↺ Replay solve
        </button>
      </div>

      <div className="panel algo-trace maze-trace">
        <div className="panel-label">
          A* Trace <span className="live-dot" />
        </div>
        <div className="trace-line">
          <span className="trace-key">f(n) = g(n) + h(n)</span>
          <span className="trace-val">
            {currentStep
              ? `${currentStep.f.toFixed(2)} = ${currentStep.g.toFixed(2)} + ${currentStep.h.toFixed(2)}`
              : "—"}
          </span>
        </div>
        <div className="trace-line">
          <span className="trace-key">nodes expanded</span>
          <span className="trace-val">
            {Math.min(revealedCount, totalSteps)} / {totalSteps}
            {solving ? " (solving…)" : ""}
          </span>
        </div>
        <div className="trace-line">
          <span className="trace-key">path length</span>
          <span className="trace-val">{pathLength ?? "—"}</span>
        </div>
      </div>

      <div className="panel maze-comparison">
        <span className="panel-label">Heuristic Comparison</span>
        <div className="comparison-row">
          <span className="comparison-label">Manhattan</span>
          <div className="comparison-bar-track">
            <div
              className="comparison-bar comparison-bar-manhattan"
              style={{ width: bothRun ? `${(manhattanCount! / Math.max(manhattanCount!, euclideanCount!)) * 100}%` : manhattanCount !== undefined ? "100%" : "0%" }}
            />
          </div>
          <span className="comparison-count">{manhattanCount ?? "—"}</span>
        </div>
        <div className="comparison-row">
          <span className="comparison-label">Euclidean</span>
          <div className="comparison-bar-track">
            <div
              className="comparison-bar comparison-bar-euclidean"
              style={{ width: bothRun ? `${(euclideanCount! / Math.max(manhattanCount!, euclideanCount!)) * 100}%` : euclideanCount !== undefined ? "100%" : "0%" }}
            />
          </div>
          <span className="comparison-count">{euclideanCount ?? "—"}</span>
        </div>
        {bothRun && (
          <p className="comparison-note">
            Manhattan matches the maze's real movement cost exactly, so it never explores more than
            Euclidean does — {euclideanCount! - manhattanCount!} fewer node{euclideanCount! - manhattanCount! === 1 ? "" : "s"} expanded.
          </p>
        )}
      </div>

      <button className="continue-btn maze-finish-btn" onClick={returnToTitle}>
        Return to Title
      </button>
    </div>
  );
}

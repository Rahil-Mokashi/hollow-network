import { useEffect, useState } from "react";
import { useMazeStore, MAZE_ANIM_DURATION_MS } from "../game/mazeStore";
import { MAZE_TRIALS } from "../game/maze";
import { useGameStore } from "../game/store";
import type { Heuristic } from "../graph/astar";

const STRATEGIES: Heuristic[] = ["dijkstra", "manhattan", "euclidean"];

const STRATEGY_LABEL: Record<Heuristic, string> = {
  dijkstra: "Dijkstra",
  manhattan: "Manhattan",
  euclidean: "Euclidean",
};

const STRATEGY_BAR_CLASS: Record<Heuristic, string> = {
  dijkstra: "comparison-bar-dijkstra",
  manhattan: "comparison-bar-manhattan",
  euclidean: "comparison-bar-euclidean",
};

export function MazeUI() {
  const heuristic = useMazeStore((s) => s.heuristic);
  const result = useMazeStore((s) => s.result);
  const comparisonCounts = useMazeStore((s) => s.comparisonCounts);
  const solvedAt = useMazeStore((s) => s.solvedAt);
  const setHeuristic = useMazeStore((s) => s.setHeuristic);
  const replay = useMazeStore((s) => s.replay);
  const advanceTrial = useMazeStore((s) => s.advanceTrial);
  const trialIndex = useMazeStore((s) => s.trialIndex);
  const returnToTitle = useGameStore((s) => s.returnToTitle);
  const enterArchive = useGameStore((s) => s.enterArchive);
  const enterSort = useGameStore((s) => s.enterSort);

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

  const counts = STRATEGIES.map((s) => comparisonCounts[s]);
  const allRun = counts.every((c) => c !== undefined);
  const maxCount = allRun ? Math.max(...(counts as number[])) : undefined;
  const trial = MAZE_TRIALS[trialIndex];
  const hasNextTrial = trialIndex < MAZE_TRIALS.length - 1;

  const dijkstraCount = comparisonCounts.dijkstra;
  const manhattanCount = comparisonCounts.manhattan;

  return (
    <div className="ui-layer">
      <div className="panel top-bar maze-top-bar">
        <div>
          <div className="level-title">Bonus Trial — The Maze ({trial.label})</div>
          <div className="briefing">
            Three ways to search the same maze: no guess at all (Dijkstra), a tight guess
            (Manhattan), and a looser one (Euclidean). Watch how much the guess is worth.
          </div>
        </div>
      </div>

      <div className="panel maze-controls">
        <span className="panel-label">Strategy</span>
        <div className="heuristic-toggle heuristic-toggle-3">
          {STRATEGIES.map((h) => (
            <button
              key={h}
              className={"heuristic-btn" + (heuristic === h ? " heuristic-btn-active" : "")}
              onClick={() => setHeuristic(h)}
            >
              {STRATEGY_LABEL[h]}
            </button>
          ))}
        </div>
        <button className="replay-btn" onClick={replay}>
          ↺ Replay solve
        </button>
      </div>

      <div className="panel algo-trace maze-trace">
        <div className="panel-label">
          Search Trace <span className="live-dot" />
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
        <span className="panel-label">Strategy Comparison</span>
        {STRATEGIES.map((s) => {
          const count = comparisonCounts[s];
          return (
            <div className="comparison-row" key={s}>
              <span className="comparison-label">{STRATEGY_LABEL[s]}</span>
              <div className="comparison-bar-track">
                <div
                  className={"comparison-bar " + STRATEGY_BAR_CLASS[s]}
                  style={{
                    width: allRun ? `${(count! / maxCount!) * 100}%` : count !== undefined ? "100%" : "0%",
                  }}
                />
              </div>
              <span className="comparison-count">{count ?? "—"}</span>
            </div>
          );
        })}
        {allRun && dijkstraCount !== undefined && manhattanCount !== undefined && (
          <p className="comparison-note">
            Dijkstra has no idea where the goal is, so it expands outward evenly in every
            direction — Manhattan's guess cuts that down by {dijkstraCount - manhattanCount} node
            {dijkstraCount - manhattanCount === 1 ? "" : "s"}, and still finds the exact same
            shortest path.
          </p>
        )}
      </div>

      <div className="maze-bottom-actions">
        {allRun && hasNextTrial && (
          <button className="continue-btn maze-next-btn" onClick={advanceTrial}>
            {MAZE_TRIALS[trialIndex + 1].label}: a bigger maze →
          </button>
        )}
        <button className="continue-btn maze-archive-btn" onClick={enterArchive}>
          Try the Archive (BST) →
        </button>
        <button className="continue-btn maze-sort-btn" onClick={enterSort}>
          Try SortCraft →
        </button>
        <button className="continue-btn continue-btn-secondary maze-finish-btn" onClick={returnToTitle}>
          Return to Title
        </button>
      </div>
    </div>
  );
}

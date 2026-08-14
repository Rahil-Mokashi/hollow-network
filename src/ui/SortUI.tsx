import { useEffect, useState } from "react";
import { useSortStore, SORT_ANIM_DURATION_MS, SORT_ARRAY } from "../game/sortStore";
import { useGameStore } from "../game/store";
import type { SortAlgorithm } from "../graph/sort";

const ALGORITHMS: SortAlgorithm[] = ["bubble", "merge"];

const ALGO_LABEL: Record<SortAlgorithm, string> = {
  bubble: "Bubble Sort",
  merge: "Merge Sort",
};

export function SortUI() {
  const algorithm = useSortStore((s) => s.algorithm);
  const result = useSortStore((s) => s.result);
  const comparisonCounts = useSortStore((s) => s.comparisonCounts);
  const solvedAt = useSortStore((s) => s.solvedAt);
  const setAlgorithm = useSortStore((s) => s.setAlgorithm);
  const replay = useSortStore((s) => s.replay);
  const returnToTitle = useGameStore((s) => s.returnToTitle);
  const enterArchive = useGameStore((s) => s.enterArchive);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = now - solvedAt;
  const totalSteps = result.steps.length;
  const stepIdx = Math.min(Math.floor((elapsedMs / SORT_ANIM_DURATION_MS) * totalSteps), totalSteps - 1);
  const currentStep = totalSteps > 0 && stepIdx >= 0 ? result.steps[stepIdx] : null;
  const solving = elapsedMs < SORT_ANIM_DURATION_MS;

  const bubbleStats = comparisonCounts.bubble;
  const mergeStats = comparisonCounts.merge;
  const bothRun = bubbleStats !== undefined && mergeStats !== undefined;
  const maxComparisons = bothRun ? Math.max(bubbleStats!.comparisons, mergeStats!.comparisons) : undefined;

  return (
    <div className="ui-layer">
      <div className="panel top-bar sort-top-bar">
        <div>
          <div className="level-title">Bonus Trial — SortCraft</div>
          <div className="briefing">
            The same {SORT_ARRAY.length} crystals, sorted two ways. Bubble Sort only ever compares
            neighbors; Merge Sort splits the row in half, sorts each half, then merges. Watch how
            differently that scales.
          </div>
        </div>
      </div>

      <div className="panel maze-controls sort-controls">
        <span className="panel-label">Algorithm</span>
        <div className="heuristic-toggle">
          {ALGORITHMS.map((a) => (
            <button
              key={a}
              className={"heuristic-btn" + (algorithm === a ? " heuristic-btn-active" : "")}
              onClick={() => setAlgorithm(a)}
            >
              {ALGO_LABEL[a]}
            </button>
          ))}
        </div>
        <button className="replay-btn" onClick={replay}>
          ↺ Replay sort
        </button>
      </div>

      <div className="panel algo-trace sort-trace">
        <div className="panel-label">
          Sort Trace <span className="live-dot" />
        </div>
        <div className="trace-line">
          <span className="trace-key">operation</span>
          <span className="trace-val">
            {currentStep ? (currentStep.type === "compare" ? "comparing" : currentStep.type === "swap" ? "swapping" : "writing") : "—"}
            {currentStep ? ` [${currentStep.indices.join(", ")}]` : ""}
          </span>
        </div>
        <div className="trace-line">
          <span className="trace-key">comparisons</span>
          <span className="trace-val">{result.comparisons}</span>
        </div>
        <div className="trace-line">
          <span className="trace-key">{algorithm === "bubble" ? "swaps" : "writes"}</span>
          <span className="trace-val">
            {result.writes}
            {solving ? " (sorting…)" : ""}
          </span>
        </div>
      </div>

      <div className="panel maze-comparison sort-comparison">
        <span className="panel-label">Algorithm Comparison</span>
        {ALGORITHMS.map((a) => {
          const stats = comparisonCounts[a];
          return (
            <div className="comparison-row" key={a}>
              <span className="comparison-label">{ALGO_LABEL[a]}</span>
              <div className="comparison-bar-track">
                <div
                  className={"comparison-bar " + (a === "bubble" ? "comparison-bar-euclidean" : "comparison-bar-manhattan")}
                  style={{
                    width: bothRun
                      ? `${(stats!.comparisons / maxComparisons!) * 100}%`
                      : stats !== undefined
                        ? "100%"
                        : "0%",
                  }}
                />
              </div>
              <span className="comparison-count">{stats?.comparisons ?? "—"}</span>
            </div>
          );
        })}
        {bothRun && (
          <p className="comparison-note">
            Merge Sort makes {bubbleStats!.comparisons - mergeStats!.comparisons} fewer comparisons on
            this row — and the gap only widens as the row gets longer, because O(n log n) pulls away
            from O(n²).
          </p>
        )}
      </div>

      <div className="maze-bottom-actions">
        <button className="continue-btn maze-archive-btn" onClick={enterArchive}>
          Try the Archive (BST) →
        </button>
        <button className="continue-btn continue-btn-secondary maze-finish-btn" onClick={returnToTitle}>
          Return to Title
        </button>
      </div>
    </div>
  );
}

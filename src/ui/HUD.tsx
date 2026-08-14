import { useEffect, useState } from "react";
import { useGameStore, ACTS, nextActAfter, TOTAL_OPTIMAL_HOPS } from "../game/store";
import { saveBestRun, formatTime, type BestRun } from "../game/score";

const ABILITY_LABEL: Record<string, string> = {
  bfsTorch: "BFS Torch",
  unionFindKey: "Union-Find Key",
};

function FinaleSummary() {
  const runHops = useGameStore((s) => s.runHops);
  const runStartAt = useGameStore((s) => s.runStartAt);
  const runRewinds = useGameStore((s) => s.runRewinds);
  const runDejaVu = useGameStore((s) => s.runDejaVu);
  const returnToTitle = useGameStore((s) => s.returnToTitle);
  const enterMaze = useGameStore((s) => s.enterMaze);
  const enterArchive = useGameStore((s) => s.enterArchive);

  const [result, setResult] = useState<{ best: BestRun; isNewBest: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timeMs = runStartAt ? Date.now() - runStartAt : 0;
    setResult(
      saveBestRun({ hops: runHops, optimalHops: TOTAL_OPTIMAL_HOPS, timeMs, rewinds: runRewinds, dejaVu: runDejaVu })
    );
    // Intentionally runs once, at the moment the finale mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) return null;
  const { best, isNewBest } = result;

  function copyResults() {
    const text = `The Hollow Network — Rank ${best.grade} · ${best.hops}/${TOTAL_OPTIMAL_HOPS} hops · ${formatTime(best.timeMs)} · ${best.rewinds} rewinds · ${best.dejaVu} déjà vu`;
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => {}
    );
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="panel finale-banner">
      <div className="finale-title">The Hollow Network — Complete</div>
      <div className="finale-body">
        Two networks, once separate, now one. Every chamber you crossed was a real
        algorithm running underneath you.
      </div>

      <div className="finale-grade">
        <span className="grade-letter">{best.grade}</span>
        {isNewBest && <span className="new-best-badge">New Best</span>}
      </div>

      <div className="finale-stats">
        <div>
          <span className="stat-value">
            {runHops}/{TOTAL_OPTIMAL_HOPS}
          </span>
          <span className="stat-label">hops / optimal</span>
        </div>
        <div>
          <span className="stat-value">{formatTime(best.timeMs)}</span>
          <span className="stat-label">time</span>
        </div>
        <div>
          <span className="stat-value">{runRewinds}</span>
          <span className="stat-label">rewinds</span>
        </div>
        <div>
          <span className="stat-value">{runDejaVu}</span>
          <span className="stat-label">déjà vu</span>
        </div>
      </div>

      <ul className="finale-list">
        <li>Breadth-first search — the Torch</li>
        <li>Depth-first search — the Grapple</li>
        <li>Cycle detection — the Ward</li>
        <li>Union-find — the Key</li>
      </ul>

      <div className="finale-actions">
        <button className="continue-btn" onClick={copyResults}>
          {copied ? "Copied" : "Copy Results"}
        </button>
        <button className="continue-btn continue-btn-secondary" onClick={returnToTitle}>
          Play again
        </button>
      </div>

      <div className="bonus-trial-row">
        <button className="maze-trial-btn" onClick={enterMaze}>
          Bonus Trial: The Maze (A*) →
        </button>
        <button className="maze-trial-btn archive-trial-btn" onClick={enterArchive}>
          Bonus Trial: The Archive (BST) →
        </button>
      </div>
    </div>
  );
}

export function HUD() {
  const level = useGameStore((s) => s.level);
  const hopsTaken = useGameStore((s) => s.hopsTaken);
  const optimalHops = useGameStore((s) => s.optimalHops);
  const won = useGameStore((s) => s.won);
  const wonFinale = useGameStore((s) => s.wonFinale);
  const triggerAbility = useGameStore((s) => s.triggerAbility);
  const advanceToLevel = useGameStore((s) => s.advanceToLevel);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const travelAnim = useGameStore((s) => s.travelAnim);
  const rewindCharges = useGameStore((s) => s.rewindCharges);
  const loopRepeats = useGameStore((s) => s.loopRepeats);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const failed = useGameStore((s) => s.failed);
  const failReason = useGameStore((s) => s.failReason);

  const showAbilityButton = level.ability === "bfsTorch" || level.ability === "unionFindKey";
  const unionReady = level.ability === "unionFindKey" && level.bridge && currentNodeId === level.bridge.a;
  const next = nextActAfter(level.id);

  return (
    <>
      <div className="panel top-bar">
        <div>
          <div className="level-title">{level.title}</div>
          <div className="briefing">{level.briefing}</div>
        </div>
        <div className="top-bar-right">
          {optimalHops !== null && (
            <div className="hop-counter">
              <span className="hop-value">{hopsTaken}</span>
              <span className="hop-sep">/</span>
              <span className="hop-optimal">{optimalHops} hops (best)</span>
              {level.moveBudget && (
                <span className={"budget-remaining" + (level.moveBudget - hopsTaken <= 2 ? " budget-low" : "")}>
                  {" "}
                  · {Math.max(level.moveBudget - hopsTaken, 0)} left before failure
                </span>
              )}
            </div>
          )}
          <div className="act-pips">
            {ACTS.map((act) => (
              <span
                key={act.id}
                className={
                  "pip" +
                  (act.id === level.id ? " pip-current" : "") +
                  (ACTS.findIndex((a) => a.id === act.id) < ACTS.findIndex((a) => a.id === level.id) ? " pip-done" : "")
                }
                title={act.title}
              />
            ))}
          </div>
        </div>
      </div>

      {level.ability === "dfsGrapple" && (
        <div className="panel lantern-strip">
          <span className="panel-label">Rewind Charges</span>
          <div className="lanterns">
            {Array.from({ length: level.rewindCharges ?? 0 }).map((_, i) => (
              <span key={i} className={"lantern" + (i < rewindCharges ? " lantern-lit" : "")} />
            ))}
          </div>
        </div>
      )}

      {level.ability === "cycleWard" && (
        <div className="panel lantern-strip">
          <span className="panel-label">Loops Lost</span>
          <div className="lanterns">
            {Array.from({ length: level.loopFailThreshold ?? 3 }).map((_, i) => (
              <span key={i} className={"lantern lantern-warn" + (i < loopRepeats ? " lantern-lit" : "")} />
            ))}
          </div>
        </div>
      )}

      {showAbilityButton && !won && !failed && (
        <button
          className="ability-btn"
          onClick={triggerAbility}
          disabled={!!travelAnim || (level.ability === "unionFindKey" && !unionReady)}
        >
          <span className="ability-key">E</span> {ABILITY_LABEL[level.ability]}
          {level.ability === "unionFindKey" && !unionReady ? " (reach the Pylon)" : ""}
        </button>
      )}

      {failed && (
        <div className="panel fail-banner">
          <div className="fail-title">{failReason === "budget" ? "Out of moves" : "Stranded"}</div>
          <div className="fail-body">
            {failReason === "budget"
              ? `You ran out of moves before reaching the goal. The optimal route was only ${optimalHops} hops.`
              : "No legal move remains — every rewind charge is spent and the only way forward is blocked. This chamber can't be escaped from here."}
          </div>
          <button className="continue-btn fail-retry-btn" onClick={restartLevel}>
            Retry
          </button>
        </div>
      )}

      {won && !wonFinale && (
        <div className="panel win-banner">
          <div className="win-title">{level.goalId ? "Chamber reached" : "Cleared"}</div>
          <div className="win-body">
            {optimalHops !== null
              ? `You reached the goal in ${hopsTaken} hop${hopsTaken === 1 ? "" : "s"}. Optimal was ${optimalHops}.`
              : "Onward."}
          </div>
          <button className="continue-btn" onClick={() => (next ? advanceToLevel(next) : restartLevel())}>
            {next ? `Continue to ${next.title}` : "Replay"}
          </button>
        </div>
      )}

      {wonFinale && <FinaleSummary />}
    </>
  );
}

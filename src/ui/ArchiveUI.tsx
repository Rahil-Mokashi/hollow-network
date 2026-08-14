import { useEffect, useState } from "react";
import { useArchiveStore, INSERT_QUEUE, SEARCH_TARGETS } from "../game/archiveStore";
import { useGameStore } from "../game/store";

export function ArchiveUI() {
  const phase = useArchiveStore((s) => s.phase);
  const tree = useArchiveStore((s) => s.tree);
  const cursorId = useArchiveStore((s) => s.cursorId);
  const insertQueue = useArchiveStore((s) => s.insertQueue);
  const searchIndex = useArchiveStore((s) => s.searchIndex);
  const mistakes = useArchiveStore((s) => s.mistakes);
  const lastAttempt = useArchiveStore((s) => s.lastAttempt);
  const notFoundAt = useArchiveStore((s) => s.notFoundAt);
  const chooseDirection = useArchiveStore((s) => s.chooseDirection);
  const reset = useArchiveStore((s) => s.reset);
  const returnToTitle = useGameStore((s) => s.returnToTitle);
  const enterMaze = useGameStore((s) => s.enterMaze);

  const [feedbackFlash, setFeedbackFlash] = useState(false);
  const [notFoundFlash, setNotFoundFlash] = useState(false);

  useEffect(() => {
    if (!lastAttempt) return;
    setFeedbackFlash(true);
    const t = setTimeout(() => setFeedbackFlash(false), 500);
    return () => clearTimeout(t);
  }, [lastAttempt]);

  useEffect(() => {
    if (notFoundAt === null) return;
    setNotFoundFlash(true);
    const t = setTimeout(() => setNotFoundFlash(false), 1400);
    return () => clearTimeout(t);
  }, [notFoundAt]);

  const cursorValue = tree.nodes.get(cursorId)?.value ?? null;
  const target = phase === "insert" ? insertQueue[0] : phase === "search" ? SEARCH_TARGETS[searchIndex] : null;
  const inorder = tree.inorder();

  const title =
    phase === "insert"
      ? "The Archive — Building"
      : phase === "search"
        ? "The Archive — Searching"
        : "The Archive — Complete";

  const briefing =
    phase === "insert"
      ? "Insert each value by comparing it against the chamber you're standing at: smaller goes left, larger goes right. Keep walking down until you find an empty slot."
      : phase === "search"
        ? "Same rule, now used to find a value instead of place one — walk left or right by comparison until you land on it, or run out of tree."
        : "Every value went in, and every search walked the same rule. In-order left-to-right always reads out sorted — that's not a coincidence, it's the whole structure.";

  return (
    <div className="ui-layer">
      <div className="panel top-bar archive-top-bar">
        <div>
          <div className="level-title">{title}</div>
          <div className="briefing">{briefing}</div>
        </div>
      </div>

      {(phase === "insert" || phase === "search") && cursorValue !== null && target !== null && (
        <div className="panel archive-prompt">
          <div className="archive-compare">
            <span className="archive-target">{target}</span>
            <span className="archive-vs">vs</span>
            <span className="archive-cursor">{cursorValue}</span>
          </div>
          <div className="archive-question">
            {target < cursorValue ? "Which way is smaller?" : "Which way is larger or equal?"}
          </div>
          <div className={"archive-feedback" + (feedbackFlash ? (lastAttempt?.correct ? " archive-feedback-correct" : " archive-feedback-wrong") : "")}>
            {feedbackFlash ? (lastAttempt?.correct ? "Correct" : "Not quite") : " "}
          </div>
          <div className="archive-buttons">
            <button className="archive-dir-btn" onClick={() => chooseDirection("left")}>
              ← Left
            </button>
            <button className="archive-dir-btn" onClick={() => chooseDirection("right")}>
              Right →
            </button>
          </div>
          {notFoundFlash && <div className="archive-not-found">{target} isn't in the tree — search correctly ends here.</div>}
        </div>
      )}

      <div className="panel archive-progress">
        <span className="panel-label">{phase === "insert" ? "Still to insert" : "Search targets"}</span>
        {phase === "insert" && (
          <div className="archive-queue">
            {INSERT_QUEUE.map((v, i) => (
              <span key={v} className={"archive-chip" + (i < INSERT_QUEUE.length - insertQueue.length ? " archive-chip-done" : i === 0 ? " archive-chip-active" : "")}>
                {v}
              </span>
            ))}
          </div>
        )}
        {phase !== "insert" && (
          <div className="archive-queue">
            {SEARCH_TARGETS.map((v, i) => (
              <span key={v} className={"archive-chip" + (i < searchIndex ? " archive-chip-done" : i === searchIndex && phase === "search" ? " archive-chip-active" : "")}>
                {v}
              </span>
            ))}
          </div>
        )}
        <div className="archive-mistakes">Mistakes: {mistakes}</div>
      </div>

      {phase === "done" && (
        <div className="panel archive-done-banner">
          <div className="finale-title">Archive Complete</div>
          <div className="finale-body">
            {mistakes === 0
              ? "Every comparison correct, first try — a clean traversal."
              : `${mistakes} wrong turn${mistakes === 1 ? "" : "s"} along the way — the tree doesn't care, it always ends up sorted.`}
          </div>
          <div className="archive-inorder">
            <span className="panel-label">In-order traversal</span>
            <div className="archive-inorder-values">{inorder.join(" → ")}</div>
          </div>
          <div className="finale-actions">
            <button className="continue-btn" onClick={reset}>
              Rebuild
            </button>
            <button className="continue-btn continue-btn-secondary" onClick={enterMaze}>
              Try the Maze (A*)
            </button>
          </div>
        </div>
      )}

      <button className="continue-btn continue-btn-secondary archive-finish-btn" onClick={returnToTitle}>
        Return to Title
      </button>
    </div>
  );
}

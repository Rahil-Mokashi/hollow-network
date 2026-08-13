import { useGameStore } from "../game/store";

export function HUD() {
  const level = useGameStore((s) => s.level);
  const hopsTaken = useGameStore((s) => s.hopsTaken);
  const optimalHops = useGameStore((s) => s.optimalHops);
  const won = useGameStore((s) => s.won);
  const triggerTorch = useGameStore((s) => s.triggerTorch);
  const advanceToAct2 = useGameStore((s) => s.advanceToAct2);
  const restartAct2 = useGameStore((s) => s.restartAct2);
  const travelAnim = useGameStore((s) => s.travelAnim);

  const isAct1 = level.id === "act1";

  return (
    <>
      <div className="panel top-bar">
        <div>
          <div className="level-title">{level.title}</div>
          <div className="briefing">{level.briefing}</div>
        </div>
        {optimalHops !== null && (
          <div className="hop-counter">
            <span className="hop-value">{hopsTaken}</span>
            <span className="hop-sep">/</span>
            <span className="hop-optimal">{optimalHops} hops (best)</span>
          </div>
        )}
      </div>

      {level.requiresTorch && !won && (
        <button className="ability-btn" onClick={triggerTorch} disabled={!!travelAnim}>
          <span className="ability-key">E</span> BFS Torch
        </button>
      )}

      {won && (
        <div className="panel win-banner">
          <div className="win-title">{isAct1 ? "Threshold reached" : "Beacon Vault cleared"}</div>
          <div className="win-body">
            {isAct1
              ? "You crossed the network on foot alone. Ahead, the fog thickens — you'll need the BFS Torch to see through it."
              : `You reached the Beacon in ${hopsTaken} hop${hopsTaken === 1 ? "" : "s"}. Optimal was ${optimalHops}.`}
          </div>
          <button className="continue-btn" onClick={isAct1 ? advanceToAct2 : restartAct2}>
            {isAct1 ? "Enter the Flood Vault" : "Replay the Vault"}
          </button>
        </div>
      )}
    </>
  );
}

import { Sparkles } from "@react-three/drei";
import { useGameStore } from "../game/store";
import type { LevelDef } from "../game/levels";

interface FogOfWarProps {
  level: LevelDef;
  excludeIds?: Set<string>;
}

/** Drifting dust motes over every chamber the player hasn't revealed yet. */
export function FogOfWar({ level, excludeIds }: FogOfWarProps) {
  const revealedNodeIds = useGameStore((s) => s.revealedNodeIds);

  const hiddenNodes = level.graph
    .nodeIds()
    .filter((id) => !revealedNodeIds.has(id) && !excludeIds?.has(id));
  if (hiddenNodes.length === 0) return null;

  return (
    <>
      {hiddenNodes.map((id) => {
        const node = level.graph.nodes.get(id)!;
        return (
          <Sparkles
            key={id}
            position={node.position}
            count={40}
            scale={3.2}
            size={2.5}
            speed={0.25}
            opacity={0.35}
            color="#5a6b78"
          />
        );
      })}
    </>
  );
}

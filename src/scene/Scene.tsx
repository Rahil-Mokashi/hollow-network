import { useEffect, useState } from "react";
import { Stars } from "@react-three/drei";
import { Chamber } from "./Chamber";
import { Corridor } from "./Corridor";
import { FogOfWar } from "./FogOfWar";
import { CameraRig } from "./CameraRig";
import { IslandGroup, ISLAND_DRIFT_DURATION_MS } from "./IslandGroup";
import { useGameStore } from "../game/store";
import type { Graph } from "../graph/types";

function GraphChunk({ graph, nodeIds }: { graph: Graph; nodeIds: string[] }) {
  const idSet = new Set(nodeIds);
  const edges = graph.edges.filter((e) => idSet.has(e.a) && idSet.has(e.b));

  return (
    <>
      {nodeIds.map((id, i) => {
        const node = graph.nodes.get(id)!;
        return <Chamber key={id} id={id} position={node.position} seed={i + 1} />;
      })}
      {edges.map((edge) => {
        const from = graph.nodes.get(edge.a)!;
        const to = graph.nodes.get(edge.b)!;
        return (
          <Corridor
            key={`${edge.a}-${edge.b}`}
            fromId={edge.a}
            toId={edge.b}
            fromPos={from.position}
            toPos={to.position}
          />
        );
      })}
    </>
  );
}

/** The bridge corridor only appears once the drifting island has settled at
 * its true position — otherwise the tube would visually connect to a
 * chamber that hasn't arrived there yet. */
function SettledBridge({ graph, a, b }: { graph: Graph; a: string; b: string }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), ISLAND_DRIFT_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!settled) return null;
  const from = graph.nodes.get(a)!;
  const to = graph.nodes.get(b)!;
  return <Corridor fromId={a} toId={b} fromPos={from.position} toPos={to.position} />;
}

export function Scene() {
  const level = useGameStore((s) => s.level);
  const bridgeActive = useGameStore((s) => s.bridgeActive);
  const revealedNodeIds = useGameStore((s) => s.revealedNodeIds);
  const { graph } = level;

  const clusterBIds = level.clusterBIds ?? [];
  const clusterBSet = new Set(clusterBIds);
  const clusterAIds = graph.nodeIds().filter((id) => !clusterBSet.has(id));
  const offset = level.clusterBOffset ?? [0, 0, 0];

  return (
    <>
      <color attach="background" args={["#07080a"]} />
      <fog attach="fog" args={["#07080a", 15, 36]} />
      <ambientLight intensity={0.12} color="#3a5560" />
      <Stars radius={70} depth={40} count={2200} factor={2.4} saturation={0} fade speed={0.35} />

      <CameraRig />

      <GraphChunk graph={graph} nodeIds={clusterAIds} />

      {clusterBIds.length > 0 && (
        <IslandGroup offset={offset} active={bridgeActive}>
          {clusterBIds.map((id, i) => {
            const node = graph.nodes.get(id)!;
            const isDistant = !bridgeActive && !revealedNodeIds.has(id);
            return <Chamber key={id} id={id} position={node.position} seed={i + 100} distant={isDistant} />;
          })}
          {graph.edges
            .filter((e) => clusterBSet.has(e.a) && clusterBSet.has(e.b))
            .map((edge) => {
              const from = graph.nodes.get(edge.a)!;
              const to = graph.nodes.get(edge.b)!;
              return (
                <Corridor
                  key={`${edge.a}-${edge.b}`}
                  fromId={edge.a}
                  toId={edge.b}
                  fromPos={from.position}
                  toPos={to.position}
                />
              );
            })}
        </IslandGroup>
      )}

      {level.bridge && bridgeActive && (
        <SettledBridge graph={graph} a={level.bridge.a} b={level.bridge.b} />
      )}

      <FogOfWar level={level} excludeIds={clusterBSet} />
    </>
  );
}

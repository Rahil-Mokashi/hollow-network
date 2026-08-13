import { Chamber } from "./Chamber";
import { Corridor } from "./Corridor";
import { FogOfWar } from "./FogOfWar";
import { CameraRig } from "./CameraRig";
import { useGameStore } from "../game/store";

export function Scene() {
  const level = useGameStore((s) => s.level);
  const { graph } = level;

  return (
    <>
      <color attach="background" args={["#0a0b0d"]} />
      <fog attach="fog" args={["#0a0b0d", 14, 34]} />
      <ambientLight intensity={0.12} color="#3a5560" />

      <CameraRig />

      {graph.nodeIds().map((id, i) => {
        const node = graph.nodes.get(id)!;
        return <Chamber key={id} id={id} position={node.position} seed={i + 1} />;
      })}

      {graph.edges.map((edge) => {
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

      <FogOfWar level={level} />
    </>
  );
}

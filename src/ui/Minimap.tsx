import { useGameStore } from "../game/store";

export function Minimap() {
  const level = useGameStore((s) => s.level);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const revealedNodeIds = useGameStore((s) => s.revealedNodeIds);
  const canTravelTo = useGameStore((s) => s.canTravelTo);
  const { graph } = level;

  const xs = graph.nodeIds().map((id) => graph.nodes.get(id)!.position[0]);
  const zs = graph.nodeIds().map((id) => graph.nodes.get(id)!.position[2]);
  const minX = Math.min(...xs) - 3;
  const maxX = Math.max(...xs) + 3;
  const minZ = Math.min(...zs) - 3;
  const maxZ = Math.max(...zs) + 3;
  const width = maxX - minX;
  const height = maxZ - minZ;

  const project = (x: number, z: number) => ({
    x: ((x - minX) / width) * 220,
    y: ((z - minZ) / height) * 160,
  });

  return (
    <div className="panel minimap">
      <div className="panel-label">Network Map</div>
      <svg width="220" height="160" viewBox="0 0 220 160">
        {graph.edges.map((edge) => {
          const a = graph.nodes.get(edge.a)!;
          const b = graph.nodes.get(edge.b)!;
          const revealed = revealedNodeIds.has(edge.a) && revealedNodeIds.has(edge.b);
          const pa = project(a.position[0], a.position[2]);
          const pb = project(b.position[0], b.position[2]);
          return (
            <line
              key={`${edge.a}-${edge.b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={revealed ? "#5fd6c4" : "#2a3a3c"}
              strokeWidth={revealed ? 1.6 : 1}
            />
          );
        })}
        {graph.nodeIds().map((id) => {
          const node = graph.nodes.get(id)!;
          const p = project(node.position[0], node.position[2]);
          const isCurrent = id === currentNodeId;
          const isRevealed = revealedNodeIds.has(id);
          const isAvailable = !isCurrent && !isRevealed && canTravelTo(id);
          const fill = isCurrent ? "#ffb066" : isRevealed ? "#c8894a" : "#2e6f9e";

          if (isCurrent) {
            // Shape cue, not just color: the current chamber is a diamond,
            // not a dot, so "where am I" doesn't depend on color vision.
            const s = 6.5;
            return (
              <polygon
                key={id}
                points={`${p.x},${p.y - s} ${p.x + s},${p.y} ${p.x},${p.y + s} ${p.x - s},${p.y}`}
                fill={fill}
                stroke="#fff3e6"
                strokeWidth={1.5}
              />
            );
          }

          return (
            <g key={id}>
              {isAvailable && (
                <circle cx={p.x} cy={p.y} r={7} fill="none" stroke="#f0ede4" strokeWidth={1} strokeDasharray="2,2" opacity={0.7} />
              )}
              <circle cx={p.x} cy={p.y} r={4} fill={fill} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

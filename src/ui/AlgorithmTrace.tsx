import { useMemo } from "react";
import { useGameStore } from "../game/store";
import { bfsOneRing } from "../graph/bfs";
import { detectCycle } from "../graph/cycleDetect";
import { UnionFind } from "../graph/unionFind";

function setLiteral(ids: Iterable<string>): string {
  return `{ ${[...ids].join(", ")} }`;
}

function pathLiteral(ids: string[]): string {
  return `[ ${ids.join(" → ")} ]`;
}

function listLiteral(ids: string[]): string {
  return `[ ${ids.join(", ")} ]`;
}

/** A live readout of the actual data structure state behind the current
 * ability — proof the algorithms are really running, not just implied. */
export function AlgorithmTrace() {
  const level = useGameStore((s) => s.level);
  const graph = useGameStore((s) => s.graph);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const dfsPath = useGameStore((s) => s.dfsPath);
  const rewindCharges = useGameStore((s) => s.rewindCharges);
  const visitedThisLoop = useGameStore((s) => s.visitedThisLoop);
  const loopRepeats = useGameStore((s) => s.loopRepeats);
  const bridgeActive = useGameStore((s) => s.bridgeActive);

  const oneRing = useMemo(() => bfsOneRing(graph, currentNodeId), [graph, currentNodeId]);

  const cycleResult = useMemo(() => {
    if (level.ability !== "cycleWard") return null;
    return detectCycle(graph, level.startId);
  }, [level, graph]);

  const components = useMemo(() => {
    if (level.ability !== "unionFindKey") return null;
    const uf = new UnionFind(graph.nodeIds());
    for (const edge of graph.edges) uf.union(edge.a, edge.b);
    return uf.components();
    // graph.addEdge() mutates the Graph in place (same reference) when the
    // bridge unions — bridgeActive is the signal that forces this to refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, graph, bridgeActive]);

  return (
    <div className="panel algo-trace">
      <div className="panel-label">
        Algorithm Trace <span className="live-dot" />
      </div>
      <div className="trace-line">
        <span className="trace-key">bfsOneRing(graph, "{currentNodeId}")</span>
        <span className="trace-val">{listLiteral(oneRing)}</span>
      </div>

      {level.ability === "dfsGrapple" && (
        <>
          <div className="trace-line">
            <span className="trace-key">callStack</span>
            <span className="trace-val">{pathLiteral(dfsPath)}</span>
          </div>
          <div className="trace-line">
            <span className="trace-key">rewindCharges</span>
            <span className="trace-val">{rewindCharges}</span>
          </div>
        </>
      )}

      {level.ability === "cycleWard" && cycleResult && (
        <>
          <div className="trace-line">
            <span className="trace-key">detectCycle(graph)</span>
            <span className="trace-val">
              {cycleResult.hasCycle ? `back-edge → "${cycleResult.closingNode}"` : "no cycle"}
            </span>
          </div>
          <div className="trace-line">
            <span className="trace-key">visitedThisLoop</span>
            <span className="trace-val">{setLiteral(visitedThisLoop)}</span>
          </div>
          <div className="trace-line">
            <span className="trace-key">loopRepeats</span>
            <span className="trace-val">
              {loopRepeats} / {level.loopFailThreshold ?? 3}
            </span>
          </div>
        </>
      )}

      {level.ability === "unionFindKey" && components && (
        <>
          <div className="trace-line">
            <span className="trace-key">unionFind.components()</span>
          </div>
          <div className="trace-val components-list">
            {components.map((group, i) => (
              <div key={i}>{setLiteral(group)}</div>
            ))}
          </div>
          <div className="trace-line">
            <span className="trace-key">bridgeActive</span>
            <span className="trace-val">{String(bridgeActive)}</span>
          </div>
        </>
      )}
    </div>
  );
}

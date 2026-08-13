import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { organicChamberGeometry, corridorCurve } from "./geometry";
import { ACTS } from "../game/levels";
import type { Graph } from "../graph/types";

const RING_RADIUS = 34;
const AMBER = new THREE.Color("#ffb066");
const TEAL = new THREE.Color("#5fd6c4");

function ringOffset(i: number, total: number): [number, number, number] {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(angle) * RING_RADIUS, 0, Math.sin(angle) * RING_RADIUS];
}

function StaticChamber({ position, seed }: { position: [number, number, number]; seed: number }) {
  const geometry = useMemo(() => organicChamberGeometry(1.5, seed), [seed]);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const pulse = 0.55 + Math.sin(clock.elapsedTime * 1.2 + seed) * 0.2;
    if (materialRef.current) materialRef.current.emissiveIntensity = pulse;
    if (lightRef.current) lightRef.current.intensity = 1.2 * pulse;
  });

  return (
    <group position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial ref={materialRef} color="#0c0c0e" roughness={0.85} metalness={0.1} emissive={AMBER} />
      </mesh>
      <pointLight ref={lightRef} color={AMBER} distance={8} decay={2} />
    </group>
  );
}

function StaticCorridor({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const geometry = useMemo(() => {
    const curve = corridorCurve(new THREE.Vector3(...from), new THREE.Vector3(...to));
    return new THREE.TubeGeometry(curve, 20, 0.16, 8, false);
  }, [from, to]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#141618" roughness={0.9} emissive={TEAL} emissiveIntensity={0.5} />
    </mesh>
  );
}

function ClusterDisplay({ graph, offset, seedBase }: { graph: Graph; offset: [number, number, number]; seedBase: number }) {
  return (
    <group position={offset}>
      {graph.nodeIds().map((id, i) => {
        const node = graph.nodes.get(id)!;
        return <StaticChamber key={id} position={node.position} seed={seedBase + i + 1} />;
      })}
      {graph.edges.map((edge) => {
        const from = graph.nodes.get(edge.a)!;
        const to = graph.nodes.get(edge.b)!;
        return <StaticCorridor key={`${edge.a}-${edge.b}`} from={from.position} to={to.position} />;
      })}
    </group>
  );
}

/** A decorative, non-interactive wide shot of all five acts' networks at
 * once, slowly orbited — the "concept in one glance" behind the title card. */
export function TitleBackdrop() {
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime * 0.045;
    camera.position.set(Math.sin(t) * 52, 26 + Math.sin(t * 0.5) * 5, Math.cos(t) * 52);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <color attach="background" args={["#07080a"]} />
      <fog attach="fog" args={["#07080a", 46, 100]} />
      <ambientLight intensity={0.15} color="#3a5560" />
      <Stars radius={100} depth={60} count={3200} factor={2.6} saturation={0} fade speed={0.3} />
      {ACTS.map((act, i) => (
        <ClusterDisplay key={act.id} graph={act.graph} offset={ringOffset(i, ACTS.length)} seedBase={i * 50} />
      ))}
    </>
  );
}

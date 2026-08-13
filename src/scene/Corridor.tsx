import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { corridorCurve } from "./geometry";
import { useGameStore } from "../game/store";
import { TRAVEL_DURATION } from "./timing";

const DIM = new THREE.Color("#2a3a3c");
const TEAL = new THREE.Color("#5fd6c4");

interface CorridorProps {
  fromId: string;
  toId: string;
  fromPos: [number, number, number];
  toPos: [number, number, number];
}

export function Corridor({ fromId, toId, fromPos, toPos }: CorridorProps) {
  const curve = useMemo(
    () => corridorCurve(new THREE.Vector3(...fromPos), new THREE.Vector3(...toPos)),
    [fromPos, toPos]
  );
  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 24, 0.22, 8, false), [curve]);

  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);

  const revealedNodeIds = useGameStore((s) => s.revealedNodeIds);
  const travelAnim = useGameStore((s) => s.travelAnim);
  const finishTravel = useGameStore((s) => s.finishTravel);

  const destinationRevealed = revealedNodeIds.has(fromId) && revealedNodeIds.has(toId);
  const isTraveling =
    travelAnim !== null &&
    ((travelAnim.from === fromId && travelAnim.to === toId) ||
      (travelAnim.from === toId && travelAnim.to === fromId));

  useFrame((_, delta) => {
    if (materialRef.current) {
      const target = destinationRevealed ? TEAL : DIM;
      materialRef.current.emissive.lerp(target, 0.1);
      materialRef.current.emissiveIntensity = destinationRevealed ? 0.6 : 0.12;
    }

    if (isTraveling && pulseRef.current) {
      elapsed.current += delta;
      const forward = travelAnim!.from === fromId;
      let t = elapsed.current / TRAVEL_DURATION;
      if (!forward) t = 1 - t;
      const clamped = Math.min(Math.max(t, 0), 1);
      const point = curve.getPointAt(clamped);
      pulseRef.current.position.copy(point);
      pulseRef.current.visible = true;

      if (elapsed.current >= TRAVEL_DURATION) {
        elapsed.current = 0;
        finishTravel();
      }
    } else if (pulseRef.current) {
      pulseRef.current.visible = false;
      elapsed.current = 0;
    }
  });

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial ref={materialRef} color="#141618" roughness={0.9} emissive={DIM} />
      </mesh>
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshBasicMaterial color={TEAL} />
      </mesh>
    </group>
  );
}

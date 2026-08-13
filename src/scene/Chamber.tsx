import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { organicChamberGeometry } from "./geometry";
import { useGameStore } from "../game/store";

const COLD_BLUE = new THREE.Color("#2e6f9e");
const AMBER = new THREE.Color("#c8894a");
const AMBER_BRIGHT = new THREE.Color("#ffb066");
const BASALT = new THREE.Color("#0c0c0e");

interface ChamberProps {
  id: string;
  position: [number, number, number];
  seed: number;
}

export function Chamber({ id, position, seed }: ChamberProps) {
  const geometry = useMemo(() => organicChamberGeometry(1.6, seed), [seed]);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const revealedNodeIds = useGameStore((s) => s.revealedNodeIds);
  const canTravelTo = useGameStore((s) => s.canTravelTo(id));
  const beginTravel = useGameStore((s) => s.beginTravel);

  const isCurrent = currentNodeId === id;
  const isRevealed = revealedNodeIds.has(id);

  useFrame(({ clock }) => {
    if (!materialRef.current || !lightRef.current) return;
    if (isCurrent) {
      const pulse = 0.75 + Math.sin(clock.elapsedTime * 2.4) * 0.25;
      materialRef.current.emissive.copy(AMBER_BRIGHT);
      materialRef.current.emissiveIntensity = pulse;
      lightRef.current.intensity = 2.2 * pulse;
      lightRef.current.color.copy(AMBER_BRIGHT);
    } else if (isRevealed) {
      materialRef.current.emissive.copy(AMBER);
      materialRef.current.emissiveIntensity = 0.55;
      lightRef.current.intensity = 0.9;
      lightRef.current.color.copy(AMBER);
    } else {
      materialRef.current.emissive.copy(COLD_BLUE);
      materialRef.current.emissiveIntensity = 0.18;
      lightRef.current.intensity = 0.25;
      lightRef.current.color.copy(COLD_BLUE);
    }
  });

  return (
    <group position={position}>
      <mesh
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          if (canTravelTo) beginTravel(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (canTravelTo) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={BASALT}
          roughness={0.85}
          metalness={0.1}
          emissive={COLD_BLUE}
        />
      </mesh>
      <pointLight ref={lightRef} distance={9} decay={2} />
    </group>
  );
}

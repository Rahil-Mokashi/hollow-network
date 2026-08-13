import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { organicChamberGeometry } from "./geometry";
import { useGameStore } from "../game/store";

const COLD_BLUE = new THREE.Color("#2e6f9e");
const AMBER = new THREE.Color("#c8894a");
const AMBER_BRIGHT = new THREE.Color("#ffb066");
const TEAL_AVAILABLE = new THREE.Color("#5fd6c4");
const PALE_DISTANT = new THREE.Color("#7fb8c9");
const VIOLET = new THREE.Color("#b48cff");
const BASALT = new THREE.Color("#0c0c0e");
const RING_NEUTRAL = new THREE.Color("#f0ede4");

interface ChamberProps {
  id: string;
  position: [number, number, number];
  seed: number;
  distant?: boolean;
}

export function Chamber({ id, position, seed, distant = false }: ChamberProps) {
  const geometry = useMemo(() => organicChamberGeometry(1.6, seed), [seed]);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const revealedNodeIds = useGameStore((s) => s.revealedNodeIds);
  const canTravelTo = useGameStore((s) => s.canTravelTo(id));
  const beginTravel = useGameStore((s) => s.beginTravel);
  const dejaVuAt = useGameStore((s) => s.dejaVuAt);

  const isCurrent = currentNodeId === id;
  const isRevealed = revealedNodeIds.has(id);
  const isAvailable = !isCurrent && !isRevealed && canTravelTo;

  useFrame(({ clock }) => {
    if (!materialRef.current || !lightRef.current) return;

    const recentDejaVu = dejaVuAt !== null && Date.now() - dejaVuAt < 1000;

    if (distant) {
      const bob = Math.sin(clock.elapsedTime * 0.6 + seed) * 0.35;
      if (groupRef.current) groupRef.current.position.y = bob;
      materialRef.current.emissive.copy(PALE_DISTANT);
      materialRef.current.emissiveIntensity = 0.35;
      lightRef.current.intensity = 0.5;
      lightRef.current.color.copy(PALE_DISTANT);
    } else if (recentDejaVu) {
      materialRef.current.emissive.copy(VIOLET);
      materialRef.current.emissiveIntensity = 0.8;
      lightRef.current.intensity = 1.6;
      lightRef.current.color.copy(VIOLET);
    } else if (isCurrent) {
      const pulse = 0.75 + Math.sin(clock.elapsedTime * 2.4) * 0.25;
      materialRef.current.emissive.copy(AMBER_BRIGHT);
      materialRef.current.emissiveIntensity = pulse;
      lightRef.current.intensity = 2.2 * pulse;
      lightRef.current.color.copy(AMBER_BRIGHT);
    } else if (isAvailable) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 3.2) * 0.18;
      materialRef.current.emissive.copy(TEAL_AVAILABLE);
      materialRef.current.emissiveIntensity = pulse;
      lightRef.current.intensity = 1.1;
      lightRef.current.color.copy(TEAL_AVAILABLE);
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

    // A shape cue independent of hue: whether you can act on this chamber
    // right now reads from ring presence and motion, not just color, so the
    // "can I click this" decision doesn't rely on color vision at all.
    if (ringRef.current && ringMaterialRef.current) {
      if (!distant && isCurrent) {
        ringRef.current.visible = true;
        ringRef.current.rotation.z = clock.elapsedTime * 0.6;
        ringRef.current.scale.setScalar(1);
        ringMaterialRef.current.opacity = 0.85;
      } else if (!distant && isAvailable) {
        const breathe = 0.9 + Math.sin(clock.elapsedTime * 3.5) * 0.12;
        ringRef.current.visible = true;
        ringRef.current.rotation.z = 0;
        ringRef.current.scale.setScalar(breathe);
        ringMaterialRef.current.opacity = 0.5;
      } else {
        ringRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
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
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[2.05, 0.05, 8, 40]} />
        <meshBasicMaterial ref={ringMaterialRef} color={RING_NEUTRAL} transparent opacity={0} />
      </mesh>
    </group>
  );
}

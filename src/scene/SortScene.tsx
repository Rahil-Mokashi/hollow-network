import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useSortStore, SORT_ARRAY, SORT_ANIM_DURATION_MS } from "../game/sortStore";

const PILLAR_WIDTH = 1.3;
const PILLAR_GAP = 0.6;
const HEIGHT_SCALE = 0.11;
const TOTAL_WIDTH = SORT_ARRAY.length * (PILLAR_WIDTH + PILLAR_GAP);

const LOW_COLOR = new THREE.Color("#6a4fb8");
const HIGH_COLOR = new THREE.Color("#ffb066");
const FLASH_COMPARE = new THREE.Color("#5fd6c4");
const FLASH_WRITE = new THREE.Color("#fff2c9");

function valueColor(value: number): THREE.Color {
  const t = (value - 0) / 100;
  return LOW_COLOR.clone().lerp(HIGH_COLOR, Math.max(0, Math.min(t, 1)));
}

function xForIndex(i: number): number {
  return i * (PILLAR_WIDTH + PILLAR_GAP) - TOTAL_WIDTH / 2 + PILLAR_WIDTH / 2;
}

function Pillar({ index }: { index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const result = useSortStore((s) => s.result);
  const solvedAt = useSortStore((s) => s.solvedAt);

  const totalSteps = result.steps.length;

  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return;
    const elapsedMs = Date.now() - solvedAt;
    const allDone = elapsedMs >= SORT_ANIM_DURATION_MS;
    const stepIdx = Math.min(
      Math.floor((elapsedMs / SORT_ANIM_DURATION_MS) * totalSteps),
      totalSteps - 1
    );
    const currentArray = totalSteps > 0 ? (allDone ? result.sorted : result.steps[Math.max(stepIdx, 0)].array) : result.sorted;
    const value = currentArray[index] ?? 0;
    const targetHeight = Math.max(value * HEIGHT_SCALE, 0.3);

    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, 0.35);
    meshRef.current.position.y = meshRef.current.scale.y / 2;

    const step = !allDone && totalSteps > 0 ? result.steps[Math.max(stepIdx, 0)] : null;
    const isActive = step ? step.indices.includes(index) : false;
    const baseColor = valueColor(value);

    if (allDone) {
      const sweep = 0.6 + Math.sin(clock.elapsedTime * 2 + index * 0.4) * 0.25;
      materialRef.current.emissive.copy(baseColor);
      materialRef.current.emissiveIntensity = sweep;
    } else if (isActive) {
      const flash = step!.type === "compare" ? FLASH_COMPARE : FLASH_WRITE;
      materialRef.current.emissive.copy(baseColor).lerp(flash, 0.7);
      materialRef.current.emissiveIntensity = 1.1;
    } else {
      materialRef.current.emissive.copy(baseColor);
      materialRef.current.emissiveIntensity = 0.4;
    }
  });

  return (
    <mesh ref={meshRef} position={[xForIndex(index), 0.15, 0]}>
      <boxGeometry args={[PILLAR_WIDTH, 1, PILLAR_WIDTH]} />
      <meshStandardMaterial ref={materialRef} color="#0c0c0e" roughness={0.6} metalness={0.15} emissive={LOW_COLOR} />
    </mesh>
  );
}

function SortCamera() {
  return (
    <OrbitControls
      target={[0, 2, 0]}
      enablePan={false}
      minDistance={10}
      maxDistance={32}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI / 2.2}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

export function SortScene() {
  const indices = useMemo(() => SORT_ARRAY.map((_, i) => i), []);

  return (
    <>
      <color attach="background" args={["#08070c"]} />
      <fog attach="fog" args={["#08070c", 22, 55]} />
      <ambientLight intensity={0.18} color="#4a3560" />
      <directionalLight position={[8, 16, 8]} intensity={0.3} />
      <Stars radius={80} depth={50} count={2200} factor={2.2} saturation={0} fade speed={0.3} />

      <SortCamera />

      {indices.map((i) => (
        <Pillar key={i} index={i} />
      ))}

      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TOTAL_WIDTH + 3, 8]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.95} />
      </mesh>
    </>
  );
}

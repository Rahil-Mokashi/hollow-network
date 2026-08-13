import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { heuristicDistance } from "../graph/astar";
import type { Cell } from "../graph/astar";
import { MAZE_TRIALS, mazeStart, mazeGoal } from "../game/maze";
import { useMazeStore, MAZE_ANIM_DURATION_MS } from "../game/mazeStore";

const TILE = 2;

const VIOLET_FAR = new THREE.Color("#3a2f6b");
const PINK_NEAR = new THREE.Color("#c9527a");
const GOLD_EXPLORED = new THREE.Color("#8a6a3a");
const GOLD_FLASH = new THREE.Color("#fff2c9");
const GOLD_PATH = new THREE.Color("#ffd27a");
const TEAL = new THREE.Color("#5fd6c4");
const AMBER = new THREE.Color("#ffb066");

function worldPos(r: number, c: number, half: number): [number, number, number] {
  return [c * TILE - half, 0, r * TILE - half];
}

interface TileProps {
  r: number;
  c: number;
  half: number;
  goal: Cell;
  maxH: number;
}

function MazeTile({ r, c, half, goal, maxH }: TileProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const result = useMazeStore((s) => s.result);
  const heuristic = useMazeStore((s) => s.heuristic);
  const solvedAt = useMazeStore((s) => s.solvedAt);

  const stepIndex = useMemo(() => result.steps.findIndex((s) => s.cell[0] === r && s.cell[1] === c), [result, r, c]);
  const onPath = useMemo(() => result.path?.some(([pr, pc]) => pr === r && pc === c) ?? false, [result, r, c]);
  const heat = useMemo(() => 1 - Math.min(heuristicDistance(heuristic, [r, c], goal) / maxH, 1), [heuristic, r, c, goal, maxH]);
  const totalSteps = result.steps.length;

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const elapsedMs = Date.now() - solvedAt;
    const revealAtMs = stepIndex >= 0 ? (stepIndex / Math.max(totalSteps, 1)) * MAZE_ANIM_DURATION_MS : Infinity;
    const revealed = elapsedMs >= revealAtMs;
    const flashPhase = revealed ? Math.max(0, 1 - (elapsedMs - revealAtMs) / 260) : 0;
    const allRevealed = elapsedMs >= MAZE_ANIM_DURATION_MS;

    if (onPath && allRevealed) {
      const pulse = 0.7 + Math.sin(clock.elapsedTime * 3 + r + c) * 0.3;
      materialRef.current.emissive.copy(GOLD_PATH);
      materialRef.current.emissiveIntensity = pulse;
    } else if (flashPhase > 0) {
      materialRef.current.emissive.copy(GOLD_EXPLORED).lerp(GOLD_FLASH, flashPhase);
      materialRef.current.emissiveIntensity = 0.5 + flashPhase * 0.8;
    } else if (revealed) {
      materialRef.current.emissive.copy(GOLD_EXPLORED);
      materialRef.current.emissiveIntensity = 0.32;
    } else {
      materialRef.current.emissive.copy(VIOLET_FAR).lerp(PINK_NEAR, heat);
      materialRef.current.emissiveIntensity = 0.28 + heat * 0.12;
    }
  });

  const pos = worldPos(r, c, half);
  return (
    <mesh ref={meshRef} position={[pos[0], -0.05, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[TILE * 0.92, TILE * 0.92]} />
      <meshStandardMaterial ref={materialRef} color="#0a0a0c" roughness={0.9} emissive={VIOLET_FAR} />
    </mesh>
  );
}

function MazeWall({ r, c, half }: { r: number; c: number; half: number }) {
  const pos = worldPos(r, c, half);
  return (
    <mesh position={[pos[0], 0.9, pos[2]]}>
      <boxGeometry args={[TILE * 0.94, 1.8, TILE * 0.94]} />
      <meshStandardMaterial color="#141317" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function Beacon({ cell, color, half }: { cell: Cell; color: THREE.Color; half: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) lightRef.current.intensity = 1.6 + Math.sin(clock.elapsedTime * 2.4) * 0.5;
  });
  const pos = worldPos(cell[0], cell[1], half);
  return (
    <group position={[pos[0], 0.4, pos[2]]}>
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight ref={lightRef} color={color} distance={7} decay={2} />
    </group>
  );
}

function PathRunner({ half }: { half: number }) {
  const result = useMazeStore((s) => s.result);
  const solvedAt = useMazeStore((s) => s.solvedAt);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !result.path || result.path.length === 0) return;
    const elapsedMs = Date.now() - solvedAt - MAZE_ANIM_DURATION_MS;
    if (elapsedMs < 0) {
      meshRef.current.visible = false;
      return;
    }
    const loopMs = 2400;
    const t = (elapsedMs % loopMs) / loopMs;
    const idx = Math.min(Math.floor(t * result.path.length), result.path.length - 1);
    const [r, c] = result.path[idx];
    const pos = worldPos(r, c, half);
    meshRef.current.position.set(pos[0], 0.5, pos[2]);
    meshRef.current.visible = true;
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.28, 12, 12]} />
      <meshBasicMaterial color={GOLD_PATH} />
    </mesh>
  );
}

function MazeCamera() {
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  return (
    <OrbitControls
      target={target}
      enablePan={false}
      minDistance={14}
      maxDistance={46}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.6}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

export function MazeScene() {
  const grid = useMazeStore((s) => s.grid);
  const trialIndex = useMazeStore((s) => s.trialIndex);

  const half = ((grid.width - 1) * TILE) / 2;
  const trial = MAZE_TRIALS[trialIndex];
  const goal = useMemo(() => mazeGoal(trial), [trial]);
  const start = useMemo(() => mazeStart(), []);
  const maxH = useMemo(() => heuristicDistance("euclidean", [0, 0], [grid.height - 1, grid.width - 1]), [grid]);

  const cells = useMemo(() => {
    const walls: { r: number; c: number }[] = [];
    const floors: { r: number; c: number }[] = [];
    for (let r = 0; r < grid.height; r++) {
      for (let c = 0; c < grid.width; c++) {
        if (grid.walls.has(`${r},${c}`)) walls.push({ r, c });
        else floors.push({ r, c });
      }
    }
    return { walls, floors };
  }, [grid]);

  return (
    <>
      <color attach="background" args={["#07070a"]} />
      <fog attach="fog" args={["#07070a", 26, 70]} />
      <ambientLight intensity={0.18} color="#4a3a5a" />
      <directionalLight position={[10, 20, 10]} intensity={0.25} />
      <Stars radius={90} depth={50} count={2400} factor={2.2} saturation={0} fade speed={0.3} />

      <MazeCamera />

      {cells.floors.map(({ r, c }) => (
        <MazeTile key={`f-${r}-${c}`} r={r} c={c} half={half} goal={goal} maxH={maxH} />
      ))}
      {cells.walls.map(({ r, c }) => (
        <MazeWall key={`w-${r}-${c}`} r={r} c={c} half={half} />
      ))}

      <Beacon cell={start} color={TEAL} half={half} />
      <Beacon cell={goal} color={AMBER} half={half} />
      <PathRunner half={half} />
    </>
  );
}

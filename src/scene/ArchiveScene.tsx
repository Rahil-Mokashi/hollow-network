import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { organicChamberGeometry, corridorCurve } from "./geometry";
import { useArchiveStore } from "../game/archiveStore";
import type { BST } from "../graph/bst";

const X_SPACING = 4.2;
const Z_SPACING = 5.5;

const AMBER = new THREE.Color("#ffb066");
const AMBER_DIM = new THREE.Color("#c8894a");
const GOLD_FLASH = new THREE.Color("#fff2c9");
const VIOLET = new THREE.Color("#b48cff");
const BASALT = new THREE.Color("#0c0c0e");
const TEAL = new THREE.Color("#5fd6c4");

function computeLayout(tree: BST): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  let counter = 0;
  function visit(id: string | null): void {
    if (id === null) return;
    const node = tree.nodes.get(id)!;
    visit(node.left);
    const x = counter * X_SPACING;
    counter += 1;
    positions.set(id, [x, 0, node.depth * Z_SPACING]);
    visit(node.right);
  }
  visit(tree.rootId);

  if (positions.size === 0) return positions;
  const xs = [...positions.values()].map((p) => p[0]);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  for (const [id, [x, y, z]] of positions) positions.set(id, [x - centerX, y, z]);
  return positions;
}

function ArchiveChamber({ id, position, seed }: { id: string; position: [number, number, number]; seed: number }) {
  const geometry = useMemo(() => organicChamberGeometry(1.35, seed), [seed]);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const cursorId = useArchiveStore((s) => s.cursorId);
  const justPlacedId = useArchiveStore((s) => s.justPlacedId);
  const justPlacedAt = useArchiveStore((s) => s.justPlacedAt);

  const isCursor = cursorId === id;
  const isJustPlaced = justPlacedId === id;

  useFrame(({ clock }) => {
    if (!materialRef.current || !lightRef.current) return;

    if (isCursor) {
      const pulse = 0.75 + Math.sin(clock.elapsedTime * 2.4) * 0.25;
      materialRef.current.emissive.copy(AMBER);
      materialRef.current.emissiveIntensity = pulse;
      lightRef.current.intensity = 2.0 * pulse;
      lightRef.current.color.copy(AMBER);
      if (ringRef.current && ringMaterialRef.current) {
        ringRef.current.visible = true;
        ringRef.current.rotation.z = clock.elapsedTime * 0.6;
        ringMaterialRef.current.opacity = 0.85;
      }
    } else {
      materialRef.current.emissive.copy(AMBER_DIM);
      materialRef.current.emissiveIntensity = 0.5;
      lightRef.current.intensity = 0.8;
      lightRef.current.color.copy(AMBER_DIM);
      if (ringRef.current) ringRef.current.visible = false;
    }

    if (isJustPlaced && justPlacedAt !== null) {
      const age = Date.now() - justPlacedAt;
      if (age < 500) {
        const flash = 1 - age / 500;
        materialRef.current.emissive.lerp(GOLD_FLASH, flash);
        materialRef.current.emissiveIntensity += flash * 1.2;
      }
    }
  });

  return (
    <group position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial ref={materialRef} color={BASALT} roughness={0.85} metalness={0.1} emissive={AMBER_DIM} />
      </mesh>
      <pointLight ref={lightRef} distance={8} decay={2} />
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[1.75, 0.045, 8, 40]} />
        <meshBasicMaterial ref={ringMaterialRef} color="#f0ede4" transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Edge({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const geometry = useMemo(() => {
    const curve = corridorCurve(new THREE.Vector3(...from), new THREE.Vector3(...to));
    return new THREE.TubeGeometry(curve, 16, 0.14, 8, false);
  }, [from, to]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#141618" roughness={0.9} emissive={TEAL} emissiveIntensity={0.4} />
    </mesh>
  );
}

function GhostSlot({ position, direction }: { position: [number, number, number]; direction: "left" | "right" }) {
  const ref = useRef<THREE.Mesh>(null);
  const hovered = useRef(false);
  const chooseDirection = useArchiveStore((s) => s.chooseDirection);

  useFrame(({ clock }) => {
    if (ref.current) {
      const base = hovered.current ? 0.55 : 0.3;
      const pulse = base + Math.sin(clock.elapsedTime * 3) * 0.15;
      (ref.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        chooseDirection(direction);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "default";
      }}
    >
      <icosahedronGeometry args={[0.9, 1]} />
      <meshBasicMaterial color={VIOLET} transparent opacity={0.3} wireframe />
    </mesh>
  );
}

function ArchiveCamera({ target }: { target: THREE.Vector3 }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  useFrame(() => {
    controlsRef.current?.target.lerp(target, 0.06);
    controlsRef.current?.update();
  });
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={8}
      maxDistance={36}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI / 2.2}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

export function ArchiveScene() {
  const tree = useArchiveStore((s) => s.tree);
  const cursorId = useArchiveStore((s) => s.cursorId);
  const version = useArchiveStore((s) => s.version); // tree mutates in place; this forces layout to recompute

  const positions = useMemo(() => computeLayout(tree), [tree, version]);

  const edges = useMemo(() => {
    const list: { from: [number, number, number]; to: [number, number, number] }[] = [];
    for (const node of tree.nodes.values()) {
      const from = positions.get(node.id);
      if (!from) continue;
      if (node.left) {
        const to = positions.get(node.left);
        if (to) list.push({ from, to });
      }
      if (node.right) {
        const to = positions.get(node.right);
        if (to) list.push({ from, to });
      }
    }
    return list;
  }, [tree, positions]);

  const cursorPos = positions.get(cursorId) ?? [0, 0, 0];
  const cursorNode = tree.nodes.get(cursorId);

  const ghostSlots: { position: [number, number, number]; direction: "left" | "right" }[] = [];
  if (cursorNode) {
    const [cx, , cz] = cursorPos as [number, number, number];
    if (cursorNode.left === null) ghostSlots.push({ position: [cx - X_SPACING / 2, 0, cz + Z_SPACING], direction: "left" });
    if (cursorNode.right === null) ghostSlots.push({ position: [cx + X_SPACING / 2, 0, cz + Z_SPACING], direction: "right" });
  }

  return (
    <>
      <color attach="background" args={["#08070a"]} />
      <fog attach="fog" args={["#08070a", 20, 55]} />
      <ambientLight intensity={0.16} color="#4a3560" />
      <Stars radius={80} depth={50} count={2200} factor={2.2} saturation={0} fade speed={0.3} />

      <ArchiveCamera target={new THREE.Vector3(...cursorPos)} />

      {[...tree.nodes.values()].map((node, i) => (
        <ArchiveChamber key={node.id} id={node.id} position={positions.get(node.id)!} seed={i + 1} />
      ))}
      {edges.map((e, i) => (
        <Edge key={i} from={e.from} to={e.to} />
      ))}
      {ghostSlots.map((slot, i) => (
        <GhostSlot key={i} position={slot.position} direction={slot.direction} />
      ))}
    </>
  );
}

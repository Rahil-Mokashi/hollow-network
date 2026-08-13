import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useGameStore } from "../game/store";

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const graph = useGameStore((s) => s.graph);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const node = graph.nodes.get(currentNodeId);
    if (!node) return;
    const target = new THREE.Vector3(...node.position);
    controls.target.lerp(target, 0.06);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={6}
      maxDistance={16}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

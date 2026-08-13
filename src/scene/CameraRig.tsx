import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useGameStore } from "../game/store";

const FINALE_DISTANCE = 26;

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const graph = useGameStore((s) => s.graph);
  const wonFinale = useGameStore((s) => s.wonFinale);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const node = graph.nodes.get(currentNodeId);
    if (!node) return;

    const target = new THREE.Vector3(...node.position);
    controls.target.lerp(target, 0.06);

    // A faint idle breathing drift on the target keeps the frame from ever
    // feeling perfectly locked-off.
    const driftX = Math.sin(clock.elapsedTime * 0.18) * 0.25;
    const driftY = Math.sin(clock.elapsedTime * 0.13) * 0.15;
    controls.target.x += driftX * 0.02;
    controls.target.y += driftY * 0.02;

    if (wonFinale) {
      const dir = camera.position.clone().sub(controls.target).normalize();
      const desired = controls.target.clone().addScaledVector(dir, FINALE_DISTANCE);
      camera.position.lerp(desired, 0.015);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={6}
      maxDistance={30}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

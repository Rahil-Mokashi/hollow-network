import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useGameStore } from "../game/store";
import { TRAVEL_DURATION, easeInOutCubic } from "./timing";

const FINALE_DISTANCE = 26;

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const graph = useGameStore((s) => s.graph);
  const wonFinale = useGameStore((s) => s.wonFinale);
  const travelAnim = useGameStore((s) => s.travelAnim);
  const { camera } = useThree();

  const travelElapsed = useRef(0);
  const trackedAnim = useRef<typeof travelAnim>(null);

  useFrame(({ clock }, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    let baseTarget: THREE.Vector3;
    let followLerp = 0.06;
    let arcLift = 0;

    if (travelAnim) {
      if (trackedAnim.current !== travelAnim) {
        travelElapsed.current = 0;
        trackedAnim.current = travelAnim;
      }
      travelElapsed.current += delta;
      const t = Math.min(travelElapsed.current / TRAVEL_DURATION, 1);
      const eased = easeInOutCubic(t);

      const fromNode = graph.nodes.get(travelAnim.from);
      const toNode = graph.nodes.get(travelAnim.to);

      if (fromNode && toNode) {
        // The camera flies alongside the traveling light pulse through the
        // corridor instead of staying locked on the departure chamber until
        // arrival — real locomotion instead of a teleport-and-snap.
        baseTarget = new THREE.Vector3(...fromNode.position).lerp(new THREE.Vector3(...toNode.position), eased);
        followLerp = 0.35;
        arcLift = Math.sin(eased * Math.PI) * 1.2;
      } else {
        baseTarget = controls.target.clone();
      }
    } else {
      trackedAnim.current = null;
      const node = graph.nodes.get(currentNodeId);
      baseTarget = node ? new THREE.Vector3(...node.position) : controls.target.clone();
    }

    controls.target.lerp(baseTarget, followLerp);
    controls.target.y += arcLift * 0.15;

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

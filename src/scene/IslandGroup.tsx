import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DRIFT_DURATION = 2.2;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface IslandGroupProps {
  offset: [number, number, number];
  active: boolean;
  children: ReactNode;
}

/** A cluster of chambers that starts visually offset (a distant, unreachable
 * island) and drifts into its true position once `active` flips true — the
 * physical manifestation of two graph components being union-find merged. */
export function IslandGroup({ offset, active, children }: IslandGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (active) {
      elapsed.current = Math.min(elapsed.current + delta, DRIFT_DURATION);
    } else {
      const idleBob = Math.sin(Date.now() * 0.0004) * 0.4;
      groupRef.current.position.set(offset[0], offset[1] + idleBob, offset[2]);
      return;
    }

    const t = easeOutCubic(elapsed.current / DRIFT_DURATION);
    groupRef.current.position.set(offset[0] * (1 - t), offset[1] * (1 - t), offset[2] * (1 - t));
    wasActive.current = true;
  });

  return <group ref={groupRef}>{children}</group>;
}

export const ISLAND_DRIFT_DURATION_MS = DRIFT_DURATION * 1000;

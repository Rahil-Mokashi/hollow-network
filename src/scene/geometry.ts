import * as THREE from "three";

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A low-poly sphere with jittered vertices — reads as worn, organic rock instead of a clean primitive. */
export function organicChamberGeometry(radius: number, seed: number): THREE.IcosahedronGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const rand = seededRandom(seed * 97 + 13);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const jitter = 1 + (rand() - 0.5) * 0.16;
    vertex.multiplyScalar(jitter);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/** A gently sagging curve between two chambers, so corridors read as carved rather than ruled lines. */
export function corridorCurve(from: THREE.Vector3, to: THREE.Vector3): THREE.CatmullRomCurve3 {
  const mid = from.clone().lerp(to, 0.5);
  mid.y -= 0.6 + from.distanceTo(to) * 0.03;
  return new THREE.CatmullRomCurve3([from, mid, to]);
}

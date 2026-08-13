/** Shared with Corridor's traveling light pulse so the camera flythrough
 * during travel and the visual pulse always stay in sync. */
export const TRAVEL_DURATION = 0.65;

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

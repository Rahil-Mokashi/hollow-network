export interface RunResult {
  hops: number;
  optimalHops: number;
  timeMs: number;
  rewinds: number;
  dejaVu: number;
}

export interface BestRun extends RunResult {
  grade: string;
}

const STORAGE_KEY = "hollow-network-best-run";

/** Efficiency-based letter grade — how close the run's total hops came to the theoretical optimum. */
export function computeGrade(hops: number, optimalHops: number): string {
  if (hops <= 0) return "C";
  const ratio = optimalHops / hops;
  if (ratio >= 0.95) return "S";
  if (ratio >= 0.85) return "A";
  if (ratio >= 0.7) return "B";
  return "C";
}

export function loadBestRun(): BestRun | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BestRun) : null;
  } catch {
    return null;
  }
}

function isBetter(a: RunResult, b: BestRun): boolean {
  if (a.hops !== b.hops) return a.hops < b.hops;
  return a.timeMs < b.timeMs;
}

/** Saves the run as the new best if it beats the stored one (fewer hops, then faster time). */
export function saveBestRun(result: RunResult): { best: BestRun; isNewBest: boolean } {
  const candidate: BestRun = { ...result, grade: computeGrade(result.hops, result.optimalHops) };
  const prev = loadBestRun();
  const isNewBest = !prev || isBetter(result, prev);
  if (isNewBest) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
    } catch {
      /* localStorage unavailable — best-run tracking degrades gracefully to session-only */
    }
  }
  return { best: isNewBest ? candidate : prev, isNewBest };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

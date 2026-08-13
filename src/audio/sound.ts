// Procedural sound design via the Web Audio API — no external audio files.
// Every effect is built from oscillators + gain envelopes so the whole game
// stays dependency-free. The AudioContext is created lazily on first use,
// which also satisfies browsers' autoplay policy since every call here is
// triggered by a user gesture (a click or keypress) upstream.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  duration?: number;
  gain?: number;
  delay?: number;
  glideTo?: number;
}

function tone(freq: number, opts: ToneOpts = {}): void {
  const audio = getCtx();
  if (!audio) return;
  const { type = "sine", duration = 0.35, gain = 0.12, delay = 0, glideTo } = opts;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo !== undefined) {
    osc.frequency.linearRampToValueAtTime(glideTo, start + duration);
  }

  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain, start + Math.min(0.02, duration * 0.2));
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  env.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** BFS Torch — a simultaneous chord, not sequential notes: every neighbor reveals at once. */
export function playChime(): void {
  [523.25, 659.25, 783.99, 987.77].forEach((freq) => tone(freq, { type: "sine", duration: 0.9, gain: 0.09 }));
}

/** A single committed traversal — short rising whoosh. */
export function playWhoosh(): void {
  tone(180, { type: "sawtooth", duration: 0.32, gain: 0.05, glideTo: 420 });
}

/** DFS Grapple committing forward down a new branch. */
export function playCommit(): void {
  tone(220, { type: "triangle", duration: 0.28, gain: 0.1, glideTo: 140 });
}

/** DFS Grapple rewind — spending a charge to backtrack. */
export function playRewind(): void {
  tone(140, { type: "triangle", duration: 0.28, gain: 0.1, glideTo: 260 });
  tone(90, { type: "sine", duration: 0.4, gain: 0.06, delay: 0.05 });
}

/** Cycle Ward déjà-vu — a low, uneasy sub-bass thump under the violet tint. */
export function playDejaVu(): void {
  tone(65, { type: "sine", duration: 0.9, gain: 0.16 });
  tone(64.5, { type: "sine", duration: 0.9, gain: 0.1, delay: 0.02 });
}

/** Reaching a goal chamber. */
export function playFanfare(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, { type: "triangle", duration: 0.5, gain: 0.1, delay: i * 0.09 }));
}

/** Union-Find finale — a slow rising swell as the two islands drift together. */
export function playSwell(): void {
  tone(110, { type: "sine", duration: 2.6, gain: 0.14, glideTo: 220 });
  tone(165, { type: "sine", duration: 2.6, gain: 0.08, glideTo: 330, delay: 0.15 });
}

/** A* maze — starting a solve pass: a soft rising sweep. */
export function playScanStart(): void {
  tone(200, { type: "sine", duration: 0.5, gain: 0.06, glideTo: 340 });
}


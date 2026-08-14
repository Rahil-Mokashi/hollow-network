// Procedural sound design via the Web Audio API — no external audio files.
// Every effect is built from oscillators + gain envelopes so the whole game
// stays dependency-free. The AudioContext is created lazily on first use,
// which also satisfies browsers' autoplay policy since every call here is
// triggered by a user gesture (a click or keypress) upstream.

const VOLUME_KEY = "hollow-network-volume";
const MUTED_KEY = "hollow-network-muted";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function loadStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    const v = raw !== null ? parseFloat(raw) : 0.7;
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0.7;
  } catch {
    return 0.7;
  }
}

function loadStoredMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

let storedVolume = loadStoredVolume();
let muted = loadStoredMuted();

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

/** Every sound in the game routes through this single node, so mute/volume
 * is one gain change rather than tracking every active oscillator. */
function getMasterGain(audio: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = audio.createGain();
    masterGain.gain.value = muted ? 0 : storedVolume;
    masterGain.connect(audio.destination);
  }
  return masterGain;
}

export function isMuted(): boolean {
  return muted;
}

export function getVolume(): number {
  return storedVolume;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTED_KEY, next ? "1" : "0");
  } catch {
    /* localStorage unavailable — setting just won't persist across reloads */
  }
  const audio = getCtx();
  if (audio) {
    const gain = getMasterGain(audio);
    gain.gain.linearRampToValueAtTime(next ? 0 : storedVolume, audio.currentTime + 0.15);
  }
}

export function setVolume(v: number): void {
  storedVolume = Math.min(Math.max(v, 0), 1);
  try {
    localStorage.setItem(VOLUME_KEY, String(storedVolume));
  } catch {
    /* same as above */
  }
  const audio = getCtx();
  if (audio && !muted) {
    getMasterGain(audio).gain.linearRampToValueAtTime(storedVolume, audio.currentTime + 0.1);
  }
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
  env.connect(getMasterGain(audio));
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

/** A faint tick on hovering something clickable — deliberately tiny and dry. */
export function playHover(): void {
  tone(900, { type: "sine", duration: 0.05, gain: 0.025 });
}

// ---------------------------------------------------------------------------
// Ambient background — a slow, continuously evolving pad that runs under
// whatever screen is active. Two detuned oscillators a fifth apart plus a
// very slow LFO breathing the volume, so it never draws attention to itself
// the way a one-shot cue does. Distinct per act/screen via base frequency
// and detune, so the world has a different "key" depending on which ability
// is active without ever feeling like a track change.

export type AmbientProfile = "title" | "entrance" | "bfs" | "dfs" | "cycle" | "unionfind" | "maze" | "archive" | "sort";

const PROFILE_TONE: Record<AmbientProfile, { base: number; detune: number }> = {
  title: { base: 55, detune: 1.5 },
  entrance: { base: 58, detune: 1.2 },
  bfs: { base: 65, detune: 2 },
  dfs: { base: 49, detune: 1.8 },
  cycle: { base: 61, detune: 3.2 },
  unionfind: { base: 57, detune: 1 },
  maze: { base: 52, detune: 2.4 },
  archive: { base: 63, detune: 1.6 },
  sort: { base: 69, detune: 2.2 },
};

interface AmbientHandle {
  bed: GainNode;
  nodes: OscillatorNode[];
}

let activeAmbient: AmbientHandle | null = null;
let activeProfile: AmbientProfile | null = null;

function stopAmbient(fadeSeconds: number): void {
  if (!activeAmbient) return;
  const audio = getCtx();
  const { bed, nodes } = activeAmbient;
  activeAmbient = null;
  activeProfile = null;
  if (!audio) return;

  const now = audio.currentTime;
  bed.gain.cancelScheduledValues(now);
  bed.gain.setValueAtTime(bed.gain.value, now);
  bed.gain.linearRampToValueAtTime(0, now + fadeSeconds);
  setTimeout(
    () => {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
    },
    fadeSeconds * 1000 + 100
  );
}

/** Crossfades the ambient bed to a new profile. Calling with the profile
 * already playing is a no-op, so this is safe to call on every render. */
export function setAmbientProfile(profile: AmbientProfile): void {
  if (activeProfile === profile) return;
  const audio = getCtx();
  if (!audio) return;

  stopAmbient(1.4);

  const { base, detune } = PROFILE_TONE[profile];
  const bed = audio.createGain();
  bed.gain.value = 0;
  bed.connect(getMasterGain(audio));
  bed.gain.linearRampToValueAtTime(0.05, audio.currentTime + 2.2);

  const osc1 = audio.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = base;
  osc1.connect(bed);

  const osc2 = audio.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = base * 1.5; // a fifth above — warm, not dissonant
  osc2.detune.value = detune * 10;
  const osc2Gain = audio.createGain();
  osc2Gain.gain.value = 0.4;
  osc2.connect(osc2Gain);
  osc2Gain.connect(bed);

  const lfo = audio.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.045; // one breath roughly every 22 seconds
  const lfoGain = audio.createGain();
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(bed.gain);

  osc1.start();
  osc2.start();
  lfo.start();

  activeAmbient = { bed, nodes: [osc1, osc2, lfo] };
  activeProfile = profile;
}

export function stopAllAmbient(): void {
  stopAmbient(0.8);
}

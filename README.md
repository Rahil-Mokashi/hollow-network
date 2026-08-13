# The Hollow Network

A complete 3D web game where the level *is* a graph data structure. Chambers
are nodes, corridors are edges, and every ability you earn — the BFS Torch,
the DFS Grapple, the Cycle Ward, the Union-Find Key — is a real,
correctly-implemented algorithm, not a visual approximation of one.

Built with React Three Fiber (Three.js), TypeScript, and Zustand, with the
graph algorithms written as pure, framework-free, unit-tested code
completely independent of the renderer. Sound is fully procedural (Web
Audio oscillators) — no audio files, nothing to license.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (Vite defaults to `http://localhost:5173`).

## Run the algorithm tests

```bash
npm run test
```

18 tests cover BFS (traversal order, shortest-path, one-ring reveal), DFS
(stack push/pop correctness, path-finding), cycle detection (true
positives, and no false positives from walking back to a parent),
union-find (component merging, path compression), and every level's graph
(each act's solvability and puzzle structure is asserted against the real
algorithms — the cyclic Act IV ring is verified with `detectCycle`, not
eyeballed) — all with zero dependency on rendering.

## Controls

- **Click** a lit, connected chamber to travel to it.
- **E** — use the current act's ability (BFS Torch / Union-Find Key). DFS
  Grapple and the Cycle Ward act through movement itself — there's no
  separate button.
- **Drag** to orbit the camera; scroll to zoom.

## The five acts

- **Act I — The Entrance**: a small, fully-revealed cluster. No ability
  required — teaches that movement only happens along an edge that
  actually exists, not through open space.
- **Act II — The Flood Vault** (*BFS Torch*): fog hides every chamber
  beyond your current one. The Torch reveals every directly-connected
  neighbor simultaneously — the core visual proof of "breadth"-first — and
  the vault is laid out so the path that *looks* shortest in 3D space isn't
  the one with the fewest hops. The live hop-counter keeps you honest.
- **Act III — The Deep Vaults** (*DFS Grapple*): every new chamber commits
  you fully — there's no free retreat. Backtracking to where you came from
  costs one of your limited rewind charges, drawn from the same call-stack
  logic as `dfs.ts`. One branch is a genuine dead end, forcing a real
  backtrack decision.
- **Act IV — The Loop** (*Cycle Ward*, boss): a true cyclic subgraph
  (verified with `detectCycle`). Re-entering a chamber you've already
  visited this loop tints the world violet — your only warning. Lose the
  thread three times and you're soft-respawned at the entrance, no hard
  fail.
- **Act V — The Bridge** (*Union-Find Key*, finale): two graph components,
  genuinely disconnected from the start. Reaching the Pylon and using the
  Key runs a real `unionTrace` over the live graph — if it confirms the two
  sides are separate, it adds the bridge edge and the second cluster
  physically drifts in from a distant "island" to meet the first. The
  camera pulls back for the merge and stays pulled back for the ending.

Each ability unlock is logged to the in-game Field Notes panel with a
plain-language explanation of the real algorithm behind it.

## Visual and audio design

- Chambers read by color at a glance: dim blue pilot light (hidden), teal
  pulse (reachable but unvisited — an invitation), steady amber (visited),
  bright pulsing amber (current), pale cyan (a distant, not-yet-connected
  island in Act V), violet flash (déjà vu in Act IV).
- A starfield backdrop, bloom on every emissive surface, a vignette, and a
  chromatic-aberration flick on déjà vu give the world depth without any
  imported textures or models — everything is procedural geometry
  (jittered icosahedra, swept tubes) and post-processing.
- The camera has a faint idle drift so it never feels perfectly
  locked-off, and eases into a pulled-back cinematic framing for the Act V
  finale.
- All sound (torch chime, travel whoosh, DFS commit/rewind tones, the
  déjà-vu sub-bass thump, the victory fanfare, the union-find swell) is
  synthesized at runtime via the Web Audio API in `src/audio/sound.ts`.

## Architecture

```
src/graph/   pure TypeScript — Graph model, bfs, dfs, cycleDetect,
             unionFind, and the full Vitest suite. No React or Three.js
             imports anywhere in this folder, by design.
src/scene/   React Three Fiber components that read graph/game state and
             render it — chambers, corridors, fog-of-war particles, the
             island-drift group, the camera rig. Never mutates state
             directly (except the one deliberate, real graph mutation:
             the Union-Find Key adding the bridge edge).
src/game/    level data (hand-authored graphs per act, five in total) and
             the Zustand store tying player position, revealed nodes, and
             every act's ability-specific state together.
src/ui/      HUD (hop counter, act-progress pips, rewind lanterns, ability
             button, win/finale banners), the literal node-edge minimap,
             and the Field Notes codex.
src/audio/   procedural Web Audio sound design, no external files.
```

## Algorithms taught

| Algorithm | Where |
|---|---|
| Breadth-first search | BFS Torch ability, Act II |
| Depth-first search | DFS Grapple ability, Act III |
| Cycle detection | Cycle Ward ability, Act IV |
| Union-find / connectivity | Union-Find Key ability, Act V |

# The Hollow Network

A complete 3D web game where the level *is* a graph data structure, played
across an eight-stage campaign and capped off with a bonus A* pathfinding
trial. Chambers are nodes, corridors are edges, and every ability you
earn — the BFS Torch, the DFS Grapple, the Cycle Ward, the Union-Find Key,
and finally A* itself — is a real, correctly-implemented algorithm, not a
visual approximation of one.

Built with React Three Fiber (Three.js), TypeScript, and Zustand, with the
graph and pathfinding algorithms written as pure, framework-free,
unit-tested code completely independent of the renderer. Sound is fully
procedural (Web Audio oscillators) — no audio files, nothing to license.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (Vite defaults to `http://localhost:5173`). A
title screen orbits all five networks before you start — click **Enter the
Network** to begin.

## Run the algorithm tests

```bash
npm run test
```

41 tests, zero dependency on rendering: BFS (traversal order, shortest-path,
one-ring reveal), DFS (stack push/pop correctness, path-finding), cycle
detection (true positives, and no false positives from walking back to a
parent), union-find (component merging, path compression), every level's
graph across the full 8-stage campaign (each stage's solvability and puzzle
structure asserted against the real algorithms — both cyclic Act IV rings
are verified with `detectCycle`, not eyeballed), the generalized
stuck-detection failure state (fires exactly when no legal move remains,
and provably does *not* misfire for abilities where it shouldn't), and A*
(correctness on open and blocked grids, both maze trials' solvability,
deterministic generation, and — the actual point of the bonus module —
that Manhattan never expands more nodes than Euclidean on 4-directional
movement, because Euclidean is a strictly looser lower bound).

## Controls

- **Click** a lit, connected chamber to travel to it — the camera flies
  alongside the corridor's light pulse as you go, rather than snapping to
  the new chamber after the fact.
- **E** — use the current act's ability (BFS Torch / Union-Find Key). DFS
  Grapple and the Cycle Ward act through movement itself — there's no
  separate button.
- **Drag** to orbit the camera; scroll to zoom.

## The campaign — eight stages across five acts

- **Act I — The Entrance**: a small, fully-revealed cluster. No ability
  required — teaches that movement only happens along an edge that
  actually exists, not through open space.
- **Act II — The Flood Vault, 1/2 and 2/2** (*BFS Torch*): fog hides every
  chamber beyond your current one. The Torch reveals every directly-connected
  neighbor simultaneously — the core visual proof of "breadth"-first — and
  each vault is laid out so the path that *looks* shortest in 3D space isn't
  the one with the fewest hops. Stage 2 is bigger and needs three separate
  Torch fires instead of two. Both stages carry a real move budget — run out
  of moves before reaching the Beacon and the vault fails outright, no
  partial credit.
- **Act III — The Deep Vaults, 1/2 and 2/2** (*DFS Grapple*): every new
  chamber commits you fully — there's no free retreat. Backtracking to
  where you came from costs one of your limited rewind charges, drawn from
  the same call-stack logic as `dfs.ts`. Stage 1 has one genuine dead end;
  stage 2 has two, against the same three charges, so careless exploration
  can genuinely strand you — the game detects that exact condition (no
  legal move remains) and offers a real Retry rather than softlocking.
- **Act IV — The Loop, 1/2 and 2/2** (*Cycle Ward*, boss): a true cyclic
  subgraph (verified with `detectCycle`) — stage 2's ring carries a chord
  that nests a second, shorter cycle inside the first. Re-entering a
  chamber you've already visited this loop tints the world violet — your
  only warning. Lose the thread three times and you're soft-respawned at
  the entrance, no hard fail.
- **Act V — The Bridge** (*Union-Find Key*, finale): two graph components,
  genuinely disconnected from the start. Reaching the Pylon and using the
  Key runs a real `unionTrace` over the live graph — if it confirms the two
  sides are separate, it adds the bridge edge and the second cluster
  physically drifts in from a distant "island" to meet the first. The
  camera pulls back for the merge and stays pulled back for the ending.

Each ability unlock is logged to the in-game Field Notes panel with a
plain-language explanation of the real algorithm behind it, and the
Algorithm Trace panel prints the actual live data structure (the DFS call
stack, the cycle-detection back-edge, the union-find components) as you
play — not asserted in a README, visibly running.

## Bonus Trial — The Maze (A*)

Reachable from a button on the Act V finale screen, and played across two
trials of escalating size. Both are hand-designed, deterministically
generated (seeded recursive backtracker, then lightly braided with extra
loops — without loops, heuristic choice barely matters, which defeats the
point). Clear Trial I with both heuristics and a "bigger maze" button
unlocks Trial II, roughly triple the cell count.

Toggle between **Manhattan** and **Euclidean** heuristics and watch A* solve
the same maze twice: unexplored cells are colored by the heuristic's own
distance estimate to the goal (a violet-to-pink heat field, visible *before*
the algorithm even runs), explored cells light up gold in the real order
they were expanded, and the final path glows with a traveling light. The
comparison panel then states the real result — on this maze, Manhattan
consistently expands fewer nodes than Euclidean, because Euclidean distance
is always a looser (less informative) lower bound than Manhattan distance
for 4-directional grid movement. That inequality is also a unit test, not
just a UI claim.

## Real stakes, not just a retroactive grade

Two failure states, each with a real consequence and a Retry, not merely a
worse score after the fact:

- **Out of moves** — Act II's stages carry a move budget; exceed it before
  reaching the Beacon and the vault fails.
- **Stranded** — a generalized check (DFS Grapple only) that fires the
  instant no legal move remains from your current chamber — every rewind
  charge spent, every branch a dead end. This is unreachable through normal
  play in the shipped levels (they're built with a margin of spare charges
  on purpose, so the campaign is always fair) but the detection is real and
  independently unit-tested, not just present for stages that need it.

## Accessibility

Every state that matters for play is encoded in shape as well as color, not
color alone: the current chamber carries a solid neutral ring (plus a
diamond marker on the minimap); a reachable-but-unvisited chamber carries a
thinner, breathing ring (plus a dashed minimap outline). A colorblind
player can tell "where am I" and "where can I go" without relying on hue at
all.

## Scoring and replayability

Runs are graded S/A/B/C by how close your total hop count across the full
campaign comes to the theoretical optimum (computed once from real
`bfsShortestPath` calls, not hand-tuned). Your best run (fewest hops, then
fastest time) persists in `localStorage` and is shown on the title screen
and compared against on every finale. "Copy Results" puts a shareable
one-line summary on the clipboard.

## Visual and audio design

- Chambers read by color *and* shape at a glance: dim blue pilot light
  (hidden), teal pulse with a breathing ring (reachable but unvisited — an
  invitation), steady amber (visited), bright pulsing amber with a solid
  ring (current), pale cyan (a distant, not-yet-connected island in Act V),
  violet flash (déjà vu in Act IV).
- The title screen is a slow cinematic orbit around all five acts' networks
  at once — the whole concept in one glance before you ever click Start.
- The camera flies alongside the traveling light pulse through each
  corridor instead of snapping to the destination after arrival, has a
  faint idle drift so it never feels perfectly locked-off, and eases into a
  pulled-back cinematic framing for the Act V finale.
- A starfield backdrop, bloom on every emissive surface, a vignette, and a
  chromatic-aberration flick on déjà vu give the world depth without any
  imported textures or models — everything is procedural geometry
  (jittered icosahedra, swept tubes) and post-processing.
- All sound (torch chime, travel whoosh, DFS commit/rewind tones, the
  déjà-vu sub-bass thump, the victory fanfare, the union-find swell, the
  maze scan sweep) is synthesized at runtime via the Web Audio API in
  `src/audio/sound.ts`.

## Architecture

```
src/graph/   pure TypeScript — Graph model, bfs, dfs, cycleDetect,
             unionFind, astar, and the full Vitest suite. No React or
             Three.js imports anywhere in this folder, by design.
src/scene/   React Three Fiber components that read graph/game state and
             render it — chambers, corridors, fog-of-war particles, the
             island-drift group, the title backdrop, the maze grid, the
             camera rigs (including the travel flythrough). Never mutates
             state directly (except the one deliberate, real graph
             mutation: the Union-Find Key adding the bridge edge).
src/game/    level data — eight campaign stages plus the seeded maze
             generator (two trials) — the Zustand store tying player
             position, revealed nodes, run stats, failure state, and every
             act's ability-specific state together, and score.ts for
             grading and best-run persistence.
src/ui/      HUD, the literal node-edge minimap, the live Algorithm Trace
             panel, the Field Notes codex, the title screen, the failure/
             retry banner, and the maze trial's controls.
src/audio/   procedural Web Audio sound design, no external files.
```

## Algorithms taught

| Algorithm | Where |
|---|---|
| Breadth-first search | BFS Torch ability, Act II (2 stages) |
| Depth-first search | DFS Grapple ability, Act III (2 stages) |
| Cycle detection | Cycle Ward ability, Act IV (2 stages) |
| Union-find / connectivity | Union-Find Key ability, Act V |
| A* search + heuristic design | Bonus Trial — The Maze (2 trials) |

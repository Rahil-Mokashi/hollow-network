# The Hollow Network

A complete 3D web game where the level *is* a graph data structure, played
across an eight-stage campaign and capped off with three bonus trials —
A* pathfinding, binary search trees, and sorting. Chambers are nodes,
corridors are edges, and every ability you earn — the BFS Torch, the DFS
Grapple, the Cycle Ward, the Union-Find Key, A* itself, BST insert/search,
and two sorting algorithms — is a real, correctly-implemented algorithm,
not a visual approximation of one.

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

73 tests, zero dependency on rendering: BFS (traversal order, shortest-path,
one-ring reveal), DFS (stack push/pop correctness, path-finding), cycle
detection (true positives, and no false positives from walking back to a
parent), union-find (component merging, path compression), every level's
graph across the full 8-stage campaign (each stage's solvability and puzzle
structure asserted against the real algorithms — both cyclic Act IV rings
are verified with `detectCycle`, not eyeballed), the generalized
stuck-detection failure state (fires exactly when no legal move remains,
and provably does *not* misfire for abilities where it shouldn't), A*
(correctness on open and blocked grids, both maze trials' solvability,
deterministic generation, and — the actual point of the bonus module — that
each strategy expands progressively more nodes as its guess gets worse:
Manhattan ≤ Euclidean ≤ Dijkstra, all three still agreeing on the true
shortest path), and BST (in-order traversal is sorted order for *any*
insertion sequence — the one property that makes it a search tree at all —
search correctly reports both found and legitimately-not-found values, and
the game's own step-by-step attach-by-attach play matches what a direct
insert would have produced), and sorting (bubble sort and merge sort both
produce the exact same correctly-sorted output for random, sorted,
reverse-sorted, duplicate-heavy, single-element, and empty input, and —
the actual point of that trial — merge sort's comparison count grows
asymptotically slower than bubble sort's as the array size doubles, not
just "is smaller once").

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
loops — without loops, strategy choice barely matters, which defeats the
point). Clear Trial I with all three strategies and a "bigger maze" button
unlocks Trial II, roughly triple the cell count.

Toggle between three search strategies and watch the same maze get solved
three different ways: **Dijkstra** (no guess at all — h(n) = 0 everywhere),
**Manhattan** (a tight guess that matches the maze's real movement cost
exactly), and **Euclidean** (a looser, straight-line guess). Unexplored
cells are colored by the active strategy's own distance estimate to the
goal (a heat field, visible *before* the algorithm even runs), explored
cells light up gold in the real order they were expanded, and the final
path glows with a traveling light. The comparison panel states the real
result: Dijkstra explores dramatically more of the maze than either A*
variant — it has no idea which direction the goal is in, so it expands
outward roughly evenly — while Manhattan consistently beats Euclidean,
because Euclidean distance is always a looser lower bound than Manhattan
distance for 4-directional grid movement. All three still agree on the
exact same shortest path. That ordering is a unit test, not just a UI
claim.

## Bonus Trial — The Archive (BST)

Reachable from the Maze trial or directly from the Act V finale screen — a
genuinely different kind of gameplay from the rest of the game: instead of
navigating a pre-built graph, you *build* this one. A sequence of seven
values gets inserted one at a time into a binary search tree that starts
with just a root chamber. At each step you're shown the value being placed
against the chamber you're standing at and asked one question — smaller or
larger? — and the dungeon grows a new chamber left or right as you answer
correctly; a wrong guess costs nothing but a tracked mistake and doesn't
move you. Once every value is placed, the same rule runs in reverse: find
three target values by walking the identical left/right comparison, one of
which doesn't exist in the tree at all — a real, legitimate "not found"
that the search correctly recognizes rather than wandering forever. The
payoff at the end is the in-order traversal of the tree you actually built,
read out loud: it's always sorted, for any sequence you insert, which is
the entire reason a binary search tree is a search tree.

## Bonus Trial — SortCraft

Reachable from the Maze, the Archive, or the Act V finale screen. The most
purely visual of the three trials, and deliberately styled differently from
the rest of the game — crystal pillars in a row instead of chambers in a
graph, so it reads as its own thing rather than another skin on the same
mechanic. The same eight-value row gets sorted two ways: **Bubble Sort**
(only ever compares neighbors, swaps when they're out of order) and
**Merge Sort** (splits the row in half recursively, sorts each half, merges
them back together). Pillars flash teal on a comparison and gold on a
write, in the real order the algorithm actually performed them, and the
comparison panel states the real gap in operation counts — small on eight
values, but the accompanying test proves the *growth rate* itself differs,
which is the actual reason one is called O(n²) and the other O(n log n).

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
             unionFind, astar, bst, sort, and the full Vitest suite. No
             React or Three.js imports anywhere in this folder, by design.
src/scene/   React Three Fiber components that read graph/game state and
             render it — chambers, corridors, fog-of-war particles, the
             island-drift group, the title backdrop, the maze grid, the
             BST tree layout, the sort pillars, the camera rigs (including
             the travel flythrough). Never mutates state directly (except
             two deliberate, real mutations: the Union-Find Key adding the
             bridge edge, and the Archive's tree growing by insertion).
src/game/    level data — eight campaign stages, the seeded maze generator
             (two trials), the Archive's insert/search sequence, and
             SortCraft's fixed row — the Zustand store tying player
             position, revealed nodes, run stats, failure state, and every
             act's ability-specific state together, plus score.ts for
             grading and best-run persistence.
src/ui/      HUD, the literal node-edge minimap, the live Algorithm Trace
             panel, the Field Notes codex, the title screen, the failure/
             retry banner, and all three bonus trials' controls.
src/audio/   procedural Web Audio sound design, no external files.
```

## Algorithms taught

| Algorithm | Where |
|---|---|
| Breadth-first search | BFS Torch ability, Act II (2 stages) |
| Depth-first search | DFS Grapple ability, Act III (2 stages) |
| Cycle detection | Cycle Ward ability, Act IV (2 stages) |
| Union-find / connectivity | Union-Find Key ability, Act V |
| A* search + heuristic design (vs. Dijkstra) | Bonus Trial — The Maze (2 trials) |
| Binary search tree insert / search | Bonus Trial — The Archive |
| Bubble sort vs. merge sort | Bonus Trial — SortCraft |

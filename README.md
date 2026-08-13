# The Hollow Network

A 3D web game where the level *is* a graph data structure. Chambers are
nodes, corridors are edges, and the ability you use to explore — the BFS
Torch — is a real, correctly-implemented breadth-first search, not a
visual approximation of one.

Built with React Three Fiber (Three.js), TypeScript, and Zustand, with the
graph algorithms written as pure, framework-free, unit-tested code
completely independent of the renderer.

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

13 tests cover BFS (traversal order, shortest-path, one-ring reveal), DFS
(stack push/pop correctness, path-finding), cycle detection (true
positives, and no false positives from walking back to a parent), and
union-find (component merging, path compression) — all against hand-built
graphs, with zero dependency on rendering.

## Controls

- **Click** a lit, connected chamber to travel to it.
- **E** — use the current act's ability (BFS Torch).
- **Drag** to orbit the camera; scroll to zoom.

## What's playable right now

- **Act I — The Entrance**: a small, fully-revealed cluster. No ability
  required — just teaches that movement only happens along an edge that
  actually exists, not through open space.
- **Act II — The Flood Vault**: fog hides every chamber beyond your
  current one. The BFS Torch reveals every directly-connected neighbor
  simultaneously (the core visual proof of "breadth"-first), and the vault
  is deliberately laid out so the path that *looks* shortest in 3D space
  isn't the one with the fewest hops — the live hop-counter in the HUD
  keeps you honest.

Each ability unlock is logged to the in-game Field Notes panel with a
plain-language explanation of the real algorithm behind it.

## Architecture

```
src/graph/   pure TypeScript — Graph model, bfs, dfs, cycleDetect,
             unionFind, and the full Vitest suite. No React or Three.js
             imports anywhere in this folder, by design.
src/scene/   React Three Fiber components that read graph/game state and
             render it — chambers, corridors, fog-of-war particles, the
             camera rig. Never mutates state directly.
src/game/    level data (hand-authored graphs per act) and the Zustand
             store tying player position, revealed nodes, and ability
             state together.
src/ui/      HUD, the literal node-edge minimap, and the Field Notes
             codex.
```

## Next milestones

`dfs.ts`, `cycleDetect.ts`, and `unionFind.ts` are already implemented and
fully unit-tested — the algorithmic core for the rest of the game exists.
What's left is wiring each to its own ability and act:

- **DFS Grapple** (Act III) — single-edge commit-and-backtrack traversal
  with a finite rewind-charge resource drawn from the real DFS call stack.
- **Cycle Ward** (Act IV boss) — a cyclic subgraph where re-entering an
  already-visited node triggers a déjà-vu tint, using `detectCycle`'s
  back-edge detection.
- **Union-Find Key** (finale) — two disconnected graph components that
  physically drift together into one explorable whole the moment their
  bridge edge is found.

## Algorithms taught

| Algorithm | Where |
|---|---|
| Breadth-first search | BFS Torch ability, Act II |
| Depth-first search | `src/graph/dfs.ts` (engine ready; ability pending) |
| Cycle detection | `src/graph/cycleDetect.ts` (engine ready; ability pending) |
| Union-find / connectivity | `src/graph/unionFind.ts` (engine ready; ability pending) |

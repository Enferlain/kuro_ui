# Physics & Interaction Guide

This document outlines the architecture, logic, and considerations for the node-based physics system in the Kuro Trainer UI.

## Core Architecture

The system uses a hybrid approach combining **d3-force** for physics simulation and **Framer Motion** for performant rendering.

### Key Components

1.  **`usePhysicsEngine.ts`**: The brain. Manages the `d3-force` simulation, collision detection, and position updates.
2.  **`Node.tsx`**: The body. Handles user interaction (drag, resize, click) and reports visual state changes to the engine.
3.  **`Canvas.tsx`**: The world. Orchestrates the initialization and renders the nodes/connections.

### The "Hybrid" Loop
To achieve 60fps performance even with many nodes, we bypass React's render cycle for position updates:
1.  **Physics Tick**: `d3-force` updates internal `x/y` coordinates.
2.  **MotionValues**: The engine directly updates `framer-motion` `MotionValues` (`mv.x.set(node.x)`).
3.  **GPU Render**: Framer Motion updates the DOM transform directly. React **does not re-render** during physics movement.

---

## Interaction Models

We distinguish between two types of node expansion, each with distinct physics behaviors.

### 1. Manual Expansion (The "Push")
**Trigger**: User clicks a minimized node to activate it.
**Goal**: The selected node stays put; neighbors get out of the way.

*   **Mechanism**: **Anchoring**.
*   **Logic**:
    *   `Node.tsx` detects `isActive` is true.
    *   Calls `onResize(w, h, anchor=true)`.
    *   `usePhysicsEngine` sets `node.fx = currentX` and `node.fy = currentY`.
    *   The node becomes an immovable object (infinite mass) for 500ms.
    *   Collision forces push all other nodes away from this anchor.

### 2. Zoom Expansion (The "Slide")
**Trigger**: User zooms in, causing nodes to switch from LOD (minimized) to Detail view.
**Goal**: All nodes expand simultaneously and slide apart gently. No single node dominates.

*   **Mechanism**: **Mutual Displacement**.
*   **Logic**:
    *   `Node.tsx` detects `isActive` is false (passive expansion).
    *   Calls `onResize(w, h, anchor=false)`.
    *   `usePhysicsEngine` ensures `fx/fy` are null.
    *   Collision forces apply equally to all overlapping nodes.
    *   **Force Clamping** (`MAX_FORCE = 2.0`) prevents violent "explosions" when multiple nodes expand at once.

---

## Key Physics Parameters

Located in `usePhysicsEngine.ts`:

*   **`MAX_FORCE` (2.0)**: Critical for stability. Limits how hard nodes can shove each other per tick. Without this, zoom expansion causes nodes to fly off screen.
*   **`velocityDecay` (0.15)**: Friction. Lower values (0.15) make nodes "slide" like they are on ice. Higher values (0.6) make them stop instantly like in mud. We use 0.15 to allow organic settling.
*   **`strength` (0.5)**: Collision stiffness. 1.0 is rigid, 0.5 is soft/bouncy.
*   **`alpha` (0.5)**: Simulation "heat". When restarting (e.g., on resize), we use `alpha(0.5)` instead of `1.0` to avoid jarring jumps.

---

## Gotchas & Considerations

### 1. MotionValues vs State
*   **Never** use `useState` for `x/y` coordinates. It triggers re-renders and kills performance.
*   Always use `MotionValues` for position and `d3-force` for calculation.
*   Only sync to the Zustand store (persistence) when interaction **ends** (`onDragEnd` or simulation `on('end')`).

### 2. Hydration Order
*   Physics must not initialize until the store has **Hydrated**.
*   If physics runs on empty/default data, nodes will teleport to (0,0) and then explode outward.
*   Check `hasHydrated` in `Canvas.tsx` before initializing `usePhysicsEngine`.

### 3. The "Jumping to Narnia" Bug
*   **Symptom**: Nodes fly off to infinity during zoom.
*   **Cause**: Multiple nodes expanding 10x in size simultaneously create massive overlap. `d3-force` tries to resolve this in one tick, generating huge velocity vectors.
*   **Fix**: `MAX_FORCE` clamping in `forceRectCollide`.

### 4. Anchoring Timing
*   The anchor (`fx/fy`) must be released after a short delay (e.g., 500ms). If released too soon, the node gets pushed back by the momentum of neighbors. If held too long, it feels stuck.

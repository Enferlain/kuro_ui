# Physics & Interaction Guide

This document outlines the architecture, logic, and considerations for the node-based physics system in the Kuro Trainer UI.

## Core Architecture

The system uses a hybrid approach combining **Matter.js** for rigid body physics simulation and **Framer Motion** for performant rendering.

### Key Components

1.  **`usePhysicsEngine.ts`**: The brain. Manages the `Matter.js` Engine, World, and Runner. Handles collision detection, constraints, and synchronizes physics state to visual state.
2.  **`Node.tsx`**: The body. Handles user interaction (drag, resize) and reports intent to the engine. Uses `MotionValues` for smooth 60fps updates without React renders.
3.  **`Canvas.tsx`**: The world. Orchestrates initialization, manages the global store, and renders the scene.

### The "Hybrid" Loop
To achieve high performance, we decouple the physics loop from React's render cycle:

1.  **Physics Tick**: `Matter.Runner` steps the simulation (default 60Hz).
2.  **MotionValues**: In the `afterUpdate` event, the engine directly updates `framer-motion` `MotionValues` (`mv.x.set(body.position.x)`).
3.  **GPU Render**: Framer Motion updates the DOM transform directly. **React does not re-render** during physics movement.

---

## Interaction Models

We use distinct physics strategies for different user interactions to ensure the UI feels "solid" but responsive.

### 1. Dragging (The "Rubber Band")
**Goal**: Nodes should have weight and collide with others while being dragged, but feel responsive to the mouse.

*   **Mechanism**: **Constraint Dragging**.
*   **Logic**:
    *   When `dragStart` is called, we create a `Matter.Constraint` (a stiff spring) connecting the mouse position to the body's center.
    *   **Stiffness (0.8)**: High stiffness makes it feel 1:1 with the mouse.
    *   **Damping (0.1)**: Reduces oscillation.
    *   **Benefit**: This allows the physics engine to resolve collisions naturally. If you drag a node into another, the constraint stretches, and the node slides around the obstacle rather than clipping through it.

### 2. Manual Resize (The "Hand of God")
**Goal**: When a user manually resizes a node, they expect absolute control. Physics should not fight back.

*   **Mechanism**: **Static Body**.
*   **Logic**:
    *   `Node.tsx` calls `notifyResize(..., isManual=true)`.
    *   The body is set to **Static** (`Matter.Body.setStatic(body, true)`). It becomes an immovable object.
    *   Position and Scale are updated directly based on mouse movement.
    *   **Wake Neighbors**: We explicitly wake up surrounding bodies so they can be pushed away by the expanding static body.

### 3. Auto Expansion / Activation (The "Anchor")
**Goal**: When a node becomes active (e.g., clicked), it expands. It should stay roughly in place while pushing neighbors away.

*   **Mechanism**: **Variable Mass**.
*   **Logic**:
    *   `Node.tsx` calls `notifyResize(..., anchor=true)`.
    *   The body remains **Dynamic**.
    *   **Mass**: We set the body's mass to a very high value (`5000`). It becomes a "Heavy King".
    *   **Result**: When it expands and collides with neighbors (standard "Light Pawns"), the neighbors are pushed away, but the heavy node barely moves.

### 4. Zoom / LOD Expansion (The "Pawn")
**Goal**: When zooming in, all nodes expand from LOD size to full size. They should mutually displace each other.

*   **Mechanism**: **Low Density**.
*   **Logic**:
    *   `Node.tsx` calls `notifyResize(..., anchor=false)`.
    *   **Density**: We set the density low (`0.001`).
    *   **Result**: All nodes have similar low mass. When they expand and overlap, the physics engine resolves the overlap by pushing *both* nodes apart equally.

---

## Physics Tuning

Key constants in `usePhysicsEngine.ts`:

*   **`INERTIA` (Infinity)**: **CRITICAL**. Prevents nodes from rotating. We want 2D AABB interaction, not tumbling boxes.
*   **`FRICTION_AIR` (0.069)**: Simulates air resistance. Higher values prevent nodes from gliding forever after a collision.
*   **`PHYSICS_BUFFER` (15px)**: An invisible margin added to the physics body size. This ensures nodes maintain a visual gap and don't look "glued" together.
*   **`SLOP` (0.05)**: Collision tolerance.
*   **`lerpFactor` (0.4)**: Controls how fast the physics body size tracks the visual target size. Increased from 0.1 to 0.4 to ensure the physics body expands fast enough to push neighbors away before the visual overlap becomes too severe.

---

## Gotchas & Considerations

### 1. The "Fighting" Problem
*   **Issue**: If you try to set a body's position manually (`Body.setPosition`) every frame while it's also colliding, the physics engine will fight you, causing jitter.
*   **Solution**:
    *   For **Dragging**: Use Constraints, don't set position directly.
    *   For **Resizing**: Make the body Static.

### 2. Sleeping Neighbors
*   **Issue**: When a node expands automatically (e.g., via activation), neighbors might be "sleeping" (optimization) and won't react until the collision is deep.
*   **Solution**: We explicitly wake up all neighbors (`Matter.Sleeping.set(b, false)`) in `notifyResize` to ensure immediate repulsion.

### 2. Synchronization Direction
*   **Physics -> Visuals**: Happens every frame in `afterUpdate`.
*   **Visuals -> Physics**: Happens only on specific events (`onResize`, `initPhysics`).
*   **Store -> Visuals**: Happens on Hydration or "Reset Layout".

### 3. Hydration
*   Physics **must not** initialize until the Zustand store has hydrated.
*   If initialized with default/empty values, nodes will spawn at (0,0) and violently explode outward when the correct positions load.
*   We use a `nodesHash` to detect structural changes (add/remove) and only re-init physics then.

### 4. Scale & Zoom
*   The physics simulation runs in "World Space" (unscaled coordinates).
*   Visual rendering applies the `scale` transform.
*   Input events (mouse drag) must be converted from Screen Space to World Space before being passed to the physics engine.

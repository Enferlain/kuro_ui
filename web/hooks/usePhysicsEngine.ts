import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { motionValue, MotionValue } from 'framer-motion';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';

// Data stored for each node in the physics world
interface PhysicsNode {
    id: NodeId;
    cx: number;
    cy: number;
    width: number;
    height: number;
}

const PHYSICS_CONFIG = {
    INERTIA: Infinity,  // PREVENTS ROTATION
    FRICTION: 0.05,     // Surface roughness (doesn't do much if gravity is 0)
    FRICTION_AIR: 0.069,  // INCREASE to reduce gliding (e.g., 0.05 to 0.1)
    RESTITUTION: 0.0,   // INCREASE for more bounce (e.g., 0.5 to 0.8)
    CHAMFER: { radius: 4 },
    SLOP: 0.05          // Standard tolerance for stability
};

export const usePhysicsEngine = () => {
    const engine = useRef<Matter.Engine | null>(null);
    const runner = useRef<Matter.Runner | null>(null);
    const bodies = useRef<Map<NodeId, Matter.Body>>(new Map());
    const motionValues = useRef(new Map<NodeId, { x: MotionValue<number>, y: MotionValue<number> }>());
    const targetSizes = useRef(new Map<NodeId, { width: number, height: number }>());

    // [Shiro] Constraint for dragging (The "Rubber Band" approach)
    const dragConstraint = useRef<Matter.Constraint | null>(null);

    // [Shiro] Physics Tuning
    const PHYSICS_BUFFER = 15; // Invisible buffer around nodes to prevent visual overlap

    // Track if user is currently interacting to prevent auto-save conflicts
    const isInteracting = useRef(false);

    // [Shiro] Track nodes being manually resized to prevent physics fighting
    const resizingNodes = useRef<Set<NodeId>>(new Set());

    // [Shiro] New Update Action
    const updateNode = useStore.getState().updateNode;

    // --- Initialization ---
    const initPhysics = useCallback((initialNodes: PhysicsNode[]) => {
        // 1. Initialize Engine
        if (!engine.current) {
            engine.current = Matter.Engine.create({
                gravity: { x: 0, y: 0 }, // Top-down
                positionIterations: 32, // [Shiro] Max stability
                velocityIterations: 32, // [Shiro] Max stability
            });
        }

        const world = engine.current.world;
        Matter.World.clear(world, false); // Clear existing bodies
        bodies.current.clear();

        // 2. Create Bodies
        initialNodes.forEach(n => {
            // Initialize MotionValues
            if (!motionValues.current.has(n.id)) {
                motionValues.current.set(n.id, {
                    x: motionValue(n.cx),
                    y: motionValue(n.cy)
                });
            } else {
                const mv = motionValues.current.get(n.id)!;
                mv.x.set(n.cx);
                mv.y.set(n.cy);
            }

            // Initialize Target Sizes (Include Buffer)
            targetSizes.current.set(n.id, { width: n.width + PHYSICS_BUFFER, height: n.height + PHYSICS_BUFFER });

            // Create Matter Body (Include Buffer)
            const body = Matter.Bodies.rectangle(n.cx, n.cy, n.width + PHYSICS_BUFFER, n.height + PHYSICS_BUFFER, {
                label: n.id,
                inertia: PHYSICS_CONFIG.INERTIA,
                friction: PHYSICS_CONFIG.FRICTION,
                frictionAir: PHYSICS_CONFIG.FRICTION_AIR,
                restitution: PHYSICS_CONFIG.RESTITUTION,
                chamfer: PHYSICS_CONFIG.CHAMFER,
                slop: PHYSICS_CONFIG.SLOP
            });

            bodies.current.set(n.id, body);
            Matter.World.add(world, body);
        });

        // 3. Start Runner (The "God Tier" Loop)
        if (!runner.current) {
            runner.current = Matter.Runner.create();
        } else {
            Matter.Runner.stop(runner.current);
        }

        Matter.Events.on(engine.current, 'afterUpdate', () => {
            const state = useStore.getState();
            let hasChanges = false;

            bodies.current.forEach((body, id) => {
                // A. Lerp Size (The "Push" Animation)
                // [Shiro] HARD LOCK ROTATION
                // Reset angle to 0 to ensure bounds are calculated for an upright rectangle
                Matter.Body.setAngle(body, 0);
                Matter.Body.setAngularVelocity(body, 0);

                // [Shiro] Skip size lerping if node is being manually resized
                if (!resizingNodes.current.has(id)) {
                    const target = targetSizes.current.get(id);
                    if (target) {
                        // Current bounds width/height
                        const currentWidth = body.bounds.max.x - body.bounds.min.x;
                        const currentHeight = body.bounds.max.y - body.bounds.min.y;

                        // Check if we need to resize
                        if (Math.abs(currentWidth - target.width) > 1 || Math.abs(currentHeight - target.height) > 1) {
                            // Calculate scale factor needed
                            // We want to lerp towards target, but Matter.Body.scale is multiplicative.
                            // So we calculate the desired size for this frame.
                            const lerpFactor = 0.1;
                            const newWidth = currentWidth + (target.width - currentWidth) * lerpFactor;
                            const newHeight = currentHeight + (target.height - currentHeight) * lerpFactor;

                            // Apply scale
                            const scaleX = newWidth / currentWidth;
                            const scaleY = newHeight / currentHeight;

                            Matter.Body.scale(body, scaleX, scaleY);

                            // [Shiro] Re-lock properties just in case
                            Matter.Body.setInertia(body, Infinity);
                        }
                    }
                }

                // B. Sync Position to MotionValues
                // [Shiro] JITTER FIX: Do NOT sync position if we are manually resizing.
                // The mouse controls the position 100%. Physics should not fight back.
                if (!resizingNodes.current.has(id)) {
                    const mv = motionValues.current.get(id);
                    if (mv) {
                        mv.x.set(body.position.x);
                        mv.y.set(body.position.y);
                    }
                }

                // C. Persistence Check (Only when resting and not interacting)
                if (!isInteracting.current && body.speed < 0.1) {
                    const savedNode = state.nodes[id];
                    if (savedNode && (Math.abs(savedNode.cx - body.position.x) > 1 || Math.abs(savedNode.cy - body.position.y) > 1)) {
                        state.updateNode(id, { cx: body.position.x, cy: body.position.y });
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                // console.log('[Physics] Positions synced to store');
            }
        });

        Matter.Runner.run(runner.current, engine.current);

    }, []);

    // --- Interaction Methods ---
    const dragStart = useCallback((id: NodeId, x: number, y: number) => {
        isInteracting.current = true;
        const body = bodies.current.get(id);
        if (body && engine.current) {
            Matter.Sleeping.set(body, false);

            // [Shiro] Constraint Dragging
            // We create a stiff spring connecting the mouse to the body center.
            // This allows the physics engine to solve collisions naturally.
            dragConstraint.current = Matter.Constraint.create({
                label: 'dragConstraint',
                pointA: { x, y },
                bodyB: body,
                pointB: { x: 0, y: 0 }, // Grab at center
                stiffness: 0.8,  // High stiffness for responsive drag
                damping: 0.1,
                length: 0,
                render: { visible: false }
            });

            Matter.World.add(engine.current.world, dragConstraint.current);

            // Increase friction slightly to prevent wild swinging, but not too much
            body.frictionAir = 0.1;
        }
    }, []);

    const dragMove = useCallback((id: NodeId, x: number, y: number) => {
        const body = bodies.current.get(id);

        // If we have a drag constraint, we're dragging. Update the constraint's anchor point.
        if (dragConstraint.current) {
            dragConstraint.current.pointA = { x, y };

            // Sync MotionValues from physics for visual responsiveness during drag
            if (body) {
                const mv = motionValues.current.get(id);
                if (mv) {
                    mv.x.set(body.position.x);
                    mv.y.set(body.position.y);
                }
            }
        }
        // If there's no constraint, this call is coming from a resize operation.
        // In this case, we need to directly set the physics body's position.
        else if (body) {
            Matter.Body.setPosition(body, { x, y });
        }
    }, []);

    const dragEnd = useCallback((id: NodeId) => {
        isInteracting.current = false;

        // [Shiro] Stop tracking resize
        resizingNodes.current.delete(id);

        if (dragConstraint.current && engine.current) {
            Matter.World.remove(engine.current.world, dragConstraint.current);
            dragConstraint.current = null;
        }

        const body = bodies.current.get(id);
        if (body) {
            // FIX: Use the constant, not 0.02
            body.frictionAir = PHYSICS_CONFIG.FRICTION_AIR;
        }
    }, []);

const notifyResize = (id: NodeId, width: number, height: number, anchor: boolean = false, isManual: boolean = false) => {
  const body = bodies.current.get(id);
  if (!body) return;

  // 1. UPDATE TARGET SIZE (Always needed for the physics loop)
  targetSizes.current.set(id, { width: width + PHYSICS_BUFFER, height: height + PHYSICS_BUFFER });

  // 2. MASS LOGIC (Who pushes who?)
  if (anchor) {
    // Active or Resizing: BE THE ANCHOR.
    // High mass ensures this node barely moves when colliding with others.
    // We use a fixed high mass (e.g. 5000) rather than Infinity so it's "very heavy" but valid physics.
    Matter.Body.setMass(body, 5000);
    Matter.Body.setInertia(body, Infinity);
  } else {
    // Inactive: BE THE PAWN.
    // Reset density to default (0.001) to return to normal, light weight.
    Matter.Body.setDensity(body, 0.001);
    // Ensure inertia is still locked to prevent rotation
    Matter.Body.setInertia(body, Infinity);
  }

  // 3. UPDATE LOGIC (How do we change size?)
  if (isManual) {
    // MANUAL: Instant update to follow mouse cursor perfectly
    resizingNodes.current.add(id); // Pause physics lerp for this node
    
    Matter.Body.setAngle(body, 0);
    Matter.Body.setAngularVelocity(body, 0);
    const currentWidth = body.bounds.max.x - body.bounds.min.x;
    const currentHeight = body.bounds.max.y - body.bounds.min.y;
    
    // Protect against zero-division or invalid bounds
    if (currentWidth > 0 && currentHeight > 0) {
       const scaleX = width / currentWidth;
       const scaleY = height / currentHeight;
       Matter.Body.scale(body, scaleX, scaleY);
    }
  } else {
    // AUTOMATIC: Let the physics loop handle the resize (Lerp)
    // This allows the engine to push neighbors away frame-by-frame as we grow.
    resizingNodes.current.delete(id); // Resume physics lerp
    
    // Wake up this body and neighbors to ensure they react to the expansion
    Matter.Sleeping.set(body, false);
  }
};

    const getMotionValues = (id: NodeId) => {
        if (!motionValues.current.has(id)) {
            motionValues.current.set(id, { x: motionValue(0), y: motionValue(0) });
        }
        return motionValues.current.get(id)!;
    };

    return { initPhysics, dragStart, dragMove, dragEnd, notifyResize, getMotionValues };
};
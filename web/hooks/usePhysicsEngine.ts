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
    const motionValues = useRef(new Map<NodeId, { x: MotionValue<number>, y: MotionValue<number>, width: MotionValue<number>, height: MotionValue<number> }>());
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
                    y: motionValue(n.cy),
                    width: motionValue(n.width),
                    height: motionValue(n.height)
                });
            } else {
                const mv = motionValues.current.get(n.id)!;
                mv.x.set(n.cx);
                mv.y.set(n.cy);
                mv.width.set(n.width);
                mv.height.set(n.height);
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

                // If manual resizing (Static), SKIP lerp logic entirely.
                if (resizingNodes.current.has(id)) return;

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
                            // [Shiro] INCREASED LERP: 0.1 -> 0.4
                            const lerpFactor = 0.4;
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

    const notifyResize = (
        id: NodeId,
        width: number,
        height: number,
        anchor: boolean = false,
        isManual: boolean = false,
        // Add optional position override
        position?: { x: number, y: number }
    ) => {
        const body = bodies.current.get(id);
        const mv = motionValues.current.get(id);

        // [Shiro] Sync Visuals immediately to MotionValues!
        // This ensures connections and other listeners get the new size instantly.
        if (mv) {
            mv.width.set(width);
            mv.height.set(height);
        }

        if (!body) return;

        targetSizes.current.set(id, { width: width + PHYSICS_BUFFER, height: height + PHYSICS_BUFFER });

        if (isManual) {
            resizingNodes.current.add(id);

            // 1. Make Static (Hand of God)
            Matter.Body.setStatic(body, true);

            // 2. ATOMIC UPDATE: Position THEN Scale
            // If we have a new position from the resize logic, apply it here.
            // This replaces the need to call onDragMove() separately during resize.
            if (position) {
                Matter.Body.setPosition(body, position);
                // Also update position MV
                if (mv) {
                    mv.x.set(position.x);
                    mv.y.set(position.y);
                }
            }

            Matter.Body.setAngle(body, 0);

            // Scale logic...
            const currentWidth = body.bounds.max.x - body.bounds.min.x;
            const currentHeight = body.bounds.max.y - body.bounds.min.y;
            if (currentWidth > 0 && currentHeight > 0) {
                const scaleX = width / currentWidth;
                const scaleY = height / currentHeight;
                Matter.Body.scale(body, scaleX, scaleY);
            }

            // 3. Wake Neighbors
            bodies.current.forEach(b => {
                if (b.label !== id) Matter.Sleeping.set(b, false);
            });

        } else {
            // --- AUTOMATIC MODE: DYNAMIC (PHYSICS) ---
            resizingNodes.current.delete(id);

            // 1. MAKE DYNAMIC.
            Matter.Body.setStatic(body, false);

            // 2. Set Mass/Density based on Anchor/Pawn state
            if (anchor) {
                Matter.Body.setMass(body, 5000); // Heavy King
            } else {
                Matter.Body.setDensity(body, 0.001); // Light Pawn
            }
            Matter.Body.setInertia(body, Infinity);
            Matter.Sleeping.set(body, false);

            // [Shiro] WAKE NEIGHBORS!
            // If we expand, we need everyone to wake up and move immediately.
            bodies.current.forEach(b => {
                if (b.label !== id) Matter.Sleeping.set(b, false);
            });
        }
    };

    const getMotionValues = useCallback((id: NodeId) => {
        if (!motionValues.current.has(id)) {
            motionValues.current.set(id, {
                x: motionValue(0),
                y: motionValue(0),
                width: motionValue(300), // Default, will be overwritten by init or notify
                height: motionValue(300)
            });
        }
        return motionValues.current.get(id)!;
    }, []);

    return { initPhysics, dragStart, dragMove, dragEnd, notifyResize, getMotionValues };
};
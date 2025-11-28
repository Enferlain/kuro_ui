import { useEffect, useRef, useCallback } from 'react';
import { forceSimulation, SimulationNodeDatum } from 'd3-force';
import { motionValue, MotionValue } from 'framer-motion';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';

// Data stored for each node in the physics world
interface PhysicsNode extends SimulationNodeDatum {
    id: NodeId;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const usePhysicsEngine = () => {
    const simulation = useRef<any>(null);
    const nodesRef = useRef<PhysicsNode[]>([]);
    const motionValues = useRef(new Map<NodeId, { x: MotionValue<number>, y: MotionValue<number> }>());

    // Track if user is currently interacting to prevent auto-save conflicts
    const isInteracting = useRef(false);

    // [Shiro] New Update Action
    const updateNode = useStore.getState().updateNode;

    // --- Custom Rectangular Collision Force ---
    function forceRectCollide() {
        let nodes: PhysicsNode[];
        let strength = 0.8; // [Shiro] Lower strength for softer collisions
        let iterations = 1;
        const padding = 20; // Spacing between nodes
        const MAX_FORCE = 2.0; // [Shiro] Clamp maximum force per tick to prevent jumping

        function force(alpha: number) {
            for (let k = 0; k < iterations; k++) {
                for (let i = 0, n = nodes.length; i < n; i++) {
                    const a = nodes[i];
                    if (a.x === undefined || a.y === undefined) continue;

                    for (let j = i + 1; j < n; j++) {
                        const b = nodes[j];
                        if (b.x === undefined || b.y === undefined) continue;

                        const hw1 = (a.width + padding) / 2;
                        const hh1 = (a.height + padding) / 2;
                        const hw2 = (b.width + padding) / 2;
                        const hh2 = (b.height + padding) / 2;

                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const minDx = hw1 + hw2;
                        const minDy = hh1 + hh2;

                        if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
                            const overlapX = minDx - Math.abs(dx);
                            const overlapY = minDy - Math.abs(dy);

                            // Resolve collision
                            if (overlapX < overlapY) {
                                let pushX = overlapX * 0.5 * strength * alpha * Math.sign(dx);

                                // [Shiro] CLAMP FORCE
                                pushX = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, pushX));

                                // If 'a' is being dragged (fx set), 'b' takes full force
                                if (a.fx !== undefined && a.fx !== null) {
                                    b.vx = (b.vx || 0) + (pushX * 2);
                                    b.x += pushX * 2;
                                } else if (b.fx !== undefined && b.fx !== null) {
                                    a.vx = (a.vx || 0) - (pushX * 2);
                                    a.x -= pushX * 2;
                                } else {
                                    // Both free
                                    a.vx = (a.vx || 0) - pushX;
                                    a.x -= pushX;
                                    b.vx = (b.vx || 0) + pushX;
                                    b.x += pushX;
                                }
                            } else {
                                let pushY = overlapY * 0.5 * strength * alpha * Math.sign(dy);

                                // [Shiro] CLAMP FORCE
                                pushY = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, pushY));

                                if (a.fy !== undefined && a.fy !== null) {
                                    b.vy = (b.vy || 0) + (pushY * 2);
                                    b.y += pushY * 2;
                                } else if (b.fy !== undefined && b.fy !== null) {
                                    a.vy = (a.vy || 0) - (pushY * 2);
                                    a.y -= pushY * 2;
                                } else {
                                    a.vy = (a.vy || 0) - pushY;
                                    a.y -= pushY;
                                    b.vy = (b.vy || 0) + pushY;
                                    b.y += pushY;
                                }
                            }
                        }
                    }
                }
            }
        }

        function initialize(n: PhysicsNode[]) { nodes = n; }
        function setStrength(s: number) { strength = s; return forceInstance; }
        function setIterations(i: number) { iterations = i; return forceInstance; }

        const forceInstance: any = force;
        forceInstance.initialize = initialize;
        forceInstance.strength = setStrength;
        forceInstance.iterations = setIterations;

        return forceInstance;
    }

    // --- Initialization ---
    const initPhysics = useCallback((initialNodes: { id: NodeId, cx: number, cy: number, width: number, height: number }[]) => {
        // Initialize MotionValues if missing
        initialNodes.forEach(n => {
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
        });

        nodesRef.current = initialNodes.map(n => ({
            ...n,
            x: n.cx,
            y: n.cy,
            vx: 0,
            vy: 0
        }));

        if (simulation.current) simulation.current.stop();

        simulation.current = forceSimulation(nodesRef.current)
            .force("collide", forceRectCollide().strength(0.5).iterations(2)) // Softer collisions
            .velocityDecay(0.15) // [Shiro] Low friction = Sliding! (0.6 was too heavy)
            .alphaTarget(0)
            .on("tick", () => {
                nodesRef.current.forEach(node => {
                    const mv = motionValues.current.get(node.id);
                    if (mv && node.x !== undefined && node.y !== undefined) {
                        mv.x.set(node.x);
                        mv.y.set(node.y);
                    }
                });
            })
            // [Shiro] SLIDING PERSISTENCE: Save only when physics settles
            .on("end", () => {
                if (isInteracting.current) return; // Don't save if user is still holding mouse

                const state = useStore.getState();
                let hasChanges = false;

                nodesRef.current.forEach(node => {
                    const savedNode = state.nodes[node.id];
                    // Only save if moved > 1px
                    if (savedNode && (Math.abs(savedNode.cx - node.x) > 1 || Math.abs(savedNode.cy - node.y) > 1)) {
                        state.updateNode(node.id, { cx: node.x, cy: node.y });
                        hasChanges = true;
                    }
                });

                if (hasChanges) console.log('[Physics] Simulation rested. Positions saved.');
            });

        // Warm up slightly
        simulation.current.alpha(0.5).restart();
    }, []);

    // --- Interaction Methods ---
    const dragStart = (id: NodeId, x: number, y: number) => {
        isInteracting.current = true;
        const node = nodesRef.current.find(n => n.id === id);
        if (node && simulation.current) {
            simulation.current.alphaTarget(0.3).restart();
            node.fx = x;
            node.fy = y;
            // Clear velocity so it doesn't fly off instantly
            node.vx = 0;
            node.vy = 0;

            const mv = motionValues.current.get(id);
            if (mv) { mv.x.set(x); mv.y.set(y); }
        }
    };

    const dragMove = (id: NodeId, x: number, y: number) => {
        const node = nodesRef.current.find(n => n.id === id);
        if (node) {
            node.fx = x;
            node.fy = y;
            const mv = motionValues.current.get(id);
            if (mv) { mv.x.set(x); mv.y.set(y); }
        }
    };

    const dragEnd = (id: NodeId) => {
        isInteracting.current = false;
        const node = nodesRef.current.find(n => n.id === id);
        if (node && simulation.current) {
            simulation.current.alphaTarget(0);

            // [Shiro] SLIDING LOGIC:
            // We set fx/fy to null. D3 will use the momentum (vx/vy) calculated 
            // during the drag to slide the node.
            node.fx = null;
            node.fy = null;

            // We do NOT save to store here. 
            // The simulation.on('end') handler will save it when it stops sliding.
        }
    };

    const notifyResize = (id: NodeId, width: number, height: number, anchor: boolean = false) => {
        const node = nodesRef.current.find(n => n.id === id);
        if (node && simulation.current) {
            if (Math.abs(node.width - width) < 1 && Math.abs(node.height - height) < 1) return;

            node.width = width;
            node.height = height;

            // [Shiro] ANCHOR LOGIC:
            // If anchor is true (Manual Interaction), we temporarily fix the node in place
            // so it pushes others away instead of moving itself.
            if (anchor) {
                node.fx = node.x;
                node.fy = node.y;

                // Release anchor after a short delay to allow settling
                setTimeout(() => {
                    node.fx = null;
                    node.fy = null;
                }, 500);
            }

            // Re-initialize collision force
            const collideForce = simulation.current.force("collide");
            if (collideForce && collideForce.initialize) {
                collideForce.initialize(nodesRef.current);
            }

            // [Shiro] SMOOTH EXPANSION: 
            // Use alpha(0.5) instead of 1.0. 
            // 1.0 is a violent explosion. 0.5 is a firm shove.
            simulation.current.alpha(0.5).restart();
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
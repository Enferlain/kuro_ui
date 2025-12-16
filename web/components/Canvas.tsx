'use client';

import { Sidebar } from './Sidebar';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useTransform, MotionValue, useSpring } from 'framer-motion';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';
import { Node } from './Node';
import { calculateLodState } from '../lib/lod';
import { NODE_REGISTRY, GRAPH_EDGES } from './NodeRegistry';
import { Save, MousePointer2, ZoomIn, ZoomOut, Activity, LayoutGrid } from 'lucide-react';
import { Minimap } from './Minimap';
import { CanvasControls } from './CanvasControls';
import { VoidIcon } from './VoidIcon';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';
import { CANVAS_BOUNDS, LOD_WIDTH, LOD_HEIGHT } from '../lib/constants';

// Connection line component (Animated SVG)
const Connection: React.FC<{
    sourcePos: { x: MotionValue<number>, y: MotionValue<number> },
    targetPos: { x: MotionValue<number>, y: MotionValue<number> },
    sourceDim: { width: MotionValue<number>, height: MotionValue<number> },
    targetDim: { width: MotionValue<number>, height: MotionValue<number> },
    isSourceLOD: boolean,
    isTargetLOD: boolean,
    isSourceMinimized: boolean,
    isTargetMinimized: boolean,
    isZoomedOut: boolean,
    sourceId: NodeId,
    targetId: NodeId,
    draggedNode: NodeId | null
}> = React.memo(({ sourcePos, targetPos, sourceDim, targetDim, isSourceLOD, isTargetLOD, isSourceMinimized, isTargetMinimized, isZoomedOut, sourceId, targetId, draggedNode }) => {

    // [Shiro] REACTIVE ANIMATION FIX:
    // 1. We start with the Physics MotionValue (Live Width)
    // 2. We transform it: If LOD is active, return LOD_WIDTH instead.
    // 3. We wrap it in a Spring: The spring follows the Transform result.
    // This removes the need for useEffects and manual sets, effectively "piping" the data.

    const finalSourceWidth = useTransform(sourceDim.width, (w) => isSourceLOD ? LOD_WIDTH : w);
    const finalTargetWidth = useTransform(targetDim.width, (w) => isTargetLOD ? LOD_WIDTH : w);

    const springConfig = { stiffness: 400, damping: 30 };
    const animatedSourceWidth = useSpring(finalSourceWidth, springConfig);
    const animatedTargetWidth = useSpring(finalTargetWidth, springConfig);

    const x1 = useTransform([sourcePos.x, animatedSourceWidth], ([x, w]: number[]) => {
        // [Shiro] CENTER LOGIC: Right side = Center + Width/2
        return x + w / 2;
    });

    const y1 = useTransform(sourcePos.y, y => y); // Center Y is just Y

    const x2 = useTransform([targetPos.x, animatedTargetWidth], ([x, w]: number[]) => {
        // [Shiro] CENTER LOGIC: Left side = Center - Width/2
        return x - w / 2;
    });

    const y2 = useTransform(targetPos.y, y => {
        return y;
    });

    // Derived values for Label
    const cx = useTransform([x1, x2], ([v1, v2]: number[]) => (v1 + v2) / 2);
    const cy = useTransform([y1, y2], ([v1, v2]: number[]) => (v1 + v2) / 2);
    const angle = useTransform([x1, y1, x2, y2], ([lx1, ly1, lx2, ly2]: number[]) => {
        const dx = lx2 - lx1;
        const dy = ly2 - ly1;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    });

    // Visibility check for very zoomed out view
    const opacity = isZoomedOut ? 0.15 : 0.4;

    return (
        <g>
            <motion.line
                className="stroke-brand-primary"
                strokeWidth="1"
                style={{
                    x1, y1, x2, y2,
                    filter: "drop-shadow(0 0 2px rgba(139,92,246,0.4))"
                } as any}
                initial={{ opacity: 0 }}
                animate={{ opacity }}
                transition={{ duration: 0.5 }}
            />
            {/* Label */}
            <motion.g
                style={{ x: cx, y: cy }}
                initial={{ opacity: 0 }}
                animate={{ opacity }}
                transition={{ duration: 0.5 }}
            >
                <foreignObject x="-20" y="-10" width="40" height="20" style={{ overflow: 'visible' }}>
                    <motion.div
                        className="flex items-center justify-center w-full h-full"
                        style={{ rotate: angle }}
                    >
                        <div className="bg-canvas-bg border border-brand-primary/30 text-[10px] text-brand-primary px-1.5 py-0.5 rounded-full font-mono tracking-widest whitespace-nowrap">
                            LINK
                        </div>
                    </motion.div>
                </foreignObject>
            </motion.g>
        </g>
    )
});

Connection.displayName = 'Connection';

const FPSCounter: React.FC = () => {
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let rafId: number;

        const loop = () => {
            const now = performance.now();
            frameCount++;

            if (now - lastTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
            }

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <div className="absolute top-6 right-6 z-50 pointer-events-none select-none">
            <div className="bg-node-bg/80 backdrop-blur-sm border border-node-border text-node-dim font-mono text-[10px] px-3 py-1 rounded-full flex items-center gap-2">
                <Activity size={10} className={fps < 30 ? "text-red-500" : "text-emerald-500"} />
                <span className={fps < 30 ? "text-red-400" : "text-node-dim"}>{fps} FPS</span>
            </div>
        </div>
    );
};

export const Canvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // [Shiro] New Selectors
    const translation = useStore(state => state.translation);
    const scale = useStore(state => state.scale);
    const nodes = useStore(state => state.nodes); // New Map

    // Actions
    const setTranslation = useStore(state => state.setTranslation);
    const setTransform = useStore(state => state.setTransform);
    const activeNode = useStore(state => state.activeNode);
    const draggedNode = useStore(state => state.draggedNode);
    const canvasMode = useStore(state => state.canvasMode);
    const lodImmuneNodes = useStore(state => state.lodImmuneNodes);
    const minimizedNodes = useStore(state => state.minimizedNodes);
    const setActiveNode = useStore(state => state.setActiveNode);
    const resetLayout = useStore(state => state.resetLayout);
    const setHighlightedField = useStore(state => state.setHighlightedField);
    const setViewportSize = useStore(state => state.setViewportSize);
    const viewportSize = useStore(state => state.viewportSize);
    const hasHydrated = useStore(state => state.hasHydrated);
    const initNodes = useStore(state => state.initNodes); // New

    // [Shiro] Optimization: Create stable hashes to prevent re-init on simple position updates
    const nodesHash = Object.keys(nodes).sort().join(',');
    const minHash = minimizedNodes.sort().join(',');
    const immuneHash = lodImmuneNodes.sort().join(',');

    // [Shiro] Prevent render until nodes are ready
    const isReady = hasHydrated && Object.keys(nodes).length > 0;

    const { initPhysics, getMotionValues, dragStart, dragMove, dragEnd, notifyResize } = usePhysicsEngine();

    // [Shiro] Initialize Store Nodes from Registry
    useEffect(() => {
        if (hasHydrated) {
            initNodes(NODE_REGISTRY);
        }
    }, [hasHydrated, initNodes]);

    // [Shiro] Optimization: Only re-init if the *existence* of nodes changes (Added/Removed).
    // We do NOT listen to minimize/immune/scale here. The Node component handles those updates via onResize.

    // [Shiro] Initialize Physics
    useEffect(() => {
        if (!hasHydrated) return;

        // Wait for nodes to be populated
        if (Object.keys(nodes).length === 0) return;

        const initialNodes = Object.values(NODE_REGISTRY).map(conf => {
            const nodeState = nodes[conf.id];
            if (!nodeState) return null;

            // [Shiro] INITIAL LOAD FIX: Calculate LOD-aware size from the start
            // This prevents the node from initializing at full size and then shrinking.
            const { isZoomedOut } = calculateLodState({
                scale,
                viewportSize,
                dimensions: { width: nodeState.width, height: nodeState.height },
                isActive: conf.id === activeNode,
                isImmune: lodImmuneNodes.includes(conf.id),
                isMinimized: minimizedNodes.includes(conf.id),
            });

            const initialWidth = isZoomedOut ? LOD_WIDTH : nodeState.width;
            const initialHeight = isZoomedOut ? LOD_HEIGHT : nodeState.height;

            return {
                id: conf.id,
                cx: nodeState.cx,
                cy: nodeState.cy,
                width: initialWidth,
                height: initialHeight
            };
        }).filter(Boolean) as any[];

        initPhysics(initialNodes);

        // [Shiro] CRITICAL FIX: Only run on hydration or structural changes (adding/removing nodes).
        // Removing 'minHash', 'activeNode', 'scale' prevents the engine from resetting during interaction.
    }, [hasHydrated, nodesHash, initPhysics, 'boundary-v2']);

    useEffect(() => {
        const handleResize = () => {
            setViewportSize(window.innerWidth, window.innerHeight);
        };
        // Initial set
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setViewportSize]);

    const [isDragging, setIsDragging] = useState(false);
    const isZoomedOut = scale < 0.55;

    // Interaction state for dynamic optimization
    const [isInteracting, setIsInteracting] = useState(false);
    const interactionTimeout = useRef<NodeJS.Timeout | null>(null);


    const triggerInteraction = () => {
        setIsInteracting(true);
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
        interactionTimeout.current = setTimeout(() => {
            setIsInteracting(false);
        }, 150);
    };

    // [Shiro] Viewport Clamp Helper
    const getClampedTranslation = (tx: number, ty: number, s: number) => {
        const { width: vw, height: vh } = viewportSize;

        // X Axis
        const minTx = vw - CANVAS_BOUNDS.maxX * s;
        const maxTx = -CANVAS_BOUNDS.minX * s;
        let finalTx = tx;

        if (minTx > maxTx) {
            // Viewport larger than world: Center it
            finalTx = (minTx + maxTx) / 2;
        } else {
            finalTx = Math.max(minTx, Math.min(maxTx, tx));
        }

        // Y Axis
        const minTy = vh - CANVAS_BOUNDS.maxY * s;
        const maxTy = -CANVAS_BOUNDS.minY * s;
        let finalTy = ty;

        if (minTy > maxTy) {
            finalTy = (minTy + maxTy) / 2;
        } else {
            finalTy = Math.max(minTy, Math.min(maxTy, ty));
        }

        return { x: finalTx, y: finalTy };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        // Blur any active input when clicking the canvas
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setActiveNode(null);

        setIsDragging(true);
        triggerInteraction();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startTransX = translation.x;
        const startTransY = translation.y;

        // Capture scale at the start of the drag to ensure consistency
        const currentScale = scale;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            triggerInteraction();

            // Calculate new position
            const newX = startTransX + dx;
            const newY = startTransY + dy;

            // [Shiro] Apply Boundary Clamp using CANVAS_BOUNDS
            const { x: clampedX, y: clampedY } = getClampedTranslation(newX, newY, currentScale);

            setTranslation(clampedX, clampedY);
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleWheel = (e: React.WheelEvent) => {
        triggerInteraction();

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = direction > 0 ? 1.1 : 0.9;

        let newScale = scale * factor;
        newScale = Math.min(Math.max(newScale, 0.1), 5);

        const worldX = (mx - translation.x) / scale;
        const worldY = (my - translation.y) / scale;

        const newTx = mx - worldX * newScale;
        const newTy = my - worldY * newScale;

        const { x: clampedTx, y: clampedTy } = getClampedTranslation(newTx, newTy, newScale);
        setTransform(clampedTx, clampedTy, newScale);

    };

    const manualZoom = (direction: 1 | -1) => {
        triggerInteraction();

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mx = rect.width / 2;
        const my = rect.height / 2;

        const factor = direction > 0 ? 1.2 : 1 / 1.2;
        let newScale = scale * factor;
        newScale = Math.min(Math.max(newScale, 0.1), 5);

        const worldX = (mx - translation.x) / scale;
        const worldY = (my - translation.y) / scale;

        const newTx = mx - worldX * newScale;
        const newTy = my - worldY * newScale;

        const { x: clampedTx, y: clampedTy } = getClampedTranslation(newTx, newTy, newScale);
        setTransform(clampedTx, clampedTy, newScale);

    };

    // Helper to determine LOD state for a node (used for connections)
    const getNodeLODState = useCallback((id: NodeId) => {
        const node = nodes[id];
        if (!node) return false;

        const dim = { width: node.width, height: node.height };
        const isActive = id === activeNode;
        const isImmune = lodImmuneNodes.includes(id);
        const isMinimized = minimizedNodes.includes(id);

        const { isZoomedOut } = calculateLodState({
            scale,
            viewportSize,
            dimensions: dim,
            isActive,
            isImmune,
            isMinimized
        });
        return isZoomedOut;
    }, [nodes, activeNode, lodImmuneNodes, minimizedNodes, scale, viewportSize]);

    // Dynamic Grid Opacity
    // Fade from 0.2 (at scale 0.5) down to 0 (at scale 0.1)
    const gridOpacity = Math.max(0, Math.min(0.2, (scale - 0.1) * 0.5));

    // Memoize Node elements
    const nodeElements = useMemo(() => {
        return Object.values(NODE_REGISTRY).map((config) => (
            <Node
                key={config.id}
                id={config.id}
                title={config.title}
                icon={config.icon}
                // PHYSICS PROPS
                motionValues={getMotionValues(config.id)} // Now contains width/height too
                onDragStart={(x, y) => canvasMode === 'pointer' && dragStart(config.id, x, y)}
                onDragMove={(x, y) => dragMove(config.id, x, y)}
                onDragEnd={() => dragEnd(config.id)}
                onResize={(
                    w,
                    h,
                    anchor = false,
                    isManual = false,
                    position?: { x: number; y: number }
                ) => notifyResize(config.id, w, h, anchor, isManual, position)}
            >
                <config.component />
            </Node>
        ));
    }, [getMotionValues, dragStart, dragMove, dragEnd, notifyResize]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-screen overflow-hidden bg-canvas-bg relative select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onPointerDown={handlePointerDown}
            onWheel={handleWheel}
        >
            <Sidebar />
            {/* Infinite Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: gridOpacity,
                    backgroundImage: `
                linear-gradient(#45415E 1px, transparent 1px), 
                linear-gradient(90deg, #45415E 1px, transparent 1px)
            `,
                    backgroundPosition: `${translation.x}px ${translation.y}px`,
                    backgroundSize: `${40 * scale}px ${40 * scale}px`,
                }}
            />

            {/* World Container */}
            <motion.div
                className="absolute top-0 left-0 w-full h-full origin-top-left"
                animate={{
                    x: translation.x,
                    y: translation.y,
                    scale: scale
                }}
                transition={{
                    type: "tween",
                    duration: 0
                }}
            >
                {/* Connections (Dynamically Generated) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {useMemo(() => GRAPH_EDGES.map((edge) => {
                        const sourceNodeState = nodes[edge.source];
                        const targetNodeState = nodes[edge.target];

                        if (!sourceNodeState || !targetNodeState) return null;

                        const sourceMotionValues = getMotionValues(edge.source);
                        const targetMotionValues = getMotionValues(edge.target);

                        const isSourceLOD = getNodeLODState(edge.source);
                        const isTargetLOD = getNodeLODState(edge.target);
                        const isSourceMinimized = minimizedNodes.includes(edge.source);
                        const isTargetMinimized = minimizedNodes.includes(edge.target);

                        return (
                            <Connection
                                key={`${edge.source}-${edge.target}`}
                                sourcePos={sourceMotionValues}
                                targetPos={targetMotionValues}
                                sourceDim={{ width: sourceMotionValues.width, height: sourceMotionValues.height }}
                                targetDim={{ width: targetMotionValues.width, height: targetMotionValues.height }}
                                isSourceLOD={isSourceLOD}
                                isTargetLOD={isTargetLOD}
                                isSourceMinimized={isSourceMinimized}
                                isTargetMinimized={isTargetMinimized}
                                isZoomedOut={isZoomedOut}
                                sourceId={edge.source}
                                targetId={edge.target}
                                draggedNode={draggedNode}
                            />
                        );
                    }), [nodes, getNodeLODState, minimizedNodes, getMotionValues, isZoomedOut, draggedNode])}
                </svg>

                {/* Nodes (Memoized) */}
                {isReady && nodeElements}
            </motion.div>

            {/* HUD / Overlay UI */}
            <div className="absolute top-6 left-6 pointer-events-none select-none">
                <h1 className="text-4xl font-bold text-node-text tracking-tighter drop-shadow-xl flex items-center gap-2">
                    KURO
                    <VoidIcon className="w-10 h-10" />
                </h1>
            </div>

            <FPSCounter />

            {/* Controls */}
            {/* Moved to CanvasControls Component */}

            {/* Bottom Right Container */}
            <div className="absolute bottom-6 right-6 w-60 flex flex-col gap-4 pointer-events-none z-50">
                <div className="pointer-events-auto">
                    <Minimap />
                </div>
                <div className="pointer-events-auto">
                    <CanvasControls
                        onReset={() => {
                            resetLayout(NODE_REGISTRY);
                            const defaultNodes = Object.values(NODE_REGISTRY).map(conf => ({
                                id: conf.id,
                                cx: conf.defaultPosition.x + conf.defaultDimensions.width / 2,
                                cy: conf.defaultPosition.y + conf.defaultDimensions.height / 2,
                                width: conf.defaultDimensions.width,
                                height: conf.defaultDimensions.height
                            }));
                            initPhysics(defaultNodes);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};


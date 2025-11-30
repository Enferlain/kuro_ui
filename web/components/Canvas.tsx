'use client';

import { Sidebar } from './Sidebar';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useTransform, MotionValue, useSpring } from 'framer-motion';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';
import { Node, LOD_WIDTH, LOD_HEIGHT } from './Node';
import { calculateLodState } from '../lib/lod';
import { NODE_REGISTRY, GRAPH_EDGES, SEARCH_INDEX, SearchItem } from './NodeRegistry';
import { Save, MousePointer2, ZoomIn, ZoomOut, Activity, LayoutGrid, Search, X, CornerDownRight } from 'lucide-react';
import { VoidIcon } from './VoidIcon';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';

// Base limit for panning. This will be scaled dynamically.
const BASE_PAN_LIMIT = 5000;

// Approximate geometric center of the initial layout (MinX: 100, MaxX: 1800, MinY: 100, MaxY: 800)
const CONTENT_CENTER_X = 950;
const CONTENT_CENTER_Y = 450;

// Connection line component (Animated SVG)
const Connection: React.FC<{
    sourcePos: { x: MotionValue<number>, y: MotionValue<number> },
    targetPos: { x: MotionValue<number>, y: MotionValue<number> },
    sourceDim: { width: number, height: number },
    targetDim: { width: number, height: number },
    isSourceLOD: boolean,
    isTargetLOD: boolean,
    isSourceMinimized: boolean,
    isTargetMinimized: boolean,
    isZoomedOut: boolean,
    sourceId: NodeId,
    targetId: NodeId,
    draggedNode: NodeId | null
}> = React.memo(({ sourcePos, targetPos, sourceDim, targetDim, isSourceLOD, isTargetLOD, isSourceMinimized, isTargetMinimized, isZoomedOut, sourceId, targetId, draggedNode }) => {

    // Calculate Handles based on LOD/Minimized state
    // POSITIONS ARE NOW CENTERS (Physics Engine)

    // [Shiro] ANIMATION FIX: Use springs for the width to match Node animation
    const targetSourceWidth = (isSourceLOD || isSourceMinimized) ? LOD_WIDTH : sourceDim.width;
    const targetTargetWidth = (isTargetLOD || isTargetMinimized) ? LOD_WIDTH : targetDim.width;

    const springConfig = { stiffness: 400, damping: 30 };
    const animatedSourceWidth = useSpring(targetSourceWidth, springConfig);
    const animatedTargetWidth = useSpring(targetTargetWidth, springConfig);

    // Sync springs when targets change
    useEffect(() => {
        animatedSourceWidth.set(targetSourceWidth);
        animatedTargetWidth.set(targetTargetWidth);
    }, [targetSourceWidth, targetTargetWidth, animatedSourceWidth, animatedTargetWidth]);

    const x1 = useTransform([sourcePos.x, animatedSourceWidth], ([x, w]) => {
        // [Shiro] CENTER LOGIC: Right side = Center + Width/2
        return x + w / 2;
    });

    const y1 = useTransform(sourcePos.y, y => y); // Center Y is just Y

    const x2 = useTransform([targetPos.x, animatedTargetWidth], ([x, w]) => {
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
                stroke="#8b5cf6"
                strokeWidth="1"
                style={{
                    x1, y1, x2, y2,
                    filter: "drop-shadow(0 0 2px rgba(139,92,246,0.4))"
                } as any}
                initial={false}
                animate={{ opacity }}
                transition={{ duration: 0.5 }}
            />
            {/* Label */}
            <motion.g
                style={{ x: cx, y: cy }}
                initial={false}
                animate={{ opacity }}
                transition={{ duration: 0.5 }}
            >
                <foreignObject x="-20" y="-10" width="40" height="20" style={{ overflow: 'visible' }}>
                    <motion.div
                        className="flex items-center justify-center w-full h-full"
                        style={{ rotate: angle }}
                    >
                        <div className="bg-[#181625] border border-violet-500/30 text-[10px] text-violet-400 px-1.5 py-0.5 rounded-full font-mono tracking-widest whitespace-nowrap">
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
            <div className="bg-[#232034]/80 backdrop-blur-sm border border-[#3E3B5E] text-[#948FB2] font-mono text-[10px] px-3 py-1 rounded-full flex items-center gap-2">
                <Activity size={10} className={fps < 30 ? "text-red-500" : "text-emerald-500"} />
                <span className={fps < 30 ? "text-red-400" : "text-[#948FB2]"}>{fps} FPS</span>
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

            // Initial calculation only. Subsequent updates happen via notifyResize.
            const dim = { width: nodeState.width, height: nodeState.height };

            // We default to the stored dimensions. 
            // The Node component will immediately report the correct visual size (LOD/Minimized) on mount.
            return {
                id: conf.id,
                cx: nodeState.cx,
                cy: nodeState.cy,
                width: dim.width,
                height: dim.height
            };
        }).filter(Boolean) as any[];

        console.log('[Canvas] Initializing Physics with nodes:', initialNodes);
        initPhysics(initialNodes);

        // [Shiro] CRITICAL FIX: Only run on hydration or structural changes (adding/removing nodes).
        // Removing 'minHash', 'activeNode', 'scale' prevents the engine from resetting during interaction.
    }, [hasHydrated, nodesHash, initPhysics]);

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

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const results = SEARCH_INDEX.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
    }, [searchQuery]);

    const handleSearchResultClick = (item: SearchItem) => {
        const node = nodes[item.nodeId];
        const rect = containerRef.current?.getBoundingClientRect();

        if (node && rect) {
            // Calculate center of the target Node
            const targetX = node.cx;
            const targetY = node.cy;

            // Center of the screen
            const screenCX = rect.width / 2;
            const screenCY = rect.height / 2;

            // Target scale
            const targetScale = 1; // Zoom in to default 1

            // Calculate new translation to put Node in center
            // screenCX = targetX * scale + tx
            // tx = screenCX - targetX * scale
            const newTx = screenCX - targetX * targetScale;
            const newTy = screenCY - targetY * targetScale;

            setTransform(newTx, newTy, targetScale);
            setActiveNode(item.nodeId);
            setHighlightedField(item.id);

            // Close search but keep highlight for a moment
            setIsSearchOpen(false);

            // Auto-remove highlight after 3 seconds
            setTimeout(() => {
                setHighlightedField(null);
            }, 3000);
        }
    };

    const triggerInteraction = () => {
        setIsInteracting(true);
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
        interactionTimeout.current = setTimeout(() => {
            setIsInteracting(false);
        }, 150);
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

            // Dynamic Clamping
            const dynamicRadius = BASE_PAN_LIMIT * currentScale;
            const centerOffsetX = CONTENT_CENTER_X * (1 - currentScale);
            const centerOffsetY = CONTENT_CENTER_Y * (1 - currentScale);

            const minX = centerOffsetX - dynamicRadius;
            const maxX = centerOffsetX + dynamicRadius;
            const minY = centerOffsetY - dynamicRadius;
            const maxY = centerOffsetY + dynamicRadius;

            const clampedX = Math.max(minX, Math.min(maxX, newX));
            const clampedY = Math.max(minY, Math.min(maxY, newY));

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

        setTransform(newTx, newTy, newScale);
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

        setTransform(newTx, newTy, newScale);
    };

    // Helper to determine LOD state for a node (used for connections)
    const getNodeLODState = (id: NodeId) => {
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
    };

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
                motionValues={getMotionValues(config.id)}
                onDragStart={(x, y) => dragStart(config.id, x, y)}
                onDragMove={(x, y) => dragMove(config.id, x, y)}
                onDragEnd={() => dragEnd(config.id)}
                onResize={(w, h, anchor) => notifyResize(config.id, w, h, anchor)}
            >
                <config.component />
            </Node>
        ));
    }, [getMotionValues, dragStart, dragMove, dragEnd, notifyResize]); // Dependencies are stable from hook

    return (
        <div
            ref={containerRef}
            className={`w-full h-screen overflow-hidden bg-[#181625] relative select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
                    willChange: isInteracting ? 'background-position, background-size' : 'auto'
                }}
            />

            {/* World Container */}
            <motion.div
                className="absolute top-0 left-0 w-full h-full origin-top-left"
                style={{ willChange: isInteracting ? 'transform' : 'auto' }}
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
                    {GRAPH_EDGES.map((edge) => {
                        const sourceNode = nodes[edge.source];
                        const targetNode = nodes[edge.target];

                        if (!sourceNode || !targetNode) return null;

                        const isSourceLOD = getNodeLODState(edge.source);
                        const isTargetLOD = getNodeLODState(edge.target);
                        const isSourceMinimized = minimizedNodes.includes(edge.source);
                        const isTargetMinimized = minimizedNodes.includes(edge.target);

                        return (
                            <Connection
                                key={`${edge.source}-${edge.target}`}
                                sourcePos={getMotionValues(edge.source)}
                                targetPos={getMotionValues(edge.target)}
                                sourceDim={{ width: sourceNode.width, height: sourceNode.height }}
                                targetDim={{ width: targetNode.width, height: targetNode.height }}
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
                    })}
                </svg>

                {/* Nodes (Memoized) */}
                {isReady && nodeElements}
            </motion.div>

            {/* HUD / Overlay UI */}
            <div className="absolute top-6 left-6 pointer-events-none select-none">
                <h1 className="text-4xl font-bold text-[#E2E0EC] tracking-tighter drop-shadow-xl flex items-center gap-2">
                    KURO
                    <VoidIcon className="w-10 h-10" />
                </h1>
            </div>

            <FPSCounter />

            {/* Controls */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-4 pointer-events-auto items-start">

                {/* Search Popup */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="w-64 bg-[#232034]/95 backdrop-blur-xl border border-[#3E3B5E] rounded-sm shadow-2xl overflow-hidden mb-2"
                        >
                            <div className="p-2 border-b border-[#3E3B5E] flex items-center gap-2">
                                <Search size={14} className="text-[#5B5680]" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search parameters..."
                                    className="bg-transparent border-none outline-none text-sm text-[#E2E0EC] placeholder-[#5B5680] w-full font-mono"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button onClick={() => setIsSearchOpen(false)} className="text-[#5B5680] hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                            {searchResults.length > 0 ? (
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            className="px-3 py-2 hover:bg-[#3E3B5E]/50 cursor-pointer flex items-center justify-between group"
                                            onClick={() => handleSearchResultClick(item)}
                                        >
                                            <span className="text-xs text-[#E2E0EC] font-mono">{item.label}</span>
                                            <CornerDownRight size={12} className="text-[#5B5680] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="p-3 text-center text-[10px] text-[#5B5680] font-mono uppercase">No matches found</div>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2 bg-[#232034]/80 backdrop-blur-md border border-[#3E3B5E] p-1 rounded-lg shadow-2xl">
                    <button
                        onClick={() => resetLayout(NODE_REGISTRY)}
                        className="p-2 hover:bg-[#3E3B5E] rounded text-[#948FB2] hover:text-white transition"
                        title="Reset Layout"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button onClick={() => manualZoom(1)} className="p-2 hover:bg-[#3E3B5E] rounded text-[#948FB2] hover:text-white transition">
                        <ZoomIn size={18} />
                    </button>
                    <button onClick={() => manualZoom(-1)} className="p-2 hover:bg-[#3E3B5E] rounded text-[#948FB2] hover:text-white transition">
                        <ZoomOut size={18} />
                    </button>
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 rounded transition ${isSearchOpen ? 'bg-[#3E3B5E] text-white' : 'hover:bg-[#3E3B5E] text-[#948FB2] hover:text-white'}`}
                        title="Search Nodes"
                    >
                        <Search size={18} />
                    </button>
                </div>

                <div className="bg-[#232034]/80 backdrop-blur-md text-[#948FB2] text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg border border-[#3E3B5E] flex items-center gap-2 shadow-xl">
                    <MousePointer2 size={10} />
                    <span>Nav: Drag & Scroll</span>
                </div>
            </div>


        </div>
    );
};
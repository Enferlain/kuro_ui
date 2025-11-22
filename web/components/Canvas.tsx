'use client';

import { Sidebar } from './Sidebar';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../lib/store';
import { IslandId } from '../lib/types';
import { Island, LOD_WIDTH, LOD_HEIGHT } from './Island';
import { calculateLodState } from '../lib/lod';
import { ISLAND_REGISTRY, GRAPH_EDGES, SEARCH_INDEX, SearchItem } from './islandRegistry';
import { Save, MousePointer2, ZoomIn, ZoomOut, Activity, LayoutGrid, Search, X, CornerDownRight } from 'lucide-react';

// Base limit for panning. This will be scaled dynamically.
const BASE_PAN_LIMIT = 5000;

// Approximate geometric center of the initial layout (MinX: 100, MaxX: 1800, MinY: 100, MaxY: 800)
const CONTENT_CENTER_X = 950;
const CONTENT_CENTER_Y = 450;

// Connection line component (Animated)
const Connection: React.FC<{ x1: number, y1: number, x2: number, y2: number, isZoomedOut: boolean }> = React.memo(({ x1, y1, x2, y2, isZoomedOut }) => {
    const isIslandDragging = useStore(state => state.isIslandDragging);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Visibility check for very zoomed out view
    const opacity = isZoomedOut ? 0.15 : 0.4;

    // Synced transition to match Island movement/resizing
    const transition = {
        duration: isIslandDragging ? 0 : 0.3,
        type: "tween" as const,
        ease: "circOut" as const
    };

    return (
        <motion.div
            className="absolute h-[1px] bg-violet-500 pointer-events-none origin-left shadow-[0_0_8px_rgba(139,92,246,0.4)]"
            animate={{
                top: y1,
                left: x1,
                width: length,
                rotate: angle,
                opacity: opacity
            }}
            transition={{
                top: transition,
                left: transition,
                width: transition,
                rotate: transition,
                opacity: { duration: 0.5 }
            }}
        >
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#181625] border border-violet-500/30 text-[10px] text-violet-400 px-1.5 py-0.5 rounded-full font-mono tracking-widest" style={{ transform: `rotate(${-angle}deg)` }}>
                LINK
            </div>
        </motion.div>
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

    // Optimized Selectors
    const translation = useStore(state => state.translation);
    const scale = useStore(state => state.scale);
    const islandPositions = useStore(state => state.islandPositions);
    const islandDimensions = useStore(state => state.islandDimensions);

    const setTranslation = useStore(state => state.setTranslation);
    const setTransform = useStore(state => state.setTransform);
    const activeIsland = useStore(state => state.activeIsland);
    const lodImmuneIslands = useStore(state => state.lodImmuneIslands);
    const setActiveIsland = useStore(state => state.setActiveIsland);
    const resetLayout = useStore(state => state.resetLayout);
    const setHighlightedField = useStore(state => state.setHighlightedField);
    const setViewportSize = useStore(state => state.setViewportSize);
    const viewportSize = useStore(state => state.viewportSize);

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
        const islandPos = islandPositions[item.islandId];
        const islandDim = islandDimensions[item.islandId] || { width: 300, height: 200 };
        const rect = containerRef.current?.getBoundingClientRect();

        if (islandPos && rect) {
            // Calculate center of the target island
            const targetX = islandPos.x + islandDim.width / 2;
            const targetY = islandPos.y + islandDim.height / 2;

            // Center of the screen
            const screenCX = rect.width / 2;
            const screenCY = rect.height / 2;

            // Target scale
            const targetScale = 1; // Zoom in to default 1

            // Calculate new translation to put island in center
            // screenCX = targetX * scale + tx
            // tx = screenCX - targetX * scale
            const newTx = screenCX - targetX * targetScale;
            const newTy = screenCY - targetY * targetScale;

            setTransform(newTx, newTy, targetScale);
            setActiveIsland(item.islandId);
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
        setActiveIsland(null);

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

    // Helper to get connection handles (Left and Right edges)
    const getOutputHandle = (id: IslandId) => {
        const pos = islandPositions[id];
        const dim = islandDimensions[id] || { width: 300, height: 200 };

        let effectiveX = pos.x;
        let effectiveY = pos.y;
        let effectiveWidth = dim.width;
        let effectiveHeight = dim.height;

        const isActive = id === activeIsland;
        const isImmune = lodImmuneIslands.includes(id);

        const { isZoomedOut: isIslandLOD } = calculateLodState({
            scale,
            viewportSize,
            dimensions: dim,
            isActive,
            isImmune
        });

        if (isIslandLOD) {
            effectiveWidth = LOD_WIDTH;
            effectiveHeight = LOD_HEIGHT;
            effectiveX += (dim.width - LOD_WIDTH) / 2;
            effectiveY += (dim.height - LOD_HEIGHT) / 2;
        }

        return { x: effectiveX + effectiveWidth, y: effectiveY + effectiveHeight / 2 };
    };

    const getInputHandle = (id: IslandId) => {
        const pos = islandPositions[id];
        const dim = islandDimensions[id] || { width: 300, height: 200 };

        let effectiveX = pos.x;
        let effectiveY = pos.y;
        // let effectiveWidth = dim.width; 
        let effectiveHeight = dim.height;

        const isActive = id === activeIsland;
        const isImmune = lodImmuneIslands.includes(id);

        const { isZoomedOut: isIslandLOD } = calculateLodState({
            scale,
            viewportSize,
            dimensions: dim,
            isActive,
            isImmune
        });

        if (isIslandLOD) {
            // effectiveWidth = LOD_WIDTH;
            effectiveHeight = LOD_HEIGHT;
            effectiveX += (dim.width - LOD_WIDTH) / 2;
            effectiveY += (dim.height - LOD_HEIGHT) / 2;
        }

        return { x: effectiveX, y: effectiveY + effectiveHeight / 2 };
    };

    // Dynamic Grid Opacity
    // Fade from 0.2 (at scale 0.5) down to 0 (at scale 0.1)
    const gridOpacity = Math.max(0, Math.min(0.2, (scale - 0.1) * 0.5));

    // Memoize Island elements to prevent re-rendering them when Canvas re-renders (e.g. during drag)
    // unless the registry itself changes (which it doesn't).
    // The Island components themselves are React.memo'd and subscribe to the store for their own updates.
    const islandElements = useMemo(() => {
        return Object.values(ISLAND_REGISTRY).map((config) => (
            <Island key={config.id} id={config.id} title={config.title} icon={config.icon}>
                <config.component />
            </Island>
        ));
    }, []);

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
                {GRAPH_EDGES.map((edge) => {
                    const p1 = getOutputHandle(edge.source);
                    const p2 = getInputHandle(edge.target);
                    return <Connection key={`${edge.source}-${edge.target}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} isZoomedOut={isZoomedOut} />;
                })}

                {/* Islands (Memoized) */}
                {islandElements}
            </motion.div>

            {/* HUD / Overlay UI */}
            <div className="absolute top-6 left-6 pointer-events-none select-none">
                <h1 className="text-4xl font-bold text-[#E2E0EC] tracking-tighter drop-shadow-xl">
                    KURO
                </h1>
                <p className="text-[#948FB2] text-xs font-mono uppercase tracking-[0.2em] mt-1">Void Configurator</p>
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
                        onClick={resetLayout}
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

            <div className="absolute bottom-6 right-6 pointer-events-auto">
                <button className="group bg-[#E2E0EC] hover:bg-white text-[#181625] font-bold py-3 px-6 rounded-sm shadow-[0_0_20px_rgba(139,92,246,0.2)] flex items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                    <Save className="w-4 h-4 group-hover:text-violet-600 transition-colors" />
                    <span className="tracking-tight">EXPORT CONFIG</span>
                </button>
            </div>
        </div>
    );
};

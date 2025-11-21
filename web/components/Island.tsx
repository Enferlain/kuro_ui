'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../lib/store';
import { IslandId } from '../lib/types';
import { LucideIcon, Scaling } from 'lucide-react';

interface IslandProps {
    id: IslandId;
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

// Exporting constants so Canvas can match calculations
export const LOD_WIDTH = 200;
export const LOD_HEIGHT = 128;

export const Island: React.FC<IslandProps> = React.memo(({ id, title, icon: Icon, children }) => {
    // Optimize Selectors
    const position = useStore((state) => state.islandPositions[id]);
    const dimensions = useStore((state) => state.islandDimensions[id]);
    const isActive = useStore((state) => state.activeIsland === id);
    const anyActive = useStore((state) => !!state.activeIsland);
    const isZoomedOut = useStore((state) => state.scale < 0.55);
    const moveIsland = useStore((state) => state.moveIsland);
    const resizeIsland = useStore((state) => state.resizeIsland);
    const setActiveIsland = useStore((state) => state.setActiveIsland);
    const setIsIslandDragging = useStore((state) => state.setIsIslandDragging);

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [contentScale, setContentScale] = useState(1);

    // Use stored dimensions or fallback if not yet initialized
    const currentWidth = dimensions?.width || 300;
    const currentHeight = dimensions?.height || 300;

    // Calculate offset to center the LOD card relative to the full island size
    const xOffset = isZoomedOut ? (currentWidth - LOD_WIDTH) / 2 : 0;
    const yOffset = isZoomedOut ? (currentHeight - LOD_HEIGHT) / 2 : 0;

    const opacity = (isActive || isDragging || isResizing || !anyActive) ? 1 : 0.4;
    const zIndex = isActive || isDragging || isResizing ? 50 : 10;

    // --- DRAG LOGIC (Moves the Island) ---
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startIslandX = position.x;
        const startIslandY = position.y;

        const currentScale = useStore.getState().scale;

        setIsDragging(true);
        setIsIslandDragging(true);

        let hasMoved = false;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const rawDx = moveEvent.clientX - startMouseX;
            const rawDy = moveEvent.clientY - startMouseY;

            if (!hasMoved && (Math.abs(rawDx) > 5 || Math.abs(rawDy) > 5)) {
                hasMoved = true;
            }

            if (hasMoved) {
                const dx = rawDx / currentScale;
                const dy = rawDy / currentScale;
                moveIsland(id, startIslandX + dx, startIslandY + dy);
            }
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            setIsIslandDragging(false);

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            if (!hasMoved) {
                setActiveIsland(id);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    // --- RESIZE LOGIC (Scales the Island) ---
    const handleResizeDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startWidth = currentWidth;
        const startHeight = currentHeight;
        const currentScale = useStore.getState().scale;

        setIsResizing(true);

        const handleResizeMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const rawDx = moveEvent.clientX - startMouseX;
            const rawDy = moveEvent.clientY - startMouseY;

            const newWidth = Math.max(250, startWidth + (rawDx / currentScale));
            const newHeight = Math.max(200, startHeight + (rawDy / currentScale));

            resizeIsland(id, newWidth, newHeight);
        };

        const handleResizeUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', handleResizeMove);
            window.removeEventListener('pointerup', handleResizeUp);
        };

        window.addEventListener('pointermove', handleResizeMove);
        window.addEventListener('pointerup', handleResizeUp);
    };

    // --- CONTENT SCALE LOGIC (Draggable Icon) ---
    const handleScaleDrag = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startY = e.clientY;
        const startScale = contentScale;

        document.body.style.cursor = 'ns-resize';

        const handleMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const dy = startY - moveEvent.clientY; // Drag Up = Positive = Zoom In
            const sensitivity = 0.005;
            const newScale = Math.min(Math.max(startScale + (dy * sensitivity), 0.5), 2.0);
            setContentScale(newScale);
        };

        const handleUp = () => {
            document.body.style.cursor = '';
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    const geometryTransition = {
        type: "tween" as const,
        duration: (isDragging || isResizing) ? 0 : 0.3,
        ease: "circOut" as const
    };

    return (
        <motion.div
            className="absolute"
            animate={{
                x: position.x + xOffset,
                y: position.y + yOffset,
                width: isZoomedOut ? LOD_WIDTH : currentWidth,
                height: isZoomedOut ? LOD_HEIGHT : currentHeight,
                opacity,
                zIndex,
                scale: isActive || isDragging ? 1.02 : 1
            }}
            transition={{
                x: geometryTransition,
                y: geometryTransition,
                width: geometryTransition,
                height: geometryTransition,
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
            }}
        >
            {/* Connection Knobs - Always visible, position managed by motion container scaling */}
            <div>
                {/* Left Knob (Input) */}
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#181625] border border-violet-500/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center">
                    <div className="w-1 h-1 bg-violet-500 rounded-[1px] opacity-80" />
                </div>
                {/* Right Knob (Output) */}
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#181625] border border-violet-500/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center">
                    <div className="w-1 h-1 bg-violet-500 rounded-[1px] opacity-80" />
                </div>
            </div>

            <div
                onPointerDown={(e) => {
                    e.stopPropagation();
                }}
                className={`
            relative overflow-hidden h-full w-full
            rounded-sm backdrop-blur-2xl 
            border transition-colors duration-500
            ${isActive
                        ? 'bg-[#232034]/95 border-violet-500/50 shadow-[0_0_50px_rgba(139,92,246,0.1)]'
                        : isZoomedOut
                            ? 'bg-[#232034]/60 border-[#3E3B5E] hover:bg-[#232034]/80 hover:border-[#565275]'
                            : 'bg-[#232034]/90 border-[#3E3B5E] hover:border-[#565275]'
                    }
        `}
            >
                <AnimatePresence mode="popLayout">
                    {isZoomedOut ? (
                        /* LOD View */
                        <motion.div
                            key="lod"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            onPointerDown={handlePointerDown}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-grab active:cursor-grabbing select-none p-4"
                        >
                            <Icon size={32} className="text-violet-500" />
                            <h2 className="text-lg font-bold text-[#E2E0EC] tracking-widest uppercase text-center leading-none font-mono">
                                {title}
                            </h2>
                        </motion.div>
                    ) : (
                        /* Detailed View */
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col"
                        >
                            {/* Header */}
                            <div
                                onPointerDown={handlePointerDown}
                                className={`
                            flex items-center justify-between p-3 border-b select-none touch-none shrink-0
                            ${isActive ? 'border-violet-500/20 bg-violet-500/5' : 'border-[#3E3B5E] bg-[#3E3B5E]/10'}
                            cursor-grab active:cursor-grabbing
                        `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-sm ${isActive ? 'bg-violet-600 text-white' : 'bg-[#3E3B5E] text-[#948FB2]'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <h2 className={`text-sm font-bold tracking-widest uppercase font-mono ${isActive ? 'text-white' : 'text-[#948FB2]'}`}>
                                        {title}
                                    </h2>
                                </div>

                                {/* Content Scale Control */}
                                <div
                                    className="p-1.5 rounded-md hover:bg-[#3E3B5E] cursor-ns-resize text-[#5B5680] hover:text-white transition-colors"
                                    onPointerDown={handleScaleDrag}
                                    title="Drag up/down to scale content"
                                >
                                    <Scaling size={14} />
                                </div>
                            </div>

                            {/* Content */}
                            <div
                                className="p-4 cursor-default flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar relative"
                                onWheel={(e) => {
                                    e.stopPropagation(); // Always stop canvas zoom

                                    // Ctrl + Scroll to Zoom content
                                    if (e.ctrlKey || e.metaKey) {
                                        e.preventDefault();
                                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                                        setContentScale(prev => Math.min(Math.max(prev + delta, 0.5), 2.0));
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        transform: `scale(${contentScale})`,
                                        transformOrigin: 'top left',
                                        width: `${100 / contentScale}%`
                                    }}
                                >
                                    {children}
                                </div>
                            </div>

                            {/* Resize Handle */}
                            <div
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-[#5B5680] hover:text-violet-500 transition-colors z-20"
                                onPointerDown={handleResizeDown}
                            >
                                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                                    <path d="M6 6L6 0L0 6H6Z" />
                                </svg>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});

Island.displayName = 'Island';

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionValue, useMotionValue } from 'framer-motion';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';
import { LucideIcon, Scaling, Pin, Minimize2, Maximize2 } from 'lucide-react';
import { useNodeLOD } from '../hooks/useNodeLOD';

interface NodeProps {
    id: NodeId;
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    // Physics Props
    motionValues: { x: MotionValue<number>, y: MotionValue<number> };
    onDragStart: (x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
    onDragEnd: () => void;
    onResize: (w: number, h: number, anchor?: boolean) => void;
}

export const LOD_WIDTH = 200;
export const LOD_HEIGHT = 128;

export const Node: React.FC<NodeProps> = React.memo(({
    id,
    title,
    icon: Icon,
    children,
    motionValues,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResize
}) => {
    // Selectors
    const nodeState = useStore((state) => state.nodes[id]);
    const isActive = useStore((state) => state.activeNode === id);
    const anyActive = useStore((state) => !!state.activeNode);
    const updateNode = useStore((state) => state.updateNode);
    const setActiveNode = useStore((state) => state.setActiveNode);
    const setIsNodeDragging = useStore((state) => state.setIsNodeDragging);
    const lodImmuneNodes = useStore((state) => state.lodImmuneNodes);
    const toggleLodImmunity = useStore((state) => state.toggleLodImmunity);
    const minimizedNodes = useStore((state) => state.minimizedNodes);
    const toggleMinimize = useStore((state) => state.toggleMinimize);
    const setDraggedNode = useStore((state) => state.setDraggedNode);

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [contentScale, setContentScale] = useState(1);

    // [Shiro] PERFORMANCE FIX: Use MotionValues for Width/Height 
    // This allows us to resize visuals instantly without triggering React Renders
    const currentWidth = nodeState?.width || 300;
    const currentHeight = nodeState?.height || 300;

    const widthMV = useMotionValue(currentWidth);
    const heightMV = useMotionValue(currentHeight);

    // Sync MotionValues when store changes (e.g. Layout Reset or manual input)
    // We only sync if we are NOT currently resizing to avoid fighting the user
    useEffect(() => {
        if (!isResizing) {
            widthMV.set(currentWidth);
            heightMV.set(currentHeight);
        }
    }, [currentWidth, currentHeight, isResizing, widthMV, heightMV]);

    // LOD Logic
    const { isZoomedOut, autoCollapse } = useNodeLOD(id, { width: currentWidth, height: currentHeight }, isResizing);
    const isImmune = lodImmuneNodes.includes(id);
    const isMinimized = minimizedNodes.includes(id);

    const effectiveWidth = isZoomedOut ? LOD_WIDTH : currentWidth;
    const effectiveHeight = isZoomedOut ? LOD_HEIGHT : currentHeight;

    // Notify Physics Engine when visual size changes (LOD / Minimize)
    useEffect(() => {
        if (!isResizing) {
            // [Shiro] ANCHOR LOGIC:
            // If this node is ACTIVE (User Selected), we anchor it so it pushes others away.
            // If it's NOT active (Zoom/LOD), we don't anchor, so everyone slides mutually.
            onResize(effectiveWidth, effectiveHeight, isActive);
        }
    }, [effectiveWidth, effectiveHeight, onResize, isResizing, isActive]);

    const opacity = (isActive || isDragging || isResizing || !anyActive) ? 1 : 0.4;
    const zIndex = isActive || isDragging || isResizing ? 50 : 10;

    // --- DRAG LOGIC ---
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startNodeX = motionValues.x.get();
        const startNodeY = motionValues.y.get();
        const currentScale = useStore.getState().scale;

        setDraggedNode(id);
        setIsDragging(true);
        setIsNodeDragging(true);
        onDragStart(startNodeX, startNodeY);

        if (!isActive) setActiveNode(null);

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
                onDragMove(startNodeX + dx, startNodeY + dy);
            }
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            setIsNodeDragging(false);
            setDraggedNode(null);
            onDragEnd(); // Release for sliding

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            if (!hasMoved) {
                setActiveNode(id);
                if (isMinimized && !autoCollapse) toggleMinimize(id);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    // --- RESIZE LOGIC (OPTIMIZED) ---
    const handleResizeDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;

        // Capture starting values
        const startWidth = widthMV.get();
        const startHeight = heightMV.get();
        const currentScale = useStore.getState().scale;
        const startCenterX = motionValues.x.get();
        const startCenterY = motionValues.y.get();

        setIsResizing(true);
        setDraggedNode(id);

        const handleResizeMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const rawDx = moveEvent.clientX - startMouseX;
            const rawDy = moveEvent.clientY - startMouseY;

            // 1. Calculate New Dimensions
            const desiredWidth = Math.max(250, startWidth + (rawDx / currentScale));
            const desiredHeight = Math.max(200, startHeight + (rawDy / currentScale));

            const deltaWidth = desiredWidth - startWidth;
            const deltaHeight = desiredHeight - startHeight;

            // 2. Calculate New Center (Right/Bottom resize only)
            // To keep Top-Left fixed, the center must move by half the delta
            const newCenterX = startCenterX + deltaWidth / 2;
            const newCenterY = startCenterY + deltaHeight / 2;

            // 3. Update Visuals (MotionValues) - NO REACT RENDER
            widthMV.set(desiredWidth);
            heightMV.set(desiredHeight);
            motionValues.x.set(newCenterX);
            motionValues.y.set(newCenterY);

            // 4. Update Physics - NO REACT RENDER
            onDragMove(newCenterX, newCenterY); // Move body
            onResize(desiredWidth, desiredHeight); // Update collider
        };

        const handleResizeUp = () => {
            setIsResizing(false);
            setDraggedNode(null);
            onDragEnd(); // Release physics lock

            // 5. SAVE TO STORE (Persistence) - Triggers Render
            updateNode(id, {
                width: widthMV.get(),
                height: heightMV.get(),
                cx: motionValues.x.get(),
                cy: motionValues.y.get()
            });

            window.removeEventListener('pointermove', handleResizeMove);
            window.removeEventListener('pointerup', handleResizeUp);
        };

        window.addEventListener('pointermove', handleResizeMove);
        window.addEventListener('pointerup', handleResizeUp);
    };

    // --- CONTENT SCALE LOGIC ---
    const handleScaleDrag = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startY = e.clientY;
        const startScale = contentScale;
        document.body.style.cursor = 'ns-resize';
        const handleMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const dy = startY - moveEvent.clientY;
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

    return (
        <motion.div
            className="absolute"
            style={{
                x: motionValues.x,
                y: motionValues.y,
                translateX: '-50%',
                translateY: '-50%',
                // [Shiro] Use MotionValues for smooth resize
                width: isZoomedOut ? LOD_WIDTH : widthMV,
                height: isZoomedOut ? LOD_HEIGHT : heightMV,
                opacity,
                zIndex,
                scale: isActive || isDragging ? 1.02 : 1
            }}
            // Remove 'animate' for width/height to let MotionValues take control during interaction
            animate={{
                translateX: '-50%',
                translateY: '-50%',
                opacity,
                zIndex,
                scale: isActive || isDragging ? 1.02 : 1
            }}
        >
            {/* Connection Knobs */}
            <div>
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#181625] border border-violet-500/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center">
                    <div className="w-1 h-1 bg-violet-500 rounded-[1px] opacity-80" />
                </div>
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#181625] border border-violet-500/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center">
                    <div className="w-1 h-1 bg-violet-500 rounded-[1px] opacity-80" />
                </div>
            </div>

            <div
                onPointerDown={(e) => { e.stopPropagation(); }}
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
                            {isMinimized && (
                                <div className="absolute top-2 right-2 text-[#5B5680]" title="Manually Minimized">
                                    <Minimize2 size={16} />
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col"
                        >
                            <div className={`flex items-center justify-between p-3 border-b select-none touch-none shrink-0 ${isActive ? 'border-violet-500/20 bg-violet-500/5' : 'border-[#3E3B5E] bg-[#3E3B5E]/10'}`}>
                                <div className="flex items-center gap-3 flex-1 cursor-grab active:cursor-grabbing" onPointerDown={handlePointerDown}>
                                    <div className={`p-1.5 rounded-sm ${isActive ? 'bg-violet-600 text-white' : 'bg-[#3E3B5E] text-[#948FB2]'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <h2 className={`text-sm font-bold tracking-widest uppercase font-mono ${isActive ? 'text-white' : 'text-[#948FB2]'}`}>{title}</h2>
                                </div>
                                <div className="flex items-center gap-1 pl-2">
                                    <div className={`p-1.5 rounded-md cursor-pointer transition-colors ${isImmune ? 'opacity-30 cursor-not-allowed text-[#5B5680]' : (isMinimized && !isActive) ? 'text-violet-400 hover:text-violet-300' : 'text-[#5B5680] hover:text-white'}`}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            if (isImmune) return;
                                            if (isActive) { if (!isMinimized) toggleMinimize(id); setActiveNode(null); } else { toggleMinimize(id); }
                                        }}>
                                        {(isMinimized && !isActive) ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                    </div>
                                    <div className={`p-1.5 rounded-md cursor-pointer transition-colors ${isImmune ? 'text-violet-400 hover:text-violet-300' : 'text-[#5B5680] hover:text-white'}`}
                                        onPointerDown={(e) => { e.stopPropagation(); if (!isImmune && isMinimized) { toggleMinimize(id); } toggleLodImmunity(id); }}>
                                        <Pin size={14} className={isImmune ? "fill-current" : ""} />
                                    </div>
                                    <div className="p-1.5 rounded-md hover:bg-[#3E3B5E] cursor-ns-resize text-[#5B5680] hover:text-white transition-colors" onPointerDown={handleScaleDrag}>
                                        <Scaling size={14} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 cursor-default flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar relative"
                                onWheel={(e) => { e.stopPropagation(); if (e.ctrlKey || e.metaKey) { e.preventDefault(); const delta = e.deltaY > 0 ? -0.1 : 0.1; setContentScale(prev => Math.min(Math.max(prev + delta, 0.5), 2.0)); } }}>
                                <div style={{ transform: `scale(${contentScale})`, transformOrigin: 'top left', width: `${100 / contentScale}%` }}>
                                    {children}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-[#5B5680] hover:text-violet-500 transition-colors z-20" onPointerDown={handleResizeDown}>
                                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><path d="M6 6L6 0L0 6H6Z" /></svg>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});

Node.displayName = 'Node';
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionValue, useMotionValue, useSpring } from 'framer-motion';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';
import { LucideIcon, Scaling, Pin, Minimize2, Maximize2 } from 'lucide-react';
import { useNodeLOD } from '../hooks/useNodeLOD';
import { calculateLodState } from '../lib/lod';

interface NodeProps {
    id: NodeId;
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    // Physics Props
    motionValues: { x: MotionValue<number>, y: MotionValue<number>, width: MotionValue<number>, height: MotionValue<number> };
    onDragStart: (x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
    onDragEnd: () => void;
    onResize: (w: number, h: number, anchor?: boolean, isManual?: boolean, position?: { x: number, y: number }) => void;
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

    const isImmune = lodImmuneNodes.includes(id);
    const isMinimized = minimizedNodes.includes(id);

    // [Shiro] INITIAL LOAD FIX: Add selectors for initial LOD calculation
    const scale = useStore((state) => state.scale);
    const viewportSize = useStore((state) => state.viewportSize);

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [contentScale, setContentScale] = useState(1);

    // [Shiro] PERFORMANCE FIX: Use useSpring for Width/Height 
    // This allows us to resize visuals smoothly without triggering React Renders
    // and without manually calling animate()
    const currentWidth = nodeState?.width || 300;
    const currentHeight = nodeState?.height || 300;

    // [Shiro] JELLY FIX: Use shared maps from Physics as Source!
    // We update 'Source' (MotionValues) immediately. 'Spring' follows 'Source'.
    // During manual resize, we use 'Source' directly to avoid lag.

    // NOTE: motionValues.width/height are ALREADY initialized by usePhysicsEngine
    // But we should ensure they start at the right spot?
    // usePhysicsEngine initPhysics sets them.

    const springConfig = { stiffness: 400, damping: 30 };
    const widthSpring = useSpring(motionValues.width, springConfig);
    const heightSpring = useSpring(motionValues.height, springConfig);

    // The problematic useEffect that fought LOD logic has been removed.
    // The useEffect below that uses `effectiveWidth` is now the single source of truth for size updates.

    // LOD Logic
    const { isZoomedOut, autoCollapse } = useNodeLOD(id, { width: currentWidth, height: currentHeight }, isResizing);

    const effectiveWidth = isZoomedOut ? LOD_WIDTH : currentWidth;
    const effectiveHeight = isZoomedOut ? LOD_HEIGHT : currentHeight;

    // Notify Physics Engine when visual size changes (LOD / Minimize)
    useEffect(() => {
        if (!isResizing) {
            // [Shiro] ANIMATION FIX: Just set the spring target!
            // The spring will handle the interpolation smoothly.
            motionValues.width.set(effectiveWidth);
            motionValues.height.set(effectiveHeight);

            // [Shiro] ANCHOR LOGIC:
            // If this node is ACTIVE (User Selected), we anchor it so it pushes others away.
            // If it's NOT active (Zoom/LOD), we don't anchor, so everyone slides mutually.
            // anchor = isActive (If active, be heavy)
            // isManual = false (Let physics handle the expansion)
            onResize(effectiveWidth, effectiveHeight, isActive, false);
        }
    }, [effectiveWidth, effectiveHeight, onResize, isResizing, isActive, motionValues]);

    // [Shiro] JUMP FIX: If initializing as:
    // 1. Active or Immune -> Jump to Full Size (Skip Expansion)
    // 2. Zoomed Out -> Jump to LOD Size (Skip Shrink)
    useEffect(() => {
        if (isActive || isImmune) {
            widthSpring.jump(currentWidth);
            heightSpring.jump(currentHeight);
        } else if (isZoomedOut) {
            widthSpring.jump(LOD_WIDTH);
            heightSpring.jump(LOD_HEIGHT);
        }
    }, []);

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
        // [Shiro] JELLY FIX: Sync source to current spring value to prevent jump
        motionValues.width.set(widthSpring.get());
        motionValues.height.set(heightSpring.get());

        const startWidth = motionValues.width.get();
        const startHeight = motionValues.height.get();
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

            // 2. Calculate New Center (Right/Bottom resize ONLY)
            // Logic: To keep Top-Left fixed, we must shift the center by +delta/2
            // If we grew by 100px, center moves +50px right.
            // Old Top-Left: (Cx - W/2)
            // New Top-Left: (Cx + dW/2) - (W + dW)/2 
            //             = Cx + dW/2 - W/2 - dW/2 
            //             = Cx - W/2  <-- STAYS SAME!
            const newCenterX = startCenterX + deltaWidth / 2;
            const newCenterY = startCenterY + deltaHeight / 2;

            // 3. Update Visuals
            // [Shiro] JELLY FIX: Update Source directly!
            motionValues.width.set(desiredWidth);
            motionValues.height.set(desiredHeight);

            motionValues.x.set(newCenterX);
            motionValues.y.set(newCenterY);

            // 4. Update Physics
            // We pass the new center explicitly so physics body moves WITH the expansion
            onResize(
                desiredWidth,
                desiredHeight,
                true,
                true,
                { x: newCenterX, y: newCenterY } // Pass position here!
            );
        };

        const handleResizeUp = () => {
            setIsResizing(false);
            setDraggedNode(null);
            onDragEnd(); // Release physics lock

            // 5. SAVE TO STORE (Persistence) - Triggers Render
            updateNode(id, {
                width: motionValues.width.get(),
                height: motionValues.height.get(),
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
                // If resizing, use the raw 'Source' (instant). Otherwise, use 'Spring' (smooth).
                width: isResizing ? motionValues.width : widthSpring,
                height: isResizing ? motionValues.height : heightSpring,
                opacity,
                zIndex,
                scale: isActive || isDragging ? 1.02 : 1
            }}
            // Remove 'animate' for width/height to let MotionValues take control during interaction
            initial={{ opacity: 0 }}
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
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-canvas-bg border border-brand-primary/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center">
                    <div className="w-1 h-1 bg-brand-primary rounded-[1px] opacity-80" />
                </div>
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-canvas-bg border border-brand-primary/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center">
                    <div className="w-1 h-1 bg-brand-primary rounded-[1px] opacity-80" />
                </div>
            </div>

            <div
                onPointerDown={(e) => { e.stopPropagation(); }}
                className={`
            relative overflow-hidden h-full w-full
            rounded-sm backdrop-blur-2xl 
            border transition-colors duration-500
            ${isActive
                        ? 'bg-node-bg-active border-brand-primary/50 shadow-[0_0_50px_rgba(139,92,246,0.1)]'
                        : isZoomedOut
                            ? 'bg-node-bg/60 border-node-border hover:bg-node-bg/80 hover:border-node-border-hover'
                            : 'bg-node-bg/90 border-node-border hover:border-node-border-hover'
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
                            <Icon size={32} className="text-brand-primary" />
                            <h2 className="text-lg font-bold text-node-text tracking-widest uppercase text-center leading-none font-mono">
                                {title}
                            </h2>
                            {isMinimized && (
                                <div className="absolute top-2 right-2 text-node-header" title="Manually Minimized">
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
                            <div className={`flex items-center justify-between p-3 border-b select-none touch-none shrink-0 ${isActive ? 'border-brand-primary/20 bg-brand-primary/5' : 'border-node-border bg-node-border/10'}`}>
                                <div className="flex items-center gap-3 flex-1 cursor-grab active:cursor-grabbing" onPointerDown={handlePointerDown}>
                                    <div className={`p-1.5 rounded-sm ${isActive ? 'bg-brand-primary text-white' : 'bg-node-border text-node-dim'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <h2 className={`text-sm font-bold tracking-widest uppercase font-mono ${isActive ? 'text-white' : 'text-node-dim'}`}>{title}</h2>
                                </div>
                                <div className="flex items-center gap-1 pl-2">
                                    <div className={`p-1.5 rounded-md cursor-pointer transition-colors ${isImmune ? 'opacity-30 cursor-not-allowed text-node-header' : (isMinimized && !isActive) ? 'text-brand-primary hover:text-brand-primary/80' : 'text-node-header hover:text-white'}`}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            if (isImmune) return;
                                            if (isActive) { if (!isMinimized) toggleMinimize(id); setActiveNode(null); } else { toggleMinimize(id); }
                                        }}>
                                        {(isMinimized && !isActive) ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                    </div>
                                    <div className={`p-1.5 rounded-md cursor-pointer transition-colors ${isImmune ? 'text-violet-400 hover:text-violet-300' : 'text-node-header hover:text-white'}`}
                                        onPointerDown={(e) => { e.stopPropagation(); if (!isImmune && isMinimized) { toggleMinimize(id); } toggleLodImmunity(id); }}>
                                        <Pin size={14} className={isImmune ? "fill-current" : ""} />
                                    </div>
                                    <div className="p-1.5 rounded-md hover:bg-node-border cursor-ns-resize text-node-header hover:text-white transition-colors" onPointerDown={handleScaleDrag}>
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
                            <div className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-node-header hover:text-brand-primary transition-colors z-20" onPointerDown={handleResizeDown}>
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
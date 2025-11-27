'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, DEFAULT_POSITIONS, DEFAULT_DIMENSIONS } from '../lib/store';
import { NodeId } from '../lib/types';
import { LucideIcon, Scaling, Pin, Minimize2, Maximize2 } from 'lucide-react';
import { useNodeLOD } from '../hooks/useNodeLOD';
import { pushNodesOnDrag, pushNodesOnResize } from '../lib/collision';

interface NodeProps {
    id: NodeId;
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

// Exporting constants so Canvas can match calculations
export const LOD_WIDTH = 200;
export const LOD_HEIGHT = 128;

export const Node: React.FC<NodeProps> = React.memo(({ id, title, icon: Icon, children }) => {
    // Optimize Selectors
    const position = useStore((state) => state.nodePositions[id]) || DEFAULT_POSITIONS[id] || { x: 0, y: 0 };
    const dimensions = useStore((state) => state.nodeDimensions[id]) || DEFAULT_DIMENSIONS[id] || { width: 300, height: 200 };
    const isActive = useStore((state) => state.activeNode === id);
    const anyActive = useStore((state) => !!state.activeNode);
    const scale = useStore((state) => state.scale);
    const moveNode = useStore((state) => state.moveNode);
    const resizeNode = useStore((state) => state.resizeNode);
    const setActiveNode = useStore((state) => state.setActiveNode);
    const setIsNodeDragging = useStore((state) => state.setIsNodeDragging);
    const lodImmuneNodes = useStore((state) => state.lodImmuneNodes);
    const toggleLodImmunity = useStore((state) => state.toggleLodImmunity);
    // Removed allPositions/allDimensions subscription to prevent re-renders on every move
    const minimizedNodes = useStore((state) => state.minimizedNodes);
    const toggleMinimize = useStore((state) => state.toggleMinimize);
    const viewportSize = useStore((state) => state.viewportSize);
    const setNodePorts = useStore((state) => state.setNodePorts);
    const setDraggedNode = useStore((state) => state.setDraggedNode);

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [contentScale, setContentScale] = useState(1);

    // Use stored dimensions or fallback if not yet initialized
    const currentWidth = dimensions?.width || 300;
    const currentHeight = dimensions?.height || 300;

    const { isZoomedOut, autoCollapse } = useNodeLOD(id, { width: currentWidth, height: currentHeight }, isResizing);
    const isImmune = lodImmuneNodes.includes(id);
    const isMinimized = minimizedNodes.includes(id);

    // Track previous zoomed state to detect expansion
    const prevIsZoomedOut = React.useRef(isZoomedOut);

    React.useEffect(() => {
        // Check if we just expanded (went from zoomed out to NOT zoomed out)
        if (prevIsZoomedOut.current && !isZoomedOut) {
            const state = useStore.getState();

            // Reverted delay: User reported it looked weird.
            // Immediate push might look like "teleporting" but it's more responsive.
            pushNodesOnResize(
                id,
                position.x,
                position.y,
                currentWidth,
                currentHeight,
                state.nodePositions,
                state.nodeDimensions,
                (pushedId, newX, newY) => {
                    state.moveNode(pushedId, newX, newY);
                },
                scale,
                lodImmuneNodes,
                minimizedNodes,
                viewportSize,
                state.activeNode // Pass active node ID
            );


        }
        prevIsZoomedOut.current = isZoomedOut;
    }, [isZoomedOut, id, position.x, position.y, currentWidth, currentHeight, scale, lodImmuneNodes, minimizedNodes, viewportSize]);

    // Calculate offset to center the LOD card relative to the full Node size
    const xOffset = isZoomedOut ? (currentWidth - LOD_WIDTH) / 2 : 0;
    const yOffset = isZoomedOut ? (currentHeight - LOD_HEIGHT) / 2 : 0;

    // Register Ports - DISABLED for performance (Double Render on Resize)
    // Canvas already calculates these positions correctly using the same LOD logic.
    // Re-enable only if we have nodes with non-standard port positions that Canvas can't predict.
    /*
    React.useEffect(() => {
        // ... (Logic omitted for performance)
        const visualWidth = isZoomedOut ? LOD_WIDTH : currentWidth;
        const visualHeight = isZoomedOut ? LOD_HEIGHT : currentHeight;
        
        const inputOffset = {
            x: xOffset,
            y: yOffset + (visualHeight / 2)
        };

        const outputOffset = {
            x: xOffset + visualWidth,
            y: yOffset + (visualHeight / 2)
        };

        setNodePorts(id, { input: inputOffset, output: outputOffset });

    }, [id, isZoomedOut, currentWidth, currentHeight, xOffset, yOffset, setNodePorts]);
    */

    const opacity = (isActive || isDragging || isResizing || !anyActive) ? 1 : 0.4;
    const zIndex = isActive || isDragging || isResizing ? 50 : 10;

    // --- DRAG LOGIC (Moves the Node) ---
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startNodeX = position.x;
        const startNodeY = position.y;

        const currentScale = useStore.getState().scale;

        setDraggedNode(id);
        setIsDragging(true);
        setIsNodeDragging(true);

        // Option 2: Deselect any other active node immediately when interacting with a non-active node.
        // This ensures that dragging a card doesn't leave another node expanded,
        // but also doesn't auto-expand the dragged card (unless it's a click, handled in pointerUp).
        if (!isActive) {
            setActiveNode(null);
        }

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
                const desiredX = startNodeX + dx;
                const desiredY = startNodeY + dy;

                // Move the dragged Node
                moveNode(id, desiredX, desiredY);

                // Calculate actual visual dimensions for collision (accounting for LOD)
                const visualWidth = isZoomedOut ? LOD_WIDTH : currentWidth;
                const visualHeight = isZoomedOut ? LOD_HEIGHT : currentHeight;
                // Adjust position for LOD centering
                const visualX = isZoomedOut ? desiredX + xOffset : desiredX;
                const visualY = isZoomedOut ? desiredY + yOffset : desiredY;

                // Push other nodes out of the way
                const currentState = useStore.getState();
                pushNodesOnDrag(
                    id,
                    visualX,
                    visualY,
                    visualWidth,
                    visualHeight,
                    currentState.nodePositions,
                    currentState.nodeDimensions,
                    (pushedId, newX, newY) => {
                        // Use the store's moveNode to update pushed nodes
                        useStore.getState().moveNode(pushedId, newX, newY);
                    },
                    scale, // Pass current scale for LOD calculation
                    lodImmuneNodes, // Pass LOD immunity list
                    minimizedNodes, // Pass minimized list
                    viewportSize, // Pass viewport size for accurate LOD calculation
                    currentState.activeNode // Pass active node ID
                );
            }
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            setIsNodeDragging(false);
            setDraggedNode(null);

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            if (!hasMoved) {
                setActiveNode(id);
                // If we are clicking a minimized Node that SHOULD be open (based on zoom),
                // we un-minimize it so it stays open when we click away.
                if (isMinimized && !autoCollapse) {
                    toggleMinimize(id);
                }
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    // --- RESIZE LOGIC (Scales the Node) ---
    const handleResizeDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startWidth = currentWidth;
        const startHeight = currentHeight;
        const currentScale = useStore.getState().scale;

        setIsResizing(true);
        setDraggedNode(id);

        const handleResizeMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const rawDx = moveEvent.clientX - startMouseX;
            const rawDy = moveEvent.clientY - startMouseY;

            const desiredWidth = Math.max(250, startWidth + (rawDx / currentScale));
            const desiredHeight = Math.max(200, startHeight + (rawDy / currentScale));

            // Resize the Node
            resizeNode(id, desiredWidth, desiredHeight);

            // Push other nodes out of the way
            const currentState = useStore.getState();
            pushNodesOnResize(
                id,
                position.x,
                position.y,
                desiredWidth,
                desiredHeight,
                currentState.nodePositions,
                currentState.nodeDimensions,
                (pushedId, newX, newY) => {
                    // Use the store's moveNode to update pushed nodes
                    useStore.getState().moveNode(pushedId, newX, newY);
                },
                currentScale,
                lodImmuneNodes,
                minimizedNodes,
                viewportSize,
                currentState.activeNode // Pass active node ID
            );
        };

        const handleResizeUp = () => {
            setIsResizing(false);
            setDraggedNode(null);
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
                <div
                    ref={(el) => {
                        if (el) {
                            // Measure and register relative position
                            // We do this in a simplified way: standard offset for now, 
                            // but this structure allows for dynamic positioning if we move these divs later.
                            // Since these are absolute positioned relative to the Node container, 
                            // their center coordinates are what we care about.

                            // Left knob is at top-1/2, -left-1.5 (-6px)
                            // We want the center of this knob.
                            // y = currentHeight / 2
                            // x = -6 + 6 (width/2) = 0? No, left is -1.5 tailwind class which is -6px.
                            // Width is 3 (12px). Center is -6 + 6 = 0 relative to left edge?
                            // Actually, let's just calculate the offsets mathematically based on the styles 
                            // to avoid layout thrashing, OR use the ref to get the exact element if needed.
                            // For now, let's stick to the mathematical offset which is faster and stable.
                        }
                    }}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#181625] border border-violet-500/50 rounded-[2px] z-0 shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center justify-center"
                >
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
                            {isMinimized && (
                                <div className="absolute top-2 right-2 text-[#5B5680]" title="Manually Minimized">
                                    <Minimize2 size={16} />
                                </div>
                            )}
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
                                className={`
                            flex items-center justify-between p-3 border-b select-none touch-none shrink-0
                            ${isActive ? 'border-violet-500/20 bg-violet-500/5' : 'border-[#3E3B5E] bg-[#3E3B5E]/10'}
                        `}
                            >
                                {/* Title & Icon - Acts as Drag Handle */}
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-grab active:cursor-grabbing"
                                    onPointerDown={handlePointerDown}
                                >
                                    <div className={`p-1.5 rounded-sm ${isActive ? 'bg-violet-600 text-white' : 'bg-[#3E3B5E] text-[#948FB2]'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <h2 className={`text-sm font-bold tracking-widest uppercase font-mono ${isActive ? 'text-white' : 'text-[#948FB2]'}`}>
                                        {title}
                                    </h2>
                                </div>

                                {/* Header Controls - Separate from Drag Handle */}
                                <div className="flex items-center gap-1 pl-2">
                                    {/* Minimize Toggle */}
                                    <div
                                        className={`p-1.5 rounded-md cursor-pointer transition-colors 
                                            ${isImmune ? 'opacity-30 cursor-not-allowed text-[#5B5680]' :
                                                (isMinimized && !isActive) ? 'text-violet-400 hover:text-violet-300' : 'text-[#5B5680] hover:text-white'}
                                        `}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            if (isImmune) return;

                                            if (isActive) {
                                                // If active, we are closing/minimizing
                                                // If NOT minimized, set it to minimized
                                                if (!isMinimized) toggleMinimize(id);
                                                // Always deselect to collapse
                                                setActiveNode(null);
                                            } else {
                                                toggleMinimize(id);
                                            }
                                        }}
                                        title={isImmune ? "Cannot minimize pinned node" : (isMinimized && !isActive) ? "Expand node" : "Minimize node"}
                                    >
                                        {(isMinimized && !isActive) ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                    </div>

                                    {/* LOD Immunity Toggle (Pin) */}
                                    <div
                                        className={`p-1.5 rounded-md cursor-pointer transition-colors ${isImmune ? 'text-violet-400 hover:text-violet-300' : 'text-[#5B5680] hover:text-white'}`}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            // If we are pinning (currently not immune) and it's minimized, un-minimize it
                                            if (!isImmune && isMinimized) {
                                                toggleMinimize(id);
                                            }
                                            toggleLodImmunity(id);
                                        }}
                                        title={isImmune ? "Unpin node" : "Pin node open"}
                                    >
                                        <Pin size={14} className={isImmune ? "fill-current" : ""} />
                                    </div>

                                    {/* Content Scale Control */}
                                    <div
                                        className="p-1.5 rounded-md hover:bg-[#3E3B5E] cursor-ns-resize text-[#5B5680] hover:text-white transition-colors"
                                        onPointerDown={handleScaleDrag}
                                        title="Drag to scale content"
                                    >
                                        <Scaling size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
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

Node.displayName = 'Node';

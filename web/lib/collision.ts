import { NodeId } from './types';

/**
 * Represents a rectangle boundary
 */
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(rect1: Rectangle, rect2: Rectangle, padding: number = 0): boolean {
    return !(
        rect1.x + rect1.width + padding <= rect2.x ||
        rect2.x + rect2.width + padding <= rect1.x ||
        rect1.y + rect1.height + padding <= rect2.y ||
        rect2.y + rect2.height + padding <= rect1.y
    );
}

/**
 * Helper to calculate the visual rectangle of an Node, accounting for LOD and Minimized state
 */
function getVisualNodeRect(
    id: NodeId,
    pos: { x: number; y: number },
    dim: { width: number; height: number },
    scale: number,
    lodImmuneNodes: NodeId[],
    minimizedNodes: NodeId[],
    viewportSize: { width: number; height: number }
): Rectangle {
    const LOD_WIDTH = 200;
    const LOD_HEIGHT = 128;

    // Exact logic from lod.ts
    const threshold = Math.min(viewportSize.width, viewportSize.height) * 0.5;
    const maxDimension = Math.max(dim.width, dim.height);
    const visualSize = maxDimension * scale;
    const isGlobalZoomedOut = scale < 0.3;

    const isImmune = lodImmuneNodes.includes(id);
    const isMinimized = minimizedNodes.includes(id);

    const autoCollapse = isGlobalZoomedOut || (scale < 0.65 && visualSize < threshold && !isImmune);

    const isZoomedOut = isMinimized || autoCollapse;

    if (isZoomedOut) {
        const xOffset = (dim.width - LOD_WIDTH) / 2;
        const yOffset = (dim.height - LOD_HEIGHT) / 2;
        return {
            x: pos.x + xOffset,
            y: pos.y + yOffset,
            width: LOD_WIDTH,
            height: LOD_HEIGHT
        };
    }

    return {
        x: pos.x,
        y: pos.y,
        width: dim.width,
        height: dim.height
    };
}

/**
 * Push nodes out of the way when dragging
 */
/**
 * Push nodes out of the way when dragging
 */
export function pushNodesOnDrag(
    draggedId: NodeId,
    draggedX: number,
    draggedY: number,
    draggedWidth: number,
    draggedHeight: number,
    allPositions: Record<NodeId, { x: number; y: number }>,
    allDimensions: Record<NodeId, { width: number; height: number }>,
    onPushNode: (id: NodeId, x: number, y: number) => void,
    scale: number = 1,
    lodImmuneNodes: NodeId[] = [],
    minimizedNodes: NodeId[] = [],
    viewportSize: { width: number; height: number } = { width: 1920, height: 1080 }
): void {
    const COLLISION_PADDING = 20;
    const MAX_ITERATIONS = 10; // Increased iterations for cascade

    // Local state to track positions during the cascade
    const currentPositions = { ...allPositions };
    // Update the dragged node's position in our local state
    currentPositions[draggedId] = { x: draggedX, y: draggedY };

    // Queue of nodes that have moved and need to be checked against others
    // We store just the ID.
    let movedNodes: NodeId[] = [draggedId];

    // Set of nodes processed in the current wave to avoid immediate ping-pong
    // actually, we just need to know who moved.

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const nextMovedNodes: NodeId[] = [];
        const processedInThisIteration = new Set<NodeId>();

        if (movedNodes.length === 0) break;

        for (const sourceId of movedNodes) {
            const sourcePos = currentPositions[sourceId];
            // If it's the dragged node, use the passed dimensions. 
            // Otherwise use stored dimensions.
            const sourceDim = sourceId === draggedId 
                ? { width: draggedWidth, height: draggedHeight }
                : allDimensions[sourceId];
            
            if (!sourceDim) continue;

            const sourceRect = getVisualNodeRect(
                sourceId,
                sourcePos,
                sourceDim,
                scale,
                lodImmuneNodes,
                minimizedNodes,
                viewportSize
            );

            // Check against all other nodes
            for (const [targetId, targetPos] of Object.entries(currentPositions)) {
                // Don't check against self
                if (sourceId === targetId) continue;
                // Don't push the node currently being dragged by the user
                if (targetId === draggedId) continue;
                
                // Optimization: If we already moved this target in this iteration, skip it 
                // to prevent it being pushed multiple times by different sources in the same frame?
                // No, multiple sources might push it further. But let's avoid cycles.
                
                const targetDim = allDimensions[targetId as NodeId];
                if (!targetDim) continue;

                const targetRect = getVisualNodeRect(
                    targetId as NodeId,
                    targetPos,
                    targetDim,
                    scale,
                    lodImmuneNodes,
                    minimizedNodes,
                    viewportSize
                );

                if (rectanglesOverlap(sourceRect, targetRect, COLLISION_PADDING)) {
                    const sourceCenterX = sourceRect.x + sourceRect.width / 2;
                    const sourceCenterY = sourceRect.y + sourceRect.height / 2;
                    const targetCenterX = targetRect.x + targetRect.width / 2;
                    const targetCenterY = targetRect.y + targetRect.height / 2;

                    const dx = targetCenterX - sourceCenterX;
                    const dy = targetCenterY - sourceCenterY;

                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);

                    let newX = targetPos.x;
                    let newY = targetPos.y;

                    // Re-calculate offsets for the target Node to map back to real coordinates
                    const LOD_WIDTH = 200;
                    const LOD_HEIGHT = 128;

                    const threshold = Math.min(viewportSize.width, viewportSize.height) * 0.5;
                    const maxDimension = Math.max(targetDim.width, targetDim.height);
                    const visualSize = maxDimension * scale;
                    const isGlobalZoomedOut = scale < 0.3;

                    const isTargetImmune = lodImmuneNodes.includes(targetId as NodeId);
                    const isTargetMinimized = minimizedNodes.includes(targetId as NodeId);

                    const autoCollapse = isGlobalZoomedOut || (scale < 0.65 && visualSize < threshold && !isTargetImmune);
                    const isTargetZoomedOut = isTargetMinimized || autoCollapse;

                    const targetXOffset = isTargetZoomedOut ? (targetDim.width - LOD_WIDTH) / 2 : 0;
                    const targetYOffset = isTargetZoomedOut ? (targetDim.height - LOD_HEIGHT) / 2 : 0;

                    if (absDx > absDy) {
                        if (dx > 0) {
                            // Push right
                            newX = sourceRect.x + sourceRect.width + COLLISION_PADDING - targetXOffset;
                        } else {
                            // Push left
                            newX = sourceRect.x - targetRect.width - COLLISION_PADDING - targetXOffset;
                        }
                    } else {
                        if (dy > 0) {
                            // Push down
                            newY = sourceRect.y + sourceRect.height + COLLISION_PADDING - targetYOffset;
                        } else {
                            // Push up
                            newY = sourceRect.y - targetRect.height - COLLISION_PADDING - targetYOffset;
                        }
                    }

                    if (newX !== targetPos.x || newY !== targetPos.y) {
                        // Update local state
                        currentPositions[targetId as NodeId] = { x: newX, y: newY };
                        
                        // Notify callback
                        onPushNode(targetId as NodeId, newX, newY);
                        
                        // Add to next wave if not already added
                        if (!processedInThisIteration.has(targetId as NodeId)) {
                            nextMovedNodes.push(targetId as NodeId);
                            processedInThisIteration.add(targetId as NodeId);
                        }
                    }
                }
            }
        }
        
        movedNodes = nextMovedNodes;
    }
}

/**
 * Push nodes out of the way when resizing
 */
export function pushNodesOnResize(
    resizedId: NodeId,
    x: number,
    y: number,
    newWidth: number,
    newHeight: number,
    allPositions: Record<NodeId, { x: number; y: number }>,
    allDimensions: Record<NodeId, { width: number; height: number }>,
    onPushNode: (id: NodeId, x: number, y: number) => void,
    scale: number = 1,
    lodImmuneNodes: NodeId[] = [],
    minimizedNodes: NodeId[] = [],
    viewportSize: { width: number; height: number } = { width: 1920, height: 1080 }
): void {
    // Reuse the same logic, treating the resized node as the "dragged" node (source of force)
    pushNodesOnDrag(
        resizedId,
        x,
        y,
        newWidth,
        newHeight,
        allPositions,
        allDimensions,
        onPushNode,
        scale,
        lodImmuneNodes,
        minimizedNodes,
        viewportSize
    );
}

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
    const MAX_ITERATIONS = 5;

    const draggedRect: Rectangle = {
        x: draggedX,
        y: draggedY,
        width: draggedWidth,
        height: draggedHeight,
    };

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        let pushedAny = false;

        for (const [otherId, otherPos] of Object.entries(allPositions)) {
            if (otherId === draggedId) continue;

            const otherDim = allDimensions[otherId as NodeId];
            if (!otherDim) continue;

            const otherRect = getVisualNodeRect(
                otherId as NodeId,
                otherPos,
                otherDim,
                scale,
                lodImmuneNodes,
                minimizedNodes,
                viewportSize
            );

            if (rectanglesOverlap(draggedRect, otherRect, COLLISION_PADDING)) {
                const draggedCenterX = draggedRect.x + draggedRect.width / 2;
                const draggedCenterY = draggedRect.y + draggedRect.height / 2;
                const otherCenterX = otherRect.x + otherRect.width / 2;
                const otherCenterY = otherRect.y + otherRect.height / 2;

                const dx = otherCenterX - draggedCenterX;
                const dy = otherCenterY - draggedCenterY;

                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                let newX = otherPos.x;
                let newY = otherPos.y;

                // Re-calculate offsets for the other Node to map back to real coordinates
                // We need to know the visual offset of the other Node to update its REAL position correctly
                // getVisualNodeRect returns the visual rect.
                // The "real" position is visualRect.x - xOffset.
                // But we want to calculate the NEW real position.

                // Re-calculate offsets for the other Node to map back to real coordinates
                const LOD_WIDTH = 200;
                const LOD_HEIGHT = 128;

                const threshold = Math.min(viewportSize.width, viewportSize.height) * 0.5;
                const maxDimension = Math.max(otherDim.width, otherDim.height);
                const visualSize = maxDimension * scale;
                const isGlobalZoomedOut = scale < 0.3;

                const isOtherImmune = lodImmuneNodes.includes(otherId as NodeId);
                const isOtherMinimized = minimizedNodes.includes(otherId as NodeId);

                const autoCollapse = isGlobalZoomedOut || (scale < 0.65 && visualSize < threshold && !isOtherImmune);
                const isOtherZoomedOut = isOtherMinimized || autoCollapse;

                const otherXOffset = isOtherZoomedOut ? (otherDim.width - LOD_WIDTH) / 2 : 0;
                const otherYOffset = isOtherZoomedOut ? (otherDim.height - LOD_HEIGHT) / 2 : 0;

                if (absDx > absDy) {
                    if (dx > 0) {
                        // Push right
                        // newVisualX = draggedRight + padding
                        // newRealX = newVisualX - offset
                        newX = draggedRect.x + draggedRect.width + COLLISION_PADDING - otherXOffset;
                    } else {
                        // Push left
                        // newVisualX = draggedLeft - otherVisualWidth - padding
                        newX = draggedRect.x - otherRect.width - COLLISION_PADDING - otherXOffset;
                    }
                } else {
                    if (dy > 0) {
                        // Push down
                        newY = draggedRect.y + draggedRect.height + COLLISION_PADDING - otherYOffset;
                    } else {
                        // Push up
                        newY = draggedRect.y - otherRect.height - COLLISION_PADDING - otherYOffset;
                    }
                }

                if (newX !== otherPos.x || newY !== otherPos.y) {
                    onPushNode(otherId as NodeId, newX, newY);
                    pushedAny = true;
                    allPositions[otherId as NodeId] = { x: newX, y: newY };
                }
            }
        }

        if (!pushedAny) break;
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
    const COLLISION_PADDING = 20;
    const MAX_ITERATIONS = 5;

    const resizedRect: Rectangle = {
        x: x,
        y: y,
        width: newWidth,
        height: newHeight,
    };

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        let pushedAny = false;

        for (const [otherId, otherPos] of Object.entries(allPositions)) {
            if (otherId === resizedId) continue;

            const otherDim = allDimensions[otherId as NodeId];
            if (!otherDim) continue;

            const otherRect = getVisualNodeRect(
                otherId as NodeId,
                otherPos,
                otherDim,
                scale,
                lodImmuneNodes,
                minimizedNodes,
                viewportSize
            );

            if (rectanglesOverlap(resizedRect, otherRect, COLLISION_PADDING)) {
                const otherCenterX = otherRect.x + otherRect.width / 2;
                const otherCenterY = otherRect.y + otherRect.height / 2;
                const resizedCenterX = resizedRect.x + resizedRect.width / 2;
                const resizedCenterY = resizedRect.y + resizedRect.height / 2;

                const dx = otherCenterX - resizedCenterX;
                const dy = otherCenterY - resizedCenterY;

                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                let newX = otherPos.x;
                let newY = otherPos.y;

                // Re-calculate offsets for the other Node to map back to real coordinates
                const LOD_WIDTH = 200;
                const LOD_HEIGHT = 128;

                const threshold = Math.min(viewportSize.width, viewportSize.height) * 0.5;
                const maxDimension = Math.max(otherDim.width, otherDim.height);
                const visualSize = maxDimension * scale;
                const isGlobalZoomedOut = scale < 0.3;

                const isOtherImmune = lodImmuneNodes.includes(otherId as NodeId);
                const isOtherMinimized = minimizedNodes.includes(otherId as NodeId);

                const autoCollapse = isGlobalZoomedOut || (scale < 0.65 && visualSize < threshold && !isOtherImmune);
                const isOtherZoomedOut = isOtherMinimized || autoCollapse;

                const otherXOffset = isOtherZoomedOut ? (otherDim.width - LOD_WIDTH) / 2 : 0;
                const otherYOffset = isOtherZoomedOut ? (otherDim.height - LOD_HEIGHT) / 2 : 0;

                if (absDx > absDy) {
                    if (dx > 0) {
                        newX = resizedRect.x + resizedRect.width + COLLISION_PADDING - otherXOffset;
                    } else {
                        newX = resizedRect.x - otherRect.width - COLLISION_PADDING - otherXOffset;
                    }
                } else {
                    if (dy > 0) {
                        newY = resizedRect.y + resizedRect.height + COLLISION_PADDING - otherYOffset;
                    } else {
                        newY = resizedRect.y - otherRect.height - COLLISION_PADDING - otherYOffset;
                    }
                }

                if (newX !== otherPos.x || newY !== otherPos.y) {
                    onPushNode(otherId as NodeId, newX, newY);
                    pushedAny = true;
                    allPositions[otherId as NodeId] = { x: newX, y: newY };
                }
            }
        }

        if (!pushedAny) break;
    }
}

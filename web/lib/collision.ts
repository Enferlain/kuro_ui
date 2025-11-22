import { IslandId } from './types';

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
 * Push islands out of the way when dragging
 */
export function pushIslandsOnDrag(
    draggedId: IslandId,
    draggedX: number,
    draggedY: number,
    draggedWidth: number,
    draggedHeight: number,
    allPositions: Record<IslandId, { x: number; y: number }>,
    allDimensions: Record<IslandId, { width: number; height: number }>,
    onPushIsland: (id: IslandId, x: number, y: number) => void,
    scale: number = 1,
    lodImmuneIslands: IslandId[] = []
): void {
    const COLLISION_PADDING = 20;
    const MAX_ITERATIONS = 5;
    const LOD_WIDTH = 200;
    const LOD_HEIGHT = 128;
    const LOD_THRESHOLD = 0.55;

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

            const otherDim = allDimensions[otherId as IslandId];
            if (!otherDim) continue;

            // Calculate if this island is in LOD mode (considering immunity)
            const isOtherImmune = lodImmuneIslands.includes(otherId as IslandId);
            const isOtherZoomedOut = scale < LOD_THRESHOLD && !isOtherImmune;

            // Use visual dimensions (LOD if zoomed out and not immune, full otherwise)
            const otherVisualWidth = isOtherZoomedOut ? LOD_WIDTH : otherDim.width;
            const otherVisualHeight = isOtherZoomedOut ? LOD_HEIGHT : otherDim.height;

            // Calculate visual position (centered for LOD)
            const otherXOffset = isOtherZoomedOut ? (otherDim.width - LOD_WIDTH) / 2 : 0;
            const otherYOffset = isOtherZoomedOut ? (otherDim.height - LOD_HEIGHT) / 2 : 0;
            const otherVisualX = otherPos.x + otherXOffset;
            const otherVisualY = otherPos.y + otherYOffset;

            const otherRect: Rectangle = {
                x: otherVisualX,
                y: otherVisualY,
                width: otherVisualWidth,
                height: otherVisualHeight,
            };

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

                if (absDx > absDy) {
                    if (dx > 0) {
                        newX = draggedRect.x + draggedRect.width + COLLISION_PADDING - otherXOffset;
                    } else {
                        newX = draggedRect.x - otherVisualWidth - COLLISION_PADDING - otherXOffset;
                    }
                } else {
                    if (dy > 0) {
                        newY = draggedRect.y + draggedRect.height + COLLISION_PADDING - otherYOffset;
                    } else {
                        newY = draggedRect.y - otherVisualHeight - COLLISION_PADDING - otherYOffset;
                    }
                }

                if (newX !== otherPos.x || newY !== otherPos.y) {
                    onPushIsland(otherId as IslandId, newX, newY);
                    pushedAny = true;
                    allPositions[otherId as IslandId] = { x: newX, y: newY };
                }
            }
        }

        if (!pushedAny) break;
    }
}

/**
 * Push islands out of the way when resizing
 */
export function pushIslandsOnResize(
    resizedId: IslandId,
    x: number,
    y: number,
    newWidth: number,
    newHeight: number,
    allPositions: Record<IslandId, { x: number; y: number }>,
    allDimensions: Record<IslandId, { width: number; height: number }>,
    onPushIsland: (id: IslandId, x: number, y: number) => void
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

            const otherDim = allDimensions[otherId as IslandId];
            if (!otherDim) continue;

            const otherRect: Rectangle = {
                x: otherPos.x,
                y: otherPos.y,
                width: otherDim.width,
                height: otherDim.height,
            };

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

                if (absDx > absDy) {
                    if (dx > 0) {
                        newX = resizedRect.x + resizedRect.width + COLLISION_PADDING;
                    } else {
                        newX = resizedRect.x - otherRect.width - COLLISION_PADDING;
                    }
                } else {
                    if (dy > 0) {
                        newY = resizedRect.y + resizedRect.height + COLLISION_PADDING;
                    } else {
                        newY = resizedRect.y - otherRect.height - COLLISION_PADDING;
                    }
                }

                if (newX !== otherPos.x || newY !== otherPos.y) {
                    onPushIsland(otherId as IslandId, newX, newY);
                    pushedAny = true;
                    allPositions[otherId as IslandId] = { x: newX, y: newY };
                }
            }
        }

        if (!pushedAny) break;
    }
}

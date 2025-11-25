import { useRef } from 'react';
import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';
import { calculateLodState } from '../lib/lod';

export const useNodeLOD = (id: NodeId, dimensions: { width: number, height: number }, isResizing: boolean = false) => {
    const scale = useStore((state) => state.scale);
    const viewportSize = useStore((state) => state.viewportSize);
    const activeNode = useStore((state) => state.activeNode);
    const lodImmuneNodes = useStore((state) => state.lodImmuneNodes);
    const minimizedNodes = useStore((state) => state.minimizedNodes);

    const isActive = id === activeNode;
    const isImmune = lodImmuneNodes.includes(id);
    const isMinimized = minimizedNodes.includes(id);

    const currentState = calculateLodState({
        scale,
        viewportSize,
        dimensions,
        isActive,
        isImmune,
        isMinimized
    });

    // If resizing, return the previous stable state to prevent jarring swaps
    const lastStableState = useRef(currentState);
    if (!isResizing) {
        lastStableState.current = currentState;
    }

    return isResizing ? lastStableState.current : currentState;
};

import { useStore } from '../lib/store';
import { NodeId } from '../lib/types';
import { calculateLodState } from '../lib/lod';

export const useNodeLOD = (id: NodeId, dimensions: { width: number, height: number }) => {
    const scale = useStore((state) => state.scale);
    const viewportSize = useStore((state) => state.viewportSize);
    const activeNode = useStore((state) => state.activeNode);
    const lodImmuneNodes = useStore((state) => state.lodImmuneNodes);
    const minimizedNodes = useStore((state) => state.minimizedNodes);

    const isActive = id === activeNode;
    const isImmune = lodImmuneNodes.includes(id);
    const isMinimized = minimizedNodes.includes(id);

    return calculateLodState({
        scale,
        viewportSize,
        dimensions,
        isActive,
        isImmune,
        isMinimized
    });
};

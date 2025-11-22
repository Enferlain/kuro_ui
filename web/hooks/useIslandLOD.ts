import { useStore } from '../lib/store';
import { IslandId } from '../lib/types';
import { calculateLodState } from '../lib/lod';

export const useIslandLOD = (id: IslandId, dimensions: { width: number, height: number }) => {
    const scale = useStore((state) => state.scale);
    const viewportSize = useStore((state) => state.viewportSize);
    const activeIsland = useStore((state) => state.activeIsland);
    const lodImmuneIslands = useStore((state) => state.lodImmuneIslands);

    const isActive = id === activeIsland;
    const isImmune = lodImmuneIslands.includes(id);

    return calculateLodState({
        scale,
        viewportSize,
        dimensions,
        isActive,
        isImmune
    });
};

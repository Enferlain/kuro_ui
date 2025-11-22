export interface LodState {
    isZoomedOut: boolean;
    visualSize: number;
    threshold: number;
}

export interface LodParams {
    scale: number;
    viewportSize: { width: number; height: number };
    dimensions: { width: number; height: number };
    isActive: boolean;
    isImmune: boolean;
}

export const calculateLodState = ({
    scale,
    viewportSize,
    dimensions,
    isActive,
    isImmune
}: LodParams): LodState => {
    // Dynamic LOD Logic:
    // Switch to LOD if global scale is low AND the visual size of the island is small.
    // Threshold is 50% of the smallest viewport dimension.
    const threshold = Math.min(viewportSize.width, viewportSize.height) * 0.5;
    const maxDimension = Math.max(dimensions.width, dimensions.height);
    const visualSize = maxDimension * scale;

    // Hard cutoff where everything becomes LOD if it's too far out
    const isGlobalZoomedOut = scale < 0.3;

    const isZoomedOut = !isImmune && !isActive && (isGlobalZoomedOut || (scale < 0.65 && visualSize < threshold));

    return { isZoomedOut, visualSize, threshold };
};

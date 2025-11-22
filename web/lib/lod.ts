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
    isMinimized: boolean;
}

export const calculateLodState = ({
    scale,
    viewportSize,
    dimensions,
    isActive,
    isImmune,
    isMinimized
}: LodParams): LodState => {
    // Dynamic LOD Logic:
    // Switch to LOD if global scale is low AND the visual size of the island is small.
    // Threshold is 50% of the smallest viewport dimension.
    const threshold = Math.min(viewportSize.width, viewportSize.height) * 0.5;
    const maxDimension = Math.max(dimensions.width, dimensions.height);
    const visualSize = maxDimension * scale;

    // Hard cutoff where everything becomes LOD if it's too far out
    const isGlobalZoomedOut = scale < 0.3;

    // Logic:
    // 1. If Active: NEVER zoomed out (LOD).
    // 2. If Immune (Pinned): NEVER zoomed out (LOD), unless manually minimized? 
    //    - User said "Pin (Immunity): Keep detailed view even when zoomed out".
    //    - User said "Minimize: Force Card View".
    //    - Conflict: What if both? "Minimize" should probably win over "Pin" if explicitly clicked.
    //    - But "Active" wins over everything.

    // Refined Logic:
    // isZoomedOut is TRUE if:
    // - NOT Active AND
    // - (Minimized OR GlobalZoomedOut OR (SmallVisualSize AND NOT Immune))

    const isZoomedOut = !isActive && (
        isMinimized ||
        isGlobalZoomedOut ||
        (scale < 0.65 && visualSize < threshold && !isImmune)
    );

    return { isZoomedOut, visualSize, threshold };
};

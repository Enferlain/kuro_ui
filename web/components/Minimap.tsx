import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { CANVAS_BOUNDS } from '../lib/constants';
import { LOD_WIDTH, LOD_HEIGHT } from '../lib/constants';
import { calculateLodState } from '../lib/lod';
import { GRAPH_EDGES } from './NodeRegistry';
import { X, SlidersHorizontal } from 'lucide-react'; // Import X and SlidersHorizontal icons

const MINIMAP_SIZE = 240; // px
const PADDING = 24; // px

export const Minimap: React.FC = () => {
    // Store Selectors
    const nodes = useStore((state) => state.nodes);
    const translation = useStore((state) => state.translation);
    const scale = useStore((state) => state.scale);
    const viewportSize = useStore((state) => state.viewportSize);
    const setTranslation = useStore((state) => state.setTranslation);
    const minimizedNodes = useStore((state) => state.minimizedNodes);
    const lodImmuneNodes = useStore((state) => state.lodImmuneNodes);
    const activeNode = useStore((state) => state.activeNode);
    const isMinimapVisible = useStore((state) => state.isMinimapVisible);
    const toggleMinimap = useStore((state) => state.toggleMinimap);
    const minimapSettings = useStore((state) => state.minimapSettings);
    const toggleMinimapSetting = useStore((state) => state.toggleMinimapSetting);

    // Local State
    const [isInternalDrag, setIsInternalDrag] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Derived Constants
    const worldWidth = CANVAS_BOUNDS.maxX - CANVAS_BOUNDS.minX;
    const worldHeight = CANVAS_BOUNDS.maxY - CANVAS_BOUNDS.minY;
    const aspectRatio = worldWidth / worldHeight;

    // Calculate Minimap Dimensions
    const mapWidth = MINIMAP_SIZE;
    const mapHeight = MINIMAP_SIZE / aspectRatio;

    // Viewport Calculations
    // The viewport rect in WORLD coordinates
    const viewWorldX = -translation.x / scale;
    const viewWorldY = -translation.y / scale;
    const viewWorldW = viewportSize.width / scale;
    const viewWorldH = viewportSize.height / scale;

    // Convert WORLD -> MINIMAP coordinates
    const scaleX = mapWidth / worldWidth;
    const scaleY = mapHeight / worldHeight;

    const toMapX = (wx: number) => (wx - CANVAS_BOUNDS.minX) * scaleX;
    const toMapY = (wy: number) => (wy - CANVAS_BOUNDS.minY) * scaleY;

    // Viewport Rect in MINIMAP coordinates
    // We clamp these slightly to ensure they don't look broken if out of bounds,
    // though the logic should keep them correct.
    const vpX = toMapX(viewWorldX);
    const vpY = toMapY(viewWorldY);
    const vpW = viewWorldW * scaleX;
    const vpH = viewWorldH * scaleY;

    // Interaction Handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation(); // Prevent Canvas from handling this
        e.preventDefault();
        if (!svgRef.current) return;
        setIsInternalDrag(true);
        e.currentTarget.setPointerCapture(e.pointerId);

        const rect = svgRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Always jump to click location, then drag from center
        const centerX = vpW / 2;
        const centerY = vpH / 2;
        setDragOffset({ x: centerX, y: centerY });
        updatePosition(clickX, clickY, centerX, centerY);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isInternalDrag || !svgRef.current || !dragOffset) return;
        e.stopPropagation(); // Only stop propagation when we're actually handling

        const rect = svgRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        updatePosition(clickX, clickY, dragOffset.x, dragOffset.y);
    };

    const updatePosition = (mouseX: number, mouseY: number, offsetX: number, offsetY: number) => {
        const targetMapX = mouseX - offsetX;
        const targetMapY = mouseY - offsetY;

        const worldX = (targetMapX / scaleX) + CANVAS_BOUNDS.minX;
        const worldY = (targetMapY / scaleY) + CANVAS_BOUNDS.minY;

        let newTx = -worldX * scale;
        let newTy = -worldY * scale;

        // Apply same boundary clamping as Canvas
        const vw = viewportSize.width;
        const vh = viewportSize.height;

        // X Axis
        const minTx = vw - CANVAS_BOUNDS.maxX * scale;
        const maxTx = -CANVAS_BOUNDS.minX * scale;
        if (minTx > maxTx) {
            newTx = (minTx + maxTx) / 2;
        } else {
            newTx = Math.max(minTx, Math.min(maxTx, newTx));
        }

        // Y Axis
        const minTy = vh - CANVAS_BOUNDS.maxY * scale;
        const maxTy = -CANVAS_BOUNDS.minY * scale;
        if (minTy > maxTy) {
            newTy = (minTy + maxTy) / 2;
        } else {
            newTy = Math.max(minTy, Math.min(maxTy, newTy));
        }

        setTranslation(newTx, newTy);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsInternalDrag(false);
        setDragOffset(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // If hidden, return null (The toggle button is external now)
    if (!isMinimapVisible) return null;

    return (
        <div
            className="rounded-lg shadow-2xl transition-all relative shrink-0"
            style={{ width: mapWidth, height: mapHeight }}
        >
            {/* Settings Toggle */}
            <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="absolute top-2 left-2 z-50 p-1 rounded-md bg-node-bg/80 hover:bg-node-border hover:text-white text-node-dim transition-colors"
                title="Minimap Settings"
            >
                <SlidersHorizontal size={14} />
            </button>

            {/* Settings Panel */}
            {isSettingsOpen && (
                <div className="absolute right-full top-0 mr-2 w-48 bg-node-bg-active border border-node-border rounded-lg shadow-xl overflow-hidden z-50 p-1 flex flex-col gap-1">
                    <div className="px-2 py-1 text-[10px] uppercase text-node-dim font-bold tracking-wider">Options</div>

                    <button onClick={() => toggleMinimapSetting('showNodeColors')} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border border-node-dim ${minimapSettings.showNodeColors ? 'bg-brand-primary border-brand-primary' : 'bg-transparent'}`} />
                        <span>Node Colors</span>
                    </button>
                    <button onClick={() => toggleMinimapSetting('showLinks')} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border border-node-dim ${minimapSettings.showLinks ? 'bg-brand-primary border-brand-primary' : 'bg-transparent'}`} />
                        <span>Show Links</span>
                    </button>
                    <button onClick={() => toggleMinimapSetting('showGroups')} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border border-node-dim ${minimapSettings.showGroups ? 'bg-brand-primary border-brand-primary' : 'bg-transparent'}`} />
                        <span>Show Frames/Groups</span>
                    </button>
                    <button onClick={() => toggleMinimapSetting('renderBypass')} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border border-node-dim ${minimapSettings.renderBypass ? 'bg-brand-primary border-brand-primary' : 'bg-transparent'}`} />
                        <span>Render Bypass State</span>
                    </button>
                    <button onClick={() => toggleMinimapSetting('renderError')} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border border-node-dim ${minimapSettings.renderError ? 'bg-brand-primary border-brand-primary' : 'bg-transparent'}`} />
                        <span>Render Error State</span>
                    </button>
                </div>
            )}

            {/* Close Button Overlay */}
            <button
                onClick={toggleMinimap}
                className="absolute top-2 right-2 z-50 p-1 rounded-md bg-node-bg/80 hover:bg-node-border hover:text-white text-node-dim transition-colors"
                title="Hide Minimap"
            >
                <X size={14} />
            </button>

            <div className="w-full h-full rounded-lg overflow-hidden border border-node-border bg-node-bg">
                <svg
                    ref={svgRef}
                    width={mapWidth}
                    height={mapHeight}
                    viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                    className="cursor-crosshair w-full h-full touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {/* Solid Background */}
                    <rect width="100%" height="100%" fill="#1E1C29" />

                    {/* Background Grid Hint */}
                    <pattern id="miniGrid" width={20} height={20} patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#miniGrid)" />

                    {/* Links - Rendered behind nodes */}
                    {minimapSettings.showLinks && GRAPH_EDGES.map((edge, index) => {
                        const sourceNode = nodes[edge.source];
                        const targetNode = nodes[edge.target];

                        if (!sourceNode || !targetNode) return null;

                        // Calculate centers
                        const sx = toMapX(sourceNode.cx);
                        const sy = toMapY(sourceNode.cy);
                        const tx = toMapX(targetNode.cx);
                        const ty = toMapY(targetNode.cy);

                        return (
                            <line
                                key={`${edge.source}-${edge.target}-${index}`}
                                x1={sx}
                                y1={sy}
                                x2={tx}
                                y2={ty}
                                stroke="rgba(255,255,255,0.3)" // Semi-transparent white
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Nodes - Sorted for Z-Index (Big/Expanded Bottom -> Small/Minimized Top -> Active Highest) */}
                    {Object.values(nodes)
                        .sort((a, b) => {
                            const aActive = activeNode === a.id;
                            const bActive = activeNode === b.id;
                            if (aActive) return 1;
                            if (bActive) return -1;

                            const aMin = minimizedNodes.includes(a.id as any);
                            const bMin = minimizedNodes.includes(b.id as any);

                            // Minimized nodes (icons) on top of Expanded nodes (potentially groups)
                            if (aMin && !bMin) return 1;
                            if (!aMin && bMin) return -1;

                            // Otherwise sort by size (Large Area -> Bottom)
                            const aArea = a.width * a.height;
                            const bArea = b.width * b.height;
                            return bArea - aArea;
                        })
                        .map(node => {
                            const { isZoomedOut } = calculateLodState({
                                scale,
                                viewportSize,
                                dimensions: { width: node.width, height: node.height },
                                isActive: activeNode === node.id,
                                isImmune: lodImmuneNodes.includes(node.id as any),
                                isMinimized: minimizedNodes.includes(node.id as any)
                            });

                            // Use LOD dimensions if zoomed out (minimized/auto-collapsed), otherwise use actual dimensions
                            const baseW = isZoomedOut ? LOD_WIDTH : node.width;
                            const baseH = isZoomedOut ? LOD_HEIGHT : node.height;

                            // [Shiro] MINIMAP SIZING:
                            // Minimized -> Fixed Icon Size (12x8) for visibility.
                            // Expanded -> Accurate Scale for representation.

                            // Calculate center position on map
                            const mapCx = toMapX(node.cx);
                            const mapCy = toMapY(node.cy);

                            // Scaled Logic
                            let w, h;
                            if (isZoomedOut) {
                                w = 12; h = 8;
                            } else {
                                w = Math.max(baseW * scaleX, 2);
                                h = Math.max(baseH * scaleY, 2);
                            }

                            // Draw centered
                            const x = mapCx - w / 2;
                            const y = mapCy - h / 2;

                            return (
                                <rect
                                    key={node.id}
                                    x={x}
                                    y={y}
                                    width={w}
                                    height={h}
                                    fill={
                                        activeNode === node.id
                                            ? "#8B5CF6" // Active (Brand Purple)
                                            : isZoomedOut
                                                ? "#364F6B" // Minimized (Darker Soft Blue)
                                                : "#638ECB" // Normal (Soft Blue)
                                    }
                                    rx={isZoomedOut ? 2 : 1}
                                />
                            );
                        })}

                    {/* Viewport Frame */}
                    <rect
                        x={vpX}
                        y={vpY}
                        width={vpW}
                        height={vpH}
                        fill="transparent"
                        stroke="#8B5CF6"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        style={{
                            outline: '1000px solid rgba(0, 0, 0, 0.3)' // Dim everything outside viewport
                        }}
                    />
                </svg>
            </div>
        </div>
    );
};

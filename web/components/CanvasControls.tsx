import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Map, MapPinOff, Maximize, ChevronDown, ZoomIn, ZoomOut, Search, MousePointer2, Hand, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CANVAS_BOUNDS } from '../lib/constants';
import { SEARCH_INDEX } from './NodeRegistry';
import { SearchItem } from '../lib/search-definitions';
import { CornerDownRight, X } from 'lucide-react';

interface CanvasControlsProps {
    onReset: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({ onReset }) => {
    // Store
    const scale = useStore((state) => state.scale);
    const setTransform = useStore((state) => state.setTransform);
    const translation = useStore((state) => state.translation);
    const viewportSize = useStore((state) => state.viewportSize);
    const nodes = useStore((state) => state.nodes);

    const isMinimapVisible = useStore((state) => state.isMinimapVisible);
    const toggleMinimap = useStore((state) => state.toggleMinimap);

    // Search
    const isSearchOpen = useStore((state) => state.isSearchOpen);
    const setSearchOpen = useStore((state) => state.setSearchOpen);

    // Canvas Mode
    const canvasMode = useStore((state) => state.canvasMode);
    const setCanvasMode = useStore((state) => state.setCanvasMode);
    const setActiveNode = useStore((state) => state.setActiveNode);
    const setHighlightedField = useStore((state) => state.setHighlightedField);

    // Local State
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [activeMenu, setActiveMenu] = useState<'mode' | 'zoom' | 'search' | null>(null);

    // Restored State
    const [zoomInputValue, setZoomInputValue] = useState(String(Math.round(scale * 100)));
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchItem[]>([]);

    // Derived states for backward compatibility/readability
    const isModeMenuOpen = activeMenu === 'mode';
    const isZoomMenuOpen = activeMenu === 'zoom';
    // Search uses global store, so we sync it

    // Toggle Handlers
    const toggleModeMenu = () => {
        if (activeMenu === 'mode') {
            setActiveMenu(null);
        } else {
            setActiveMenu('mode');
            setSearchOpen(false); // Close search if open
        }
    };

    const toggleZoomMenu = () => {
        if (activeMenu === 'zoom') {
            setActiveMenu(null);
        } else {
            setActiveMenu('zoom');
            setSearchOpen(false);
        }
    };

    const toggleSearch = () => {
        if (isSearchOpen) {
            setSearchOpen(false);
            // No need to set activeMenu since search is separate store state,
            // but we ensure others are closed
        } else {
            setSearchOpen(true);
            setActiveMenu(null); // Close local menus
        }
    };

    // Search Effects
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isSearchOpen]);

    // [Shiro] Context for Filtering
    const config = useStore((state) => state.config);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const lowerQuery = searchQuery.toLowerCase();

        const results = SEARCH_INDEX.filter(item => {
            // [Shiro] Context Check: If item relies on specific optimizers, check if current one is valid
            if (item.validOptimizers) {
                if (!item.validOptimizers.includes(config.optimizerType)) {
                    return false;
                }
            }

            return (
                item.label.toLowerCase().includes(lowerQuery) ||
                item.id.toLowerCase().includes(lowerQuery) ||
                item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
            );
        });
        setSearchResults(results);
    }, [searchQuery, config.optimizerType]); // Re-run when query OR optimizer changes

    const handleSearchResultClick = (item: SearchItem) => {
        const node = nodes[item.nodeId];

        if (node) {
            // Calculate center of the target Node
            const targetX = node.cx;
            const targetY = node.cy;

            // Center of the screen
            const screenCX = viewportSize.width / 2;
            const screenCY = viewportSize.height / 2;

            // Target scale
            const targetScale = 1; // Zoom in to default 1

            // Calculate new translation to put Node in center
            // screenCX = targetX * scale + tx
            // tx = screenCX - targetX * scale
            const newTx = screenCX - targetX * targetScale;
            const newTy = screenCY - targetY * targetScale;

            setTransform(newTx, newTy, targetScale);
            setActiveNode(item.nodeId);
            setHighlightedField(item.id);

            // Close search but keep highlight for a moment
            setSearchOpen(false);

            // Auto-remove highlight after 3 seconds
            setTimeout(() => {
                setHighlightedField(null);
            }, 3000);
        }
    };

    // Sync input with scale updates
    useEffect(() => {
        if (!isZoomMenuOpen) {
            setZoomInputValue(String(Math.round(scale * 100)));
        }
    }, [scale, isZoomMenuOpen]);

    const handleZoom = (newScale: number) => {
        newScale = Math.min(Math.max(newScale, 0.1), 5);

        // Zooming towards center of screen
        const vw = viewportSize.width;
        const vh = viewportSize.height;
        const cx = vw / 2;
        const cy = vh / 2;

        const worldX = (cx - translation.x) / scale;
        const worldY = (cy - translation.y) / scale;

        const newTx = cx - worldX * newScale;
        const newTy = cy - worldY * newScale;

        setTransform(newTx, newTy, newScale);
    };

    const handleFitView = () => {
        const nodeValues = Object.values(nodes);
        if (nodeValues.length === 0) {
            onReset(); // Fallback to reset if empty
            return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodeValues.forEach(node => {
            minX = Math.min(minX, node.cx - node.width / 2);
            minY = Math.min(minY, node.cy - node.height / 2);
            maxX = Math.max(maxX, node.cx + node.width / 2);
            maxY = Math.max(maxY, node.cy + node.height / 2);
        });

        // Add padding
        const PADDING = 100;
        const width = maxX - minX + PADDING * 2;
        const height = maxY - minY + PADDING * 2;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        // Calculate Scale
        const scaleX = viewportSize.width / width;
        const scaleY = viewportSize.height / height;
        let newScale = Math.min(scaleX, scaleY);

        // Clamp scale
        newScale = Math.min(Math.max(newScale, 0.1), 2.0); // Don't zoom in crazy close if only 1 node

        // Calculate Translation to center everything
        // Center of viewport = (cx * scale) + tx
        // tx = (viewport.width / 2) - (cx * scale)
        const newTx = (viewportSize.width / 2) - (cx * newScale);
        const newTy = (viewportSize.height / 2) - (cy * newScale);

        setTransform(newTx, newTy, newScale);
    };

    const handleZoomInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseInt(zoomInputValue, 10);
        if (!isNaN(val)) {
            handleZoom(val / 100);
            setActiveMenu(null);
        }
    };

    // [Shiro] Click Away Listener
    const controlsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent | PointerEvent) => {
            // Check if click is outside ref
            if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
                setSearchOpen(false);
            }
        };

        // [Shiro] Use pointerdown because Canvas calls preventDefault() which blocks mousedown
        document.addEventListener('pointerdown', handleClickOutside);

        return () => {
            document.removeEventListener('pointerdown', handleClickOutside);
        };
    }, [setSearchOpen]);

    return (
        <div
            ref={controlsRef}
            className="flex flex-col items-end gap-2 pointer-events-auto select-none relative z-[60]"
            onPointerDown={(e) => e.stopPropagation()}
        >

            {/* unified Control Bar */}
            <div className="w-full flex items-center justify-between bg-node-bg/90 backdrop-blur-md border border-node-border rounded-lg shadow-2xl p-1 h-10 relative">

                {/* Search Popup Overlay */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 w-full mb-2 bg-node-bg-active backdrop-blur-xl border border-node-border rounded-lg shadow-2xl overflow-hidden origin-bottom z-50"
                        >
                            <div className="p-2 border-b border-node-border flex items-center gap-2">
                                <Search size={14} className="text-node-header" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search parameters..."
                                    className="bg-transparent border-none outline-none text-sm text-node-text placeholder-node-header w-full font-mono"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button onClick={() => setSearchOpen(false)} className="text-[#5B5680] hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                            {searchResults.length > 0 ? (
                                <div
                                    className="max-h-48 overflow-y-auto custom-scrollbar"
                                    onWheel={(e) => e.stopPropagation()}
                                >
                                    {searchResults.map((item, index) => (
                                        <div
                                            key={`${item.id}-${index}`}
                                            className="px-3 py-2 hover:bg-node-border/50 cursor-pointer flex items-center justify-between group"
                                            onClick={() => handleSearchResultClick(item)}
                                        >
                                            <span className="text-xs text-node-text font-mono">{item.label}</span>
                                            <CornerDownRight size={12} className="text-node-header opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="p-3 text-center text-[10px] text-node-header font-mono uppercase">No matches found</div>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 1. Mode Selector */}
                <div className="relative">
                    <button
                        onClick={toggleModeMenu}
                        className={`group flex items-center justify-center gap-1.5 pr-2 h-8 rounded hover:bg-node-border transition ${isModeMenuOpen ? 'bg-node-border text-white' : 'text-node-dim hover:text-white'}`}
                        title="Select Mode"
                    >
                        <div className="w-8 h-8 flex items-center justify-center bg-node-border rounded text-white">
                            {canvasMode === 'pointer' ? <MousePointer2 size={16} /> : <Hand size={16} />}
                        </div>
                        <ChevronDown size={12} className="opacity-50 group-hover:opacity-100" />
                    </button>

                    <AnimatePresence>
                        {isModeMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full mb-2 left-0 w-32 bg-node-bg-active border border-node-border rounded shadow-xl overflow-hidden flex flex-col z-50 p-1"
                            >
                                <button onClick={() => { setCanvasMode('pointer'); setActiveMenu(null); }} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                                    <MousePointer2 size={14} />
                                    <span>Select</span>
                                    {canvasMode === 'pointer' && <Check size={12} className="ml-auto text-brand-primary" />}
                                </button>
                                <button onClick={() => { setCanvasMode('hand'); setActiveMenu(null); }} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center gap-2">
                                    <Hand size={14} />
                                    <span>Hand</span>
                                    {canvasMode === 'hand' && <Check size={12} className="ml-auto text-brand-primary" />}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-[1px] h-4 bg-node-border/50" />

                {/* 2. View Controls Group */}
                <div className="flex items-center gap-1">
                    {/* Fit */}
                    <button
                        onClick={handleFitView}
                        className="p-1.5 hover:bg-node-border rounded text-node-dim hover:text-white transition"
                        title="Fit View (F)"
                    >
                        <Maximize size={16} />
                    </button>

                    {/* Zoom */}
                    <div className="relative">
                        <button
                            onClick={toggleZoomMenu}
                            className="flex items-center gap-2 px-2.5 h-8 hover:bg-node-border rounded text-node-dim hover:text-white transition text-xs font-mono min-w-[50px] justify-center group"
                        >
                            <span>{Math.round(scale * 100)}%</span>
                            <ChevronDown size={14} className="opacity-50 group-hover:opacity-100" />
                        </button>

                        <AnimatePresence>
                            {isZoomMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, x: "-50%" }}
                                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                                    exit={{ opacity: 0, y: 10, x: "-50%" }}
                                    className="absolute bottom-full mb-2 left-1/2 w-48 bg-node-bg-active border border-node-border rounded shadow-xl overflow-hidden flex flex-col z-50 p-1"
                                >
                                    <button onClick={() => { handleZoom(scale * 1.2); }} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center justify-between">
                                        <span>Zoom In</span>
                                        <span className="text-[10px] text-node-dim">Alt + =</span>
                                    </button>
                                    <button onClick={() => { handleZoom(scale / 1.2); }} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center justify-between">
                                        <span>Zoom Out</span>
                                        <span className="text-[10px] text-node-dim">Alt + -</span>
                                    </button>
                                    <button onClick={() => { handleFitView(); setActiveMenu(null); }} className="px-2 py-1.5 text-xs text-left hover:bg-node-border text-node-text rounded flex items-center justify-between">
                                        <span>Zoom To Fit</span>
                                        <span className="text-[10px] text-node-dim">F</span>
                                    </button>

                                    <div className="h-[1px] bg-node-border my-1" />

                                    <form onSubmit={handleZoomInputSubmit} className="px-2 py-1">
                                        <div className="flex items-center border border-node-border rounded bg-node-bg px-2 py-1">
                                            <input
                                                type="text"
                                                value={zoomInputValue}
                                                onChange={(e) => setZoomInputValue(e.target.value)}
                                                className="w-full bg-transparent border-none outline-none text-xs text-node-text font-mono"
                                            />
                                            <span className="text-xs text-node-dim">%</span>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-[1px] h-4 bg-node-border/50" />

                    {/* 3. Toggles Group */}
                    <div className="flex items-center gap-1">
                        {/* Hide Minimap */}
                        <button
                            onClick={toggleMinimap}
                            className={`w-8 h-8 flex items-center justify-center rounded transition ${isMinimapVisible ? 'bg-node-border text-white' : 'hover:bg-node-border text-node-dim hover:text-white'}`}
                            title={isMinimapVisible ? "Hide Minimap" : "Show Minimap"}
                        >
                            {isMinimapVisible ? (
                                <div className="relative flex items-center justify-center">
                                    <Map size={16} />
                                    {/* Absolute SVG overlaying the Map icon */}
                                    <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        strokeLinecap="round"
                                    >
                                        {/* THE CUTOUT: This line matches the background color to create a gap */}
                                        {/* Replace 'black' with your button's hex color if it's not pure black */}
                                        <line
                                            x1="2" y1="2" x2="22" y2="22"
                                            stroke="black"
                                            strokeWidth="4"
                                        />

                                        {/* THE VISIBLE SLASH: This is your white line */}
                                        <line
                                            x1="2" y1="2" x2="22" y2="22"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <Map size={16} />
                            )}
                        </button>

                        {/* Search */}
                        <button
                            onClick={toggleSearch}
                            className={`w-8 h-8 flex items-center justify-center rounded transition ${isSearchOpen ? 'bg-node-border text-white' : 'hover:bg-node-border text-node-dim hover:text-white'}`}
                            title="Search Nodes (Space)"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

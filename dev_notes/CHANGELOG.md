# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025-12-16]

### Added
- Integrated "Hand" and "Select" modes, Fit View, and a robust Zoom Menu.
- Added a settings panel to the minimap (Node Colors, Show Links, etc.).
- Moved search toggle to the main toolbar.
- Implemented Minimap Links rendering (visual connection lines between nodes).

### Changed
- Solid background for better visibility, aligned to bottom-right with controls.
- Disabled node dragging when in "Hand" mode.
- Refactored Search Menu to overlay the control bar for a unified look.
- Updated Minimap Toggle to use a custom "Map with Slash" icon.

### Fixed
- Enforced mutual exclusivity for control menus (Zoom, Mode, Search).
- Fixed Zoom Menu centering alignment.

## [2025-12-15]

### Added
- Implemented hard limits for panning and zooming. The viewport is now clamped to specific world bounds (-10000 to 12000), preventing users from getting lost in infinite space.
- Added static invisible bodies around the world bounds. Nodes can no longer be thrown or pushed outside the playable area.

### Fixed
- Hiding Grid/World until hydration is complete.
- Initializing nodes with `opacity: 0` and fading them in.
- Pre-seeding physics motion values with stored positions to preventing `(0,0)` teleportation.
- Initialization Animations:
- Pinned Nodes: Fixed an issue where pinned nodes would animate "open" from small size on load. They now instant-jump to full size.
- Zoomed Out Nodes: Fixed an issue where nodes would animate "closed" from full size if loaded in a zoomed-out state. They now instant-jump to LOD size.
- Manual Drag Escape: Fixed an exploit where users could drag nodes through walls by moving the mouse cursor fast enough. The drag constraint is now clamped to the world bounds (accounting for node size), effectively "leashing" the node to the wall.

## [2025-12-14]

### Changed
- LOD Logic: Pinned nodes (`isImmune`) now correctly ignore the global zoom-out threshold, remaining visible at any distance.
- Refactored `ToggleInput` to be a generic, shared component supporting both text and number types.
- Applied the new `ToggleInput` to Learning Rates, Gradient Accumulation, and Keep Tokens Separator for consistent behavior.

### Fixed
- Fixed a regression where connection lines would detach and point to the wrong location while resizing a node.
- Updated `Connection` component to use a reactive `useSpring` pipeline on shared `MotionValues`, preventing crashes and ensuring 60fps synchronization with node resizing.
- Removed `will-change: transform` from nodes to fix permanent font blurring issues on some screens.
- Implemented a custom `Select` component to eliminate the white flash seen with native browser selects.

## [2025-12-07]

### Changed
- Reordered dynamic optimizer arguments in Training Node to prioritizing entry fields over toggles, with smart spacing to ensure toggles always start on a new row.
- Removed `pointer-events-none` from multiple disabled sections (Bucketing, Network) to restore hover interactions.
- Added `cursor-not-allowed` to disabled inputs for "Gradient Accumulation", "Keep Tokens Separator", and "Dropout", providing consistent feedback across the app.
- Gradient Accumulation toggle now preserves the user's input value when disabled/re-enabled (cached).
- "Clip Skip" input and "Keep Tokens Separator" now properly reflect disabled state when applicable.

## [2025-12-06]

### Changed
- Replaced `d3-force` documentation with `Matter.js` details in `PHYSICS_GUIDE.md`
- Increased physics expansion speed (`lerpFactor` 0.4) for snappier feedback
- Implemented "Wake Neighbors" logic to ensure immediate repulsion during node expansion
- Persisted `activeNode` and `viewportSize` to store to fix initialization glitches
- Updated `Connection` links to track active node expansion even when minimized

### Added
- Added `networkDropout`, `rankDropout`, and `moduleDropout` to Network Node
- Added visual section headers to Network Node (Network Selection, Architecture, Regularization, Algo Specifics)

### Fixed
- Nodes no longer reset to minimized state on browser refresh
- Fixed "popping" animation on load by initializing springs correctly
- Connection links no longer lag behind or detach when expanding a minimized node
- Eliminated split-second layout shift caused by viewport size mismatches on load

## [2025-11-26]

### Added
- Cascading collision detection: Nodes now propagate push forces recursively (A pushes B, B pushes C).
- Wave propagation algorithm for smoother multi-node interaction during drag and resize.

## [2025-11-25]

### Added
- Folder icons to path entry fields in General Args Node (Base Model, External VAE)
- Folder icon to LyCORIS Preset field in Network Node
- Consistent hover effects for all path field icons (gray to violet transition)
- Training Node (formerly Optimizer Node) with dynamic JSON schema support
- Dynamic UI generation for Training Node based on selected optimizer schema
- Reference optimizers: AdaBelief, CAME, OCGOpt with full parameter support
- Python script (`generate_schema.py`) to automate TypeScript schema generation from optimizer source files
- `draggedNode` state to store for decoupled interaction tracking
- Hybrid connection anchoring system for smooth drag/resize tracking

### Changed
- Optimizer Node renamed to Training Node
- "Training Parameters" section renamed to "Run Configuration" in General Args Node
- Gradient Checkpointing toggle now displays without background box
- Gradient Accumulation input now uses toggle-controlled enable/disable with proper disabled styling
- Connections now snap instantly when dragging/resizing to prevent visual lag
- Node resizing now freezes LOD state to prevent flickering
- Dragging a node no longer triggers auto-selection/expansion
- Removed redundant store subscriptions in `Node.tsx`
- Disabled continuous port registration to prevent double-render loops during resize

## [2025-11-24]

### Added
- Network Node UI with algorithm-specific options and toggles
- Block Size field for DyLoRA, DIAG-OFT, and BOFT algorithms
- LyCORIS Preset field (always visible, disabled for LoRA Kohya)
- Context-aware help icons throughout Network Node
- Bucketing section to General Args with enable/disable logic
- Dataset Node with dynamic subset management
- Manual view controls: Pin (LOD immunity) and Minimize buttons
- Canvas state persistence via localStorage
- Dynamic collision detection system for node layout
- Search deep linking with field highlighting

### Changed
- Renamed "LoRA" to "LoRA (Kohya)" for clarity
- Renamed "LoCon (LyCORIS)" to "LoCon" and "DyLoRA (LyCORIS)" to "DyLoRA"
- Updated Conv Dim/Alpha visibility logic (hidden for LoRA Kohya, IA3, DIAG-OFT, BOFT, FULL)
- LoKr Factor field now disabled when Full Matrix is enabled
- LoKr Factor defaults to -1 (auto) instead of empty
- General Args flags reorganized into categories (Model, Precision, Objective, Optimizations)
- Network Node toggle layout to 3-column grid
- Replaced "Eye" icon with "Pin" icon for LOD immunity
- Minimized nodes now auto-expand when clicked if zoom allows

### Removed
- "LoCon (Kohya)" and "DyLoRA (Kohya)" options (deprecated)
- "DyLoRA Unit" field (replaced by Block Size)
- Duplicate Optimizations section in General Args
- Global "Output Directory" field from Dataset node

### Fixed
- Connection lines now point to correct location for minimized nodes
- FPS drops during zooming and dragging (optimized to 200+ FPS)
- Collision detection sync with visual LOD states
- Spacing inconsistencies around separators and grid layouts
- Runtime crashes from missing data in local storage

## [2025-11-22]

### Added
- General Args panel consolidation (Model, Training, Base Args)
- Level of Detail (LOD) system with click-to-expand
- LOD immunity toggle for nodes
- Unified input groups for complex fields
- Modern pill-shaped toggle switches
- Query Intelligence help icons with category-based context
- Canvas state persistence

### Changed
- Optimized LOD calculation with centralized logic (`web/lib/lod.ts`)
- General Args layout to 3x3 grid for Training Parameters
- Flag organization with mutual exclusivity logic
- VAE Padding Mode positioned below External VAE

### Fixed
- Auto-minimize behavior for manually minimized nodes
- Collision physics for minimized states

## [2025-11-21]

### Added
- Next.js 14 migration from Vite
- Tailwind CSS 3.4.1 configuration
- Zustand state management
- Infinite pan/zoom canvas with dynamic grid fade
- Node drag-and-drop with resize physics
- Search popup (Ctrl+K) with field navigation
- Animated connection lines between nodes
- Left sidebar for global project settings

### Changed
- Framework migrated from Vite to Next.js 14.2.3 (App Router)

### Removed
- Legacy Vite configuration and source files

### Fixed
- Node background color (corrected to #232034)
- Performance optimization for canvas rendering
- Store subscription optimization for connection lines

---

For detailed technical information, see [PROGRESS_LOG.md](./PROGRESS_LOG.md).

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

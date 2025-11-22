# Progress Log - Next.js Migration & UI Restoration

## Entry: November 21, 2025

### Summary
Successfully migrated the "Kuro Trainer" frontend from a Vite/React application to a Next.js 14 application, while fully restoring the original premium "Islands" UI design and implementing requested enhancements.

### Key Achievements

#### 1. Infrastructure Migration
- **Framework**: Ported from Vite to **Next.js 14.2.3** (App Router).
- **Styling**: Configured **Tailwind CSS 3.4.1** with the original custom color palette.
- **State Management**: Ported **Zustand** store (`store.ts`) to the new architecture.
- **Cleanup**: Removed all legacy Vite configuration and source files from the root directory.

#### 2. UI Restoration & Polish
- **Islands Architecture**: Re-implemented the core "Island" component with:
    - Correct `#232034` background colors (fixed "too dark" issue).
    - Original drag-and-drop and resize physics.
    - Content scaling via header icon drag or Ctrl+Scroll.
- **Canvas**: Restored the infinite pan/zoom canvas with:
    - **Dynamic Grid**: Implemented a fade-out effect for the grid when zooming out to reduce eye strain.
    - **Connections**: Restored animated connection lines between islands.
- **Sidebar**: Restored the left-hand sidebar for global project settings ("Train Mode").

#### 3. Feature Enhancements
- **Search Deep Linking**:
    - Implemented a search popup (Ctrl+K or button).
    - Clicking a result now **zooms** to the specific island AND **scrolls** the target field into view.
    - Added a visual highlight (violet ring) to the found field.

#### 4. Performance Optimization
- **Issue**: Addressed FPS drops (mid 100s) when zooming and dragging panels.
- **Fixes**:
    - **Connection Lines**: Removed per-frame store subscriptions; lines now only update when crossing LOD thresholds.
    - **Canvas Rendering**: Memoized `Island` components to prevent full re-renders of all islands during drag operations.
    - **Store Selectors**: Optimized `Canvas` state selection to reduce unnecessary updates.
- **Result**: Restored smooth performance (200+ FPS) during complex interactions.

---

## Entry: November 22, 2025

### 1. General Args Panel Implementation
- **Consolidation**: Merged settings from "Model", "Training", and "Base Args" into a single, cohesive "General Args" panel.
- **Refined Layout**:
    - **Unified Input Groups**: Created a custom component pattern for "Gradient Accumulation", "Keep Tokens Separator", and "Max Train Duration" that merges checkboxes/toggles with inputs into a single visual unit.
    - **Toggles**: Replaced standard checkboxes with modern, pill-shaped toggle switches for a cleaner aesthetic.
    - **3x3 Grid**: Optimized the "Training Parameters" section into a perfect 3x3 grid layout.
    - **Optimizations Section**: Created a dedicated, 4-column grid for optimization flags (Xformers, SDPA, etc.).
- **Visual Polish**: Removed extraneous backgrounds and aligned labels/inputs perfectly across different field types.

### 2. Level of Detail (LOD) System Improvements
- **Click to Expand**: Panels now force-expand to full view when clicked, overriding LOD effects.
- **LOD Immunity Toggle**: Added an "Eye" icon to each panel header that allows users to make panels permanently immune to LOD shrinking.
  - **Implementation**: Added `lodImmuneIslands` state array and `toggleLodImmunity` action to the Zustand store.
  - **UI Feedback**: Eye icon shows "open" when immunity is ON (violet color) and "crossed-out" when OFF (gray color).
- **Code Refactor**: Centralized LOD calculation logic:
  - **`web/lib/lod.ts`**: Pure function for LOD state calculations.
  - **`web/hooks/useIslandLOD.ts`**: React hook for components to easily access LOD state.
  - **Benefits**: Single source of truth for threshold logic; easier to maintain and adjust in the future.

### 3. General Args Island Reorganization
- **Flag Consolidation**: Reorganized all model/training flags into a single, well-structured "Flags" section with categorical sub-headers:
  - **Model**: SDXL, SD2.X (mutually exclusive)
  - **Precision**: Full FP16, Full BF16, FP8 Base (mutually exclusive - selecting one disables others)
  - **Training**: V-Prediction, Scale V Loss, Debiased Estimation
  - **Optimizations**: Xformers, SDPA, Cache Latents, Cache Latents to Disk, No Half VAE
- **Mutual Exclusivity Logic**:
  - Precision flags now automatically disable other precision modes when one is selected
  - Xformers and SDPA cannot both be enabled simultaneously
  - Cache Latents to Disk automatically enables Cache Latents when toggled on
  - Disabling Cache Latents also disables Cache Latents to Disk
- **Field Reorganization**:
  - Moved "VAE Padding Mode" field to appear directly below "External VAE" for logical grouping
  - Renamed "To Disk" to "Cache Latents to Disk" for clarity
  - Removed duplicate Optimizations section (now consolidated into Flags)
- **Query Intelligence UX Improvements**:
  - Added help icons to each flag category header (Model, Precision, Training, Optimizations)
  - Updated `FieldWrapper` component to position help icons immediately after labels (instead of far right)
  - Created consistent UX pattern: all Query Intelligence icons now appear with `gap-1.5` spacing after their labels
  - Users can click category help icons to get AI explanations for all flags in that category

### 4. Canvas State Persistence
- **localStorage Integration**: Implemented Zustand persist middleware to save and restore canvas state between sessions.
- **Persisted State**: The following canvas/UI states now persist automatically:
  - Canvas position (`translation`)
  - Zoom level (`scale`)
  - Island positions (`islandPositions`)
  - Island dimensions (`islandDimensions`) - manual panel resizing
  - Content scale within panels
  - LOD immunity status (`lodImmuneIslands`) - which panels are locked from collapsing
  - All configuration values (`config`)
- **Storage Key**: `kuro-canvas-storage` in browser localStorage
- **Reset Functionality**: Existing "Reset Layout" button (LayoutGrid icon) properly clears saved state and restores defaults

### 5. Dynamic Collision Detection System
- **Problem Solved**: Islands could overlap freely on the infinite canvas, creating visual clutter and confusion.
- **Implementation**: Created `web/lib/collision.ts` with physics-like collision handling:
  - **`pushIslandsOnDrag()`**: When dragging an island, other islands are dynamically pushed out of the way
  - **`pushIslandsOnResize()`**: When resizing an island, nearby islands are pushed to make room
  - **Push Direction**: Intelligent direction detection (horizontal or vertical) based on island centers
  - **Chain Reactions**: Islands can push multiple others in sequence (up to 5 iterations to prevent infinite loops)
  - **Padding**: Maintains 20px visual breathing room between islands
- **LOD Awareness**: 
  - Collision detection respects visual boundaries (card mode vs expanded mode)
  - Islands in LOD (card) mode have smaller collision boundaries matching their visual size
  - **LOD Immunity Support**: Locked islands maintain full collision boundaries even when zoomed out
- **User Experience**: No restrictions on movement - islands smoothly slide out of the way, creating a fluid, physics-like interaction on the infinite canvas

## Next Steps
- Verify all specific form inputs and their interactions with the backend.
- Connect the frontend to the FastAPI backend (Python).


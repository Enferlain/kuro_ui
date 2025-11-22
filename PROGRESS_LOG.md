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

## Next Steps
- Verify all specific form inputs and their interactions with the backend.
- Connect the frontend to the FastAPI backend (Python).

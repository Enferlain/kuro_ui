# Progress Log - Next.js Migration & UI Restoration

## Entry: November 21, 2025

### Summary
Successfully migrated the "Kuro Trainer" frontend from a Vite/React application to a Next.js 14 application, while fully restoring the original premium "Nodes" UI design and implementing requested enhancements.

### Key Achievements

#### 1. Infrastructure Migration
- **Framework**: Ported from Vite to **Next.js 14.2.3** (App Router).
- **Styling**: Configured **Tailwind CSS 3.4.1** with the original custom color palette.
- **State Management**: Ported **Zustand** store (`store.ts`) to the new architecture.
- **Cleanup**: Removed all legacy Vite configuration and source files from the root directory.

#### 2. UI Restoration & Polish
- **Nodes Architecture**: Re-implemented the core "Node" component with:
    - Correct `#232034` background colors (fixed "too dark" issue).
    - Original drag-and-drop and resize physics.
    - Content scaling via header icon drag or Ctrl+Scroll.
- **Canvas**: Restored the infinite pan/zoom canvas with:
    - **Dynamic Grid**: Implemented a fade-out effect for the grid when zooming out to reduce eye strain.
    - **Connections**: Restored animated connection lines between Nodes.
- **Sidebar**: Restored the left-hand sidebar for global project settings ("Train Mode").

#### 3. Feature Enhancements
- **Search Deep Linking**:
    - Implemented a search popup (Ctrl+K or button).
    - Clicking a result now **zooms** to the specific Node AND **scrolls** the target field into view.
    - Added a visual highlight (violet ring) to the found field.

#### 4. Performance Optimization
- **Issue**: Addressed FPS drops (mid 100s) when zooming and dragging panels.
- **Fixes**:
    - **Connection Lines**: Removed per-frame store subscriptions; lines now only update when crossing LOD thresholds.
    - **Canvas Rendering**: Memoized `Node` components to prevent full re-renders of all Nodes during drag operations.
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
  - **Implementation**: Added `lodImmuneNodes` state array and `toggleLodImmunity` action to the Zustand store.
  - **UI Feedback**: Eye icon shows "open" when immunity is ON (violet color) and "crossed-out" when OFF (gray color).
- **Code Refactor**: Centralized LOD calculation logic:
  - **`web/lib/lod.ts`**: Pure function for LOD state calculations.
  - **`web/hooks/useNodeLOD.ts`**: React hook for components to easily access LOD state.
  - **Benefits**: Single source of truth for threshold logic; easier to maintain and adjust in the future.

### 3. General Args Node Reorganization
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
  - Node positions (`nodePositions`)
  - Node dimensions (`nodeDimensions`) - manual panel resizing
  - Content scale within panels
  - LOD immunity status (`lodImmuneNodes`) - which panels are locked from collapsing
  - All configuration values (`config`)
- **Storage Key**: `kuro-canvas-storage` in browser localStorage
- **Reset Functionality**: Existing "Reset Layout" button (LayoutGrid icon) properly clears saved state and restores defaults

### 5. Dynamic Collision Detection System
- **Problem Solved**: Nodes could overlap freely on the infinite canvas, creating visual clutter and confusion.
- **Implementation**: Created `web/lib/collision.ts` with physics-like collision handling:
  - **`pushNodesOnDrag()`**: When dragging an Node, other Nodes are dynamically pushed out of the way
  - **`pushNodesOnResize()`**: When resizing an Node, nearby Nodes are pushed to make room
  - **Push Direction**: Intelligent direction detection (horizontal or vertical) based on Node centers
  - **Chain Reactions**: Nodes can push multiple others in sequence (up to 5 iterations to prevent infinite loops)
  - **Padding**: Maintains 20px visual breathing room between Nodes
- **LOD Awareness**: 
  - Collision detection respects visual boundaries (card mode vs expanded mode)
  - Nodes in LOD (card) mode have smaller collision boundaries matching their visual size
  - **LOD Immunity Support**: Locked Nodes maintain full collision boundaries even when zoomed out
- **User Experience**: No restrictions on movement - Nodes smoothly slide out of the way, creating a fluid, physics-like interaction on the infinite canvas

## Next Steps
- Verify all specific form inputs and their interactions with the backend.
- Connect the frontend to the FastAPI backend (Python).


---

## Entry: November 23, 2025

### 1. Dataset Node Overhaul
- **Subsets Architecture**: Completely refactored the Dataset node to support multiple subsets, each with independent configurations.
- **Dynamic UI**:
    - **Add/Remove Subsets**: Users can dynamically add or remove subset cards.
    - **Comprehensive Config**: Each subset supports its own paths (Image, Target, Masked), basic settings (Repeats, Keep Tokens), and toggles (Shuffle, Augments).
    - **Optional Arguments**: Collapsible sections for advanced features like Face Crop, Caption Dropout, and Token Warmup.
- **Cleanup**: Removed the global "Output Directory" field as it was deemed out of scope for the Dataset node.

### 2. Manual View Controls
- **Pin (Immunity)**: Replaced the "Eye" icon with a **Pin** icon.
    - **Function**: Keeps a node expanded ("Detailed View") even when zoomed out far enough that it would normally collapse.
- **Minimize (Force Card)**: Added a **Minimize** icon.
    - **Function**: Forces a node into "Card View" (LOD view) regardless of zoom level.
- **Refined Interaction**:
    - **Mutual Exclusivity**: Pinning a node automatically un-minimizes it. Minimizing a node automatically un-pins it.
    - **Peek Logic**: Clicking a minimized node "peeks" it (expands it temporarily). The Minimize button remains available to close the peek immediately.

### 3. UI & UX Refinements
- **Alignment Fixes**:
    - **DataNode**: Fixed alignment of the Trash icon (delete subset) and Folder icons within input fields to be pixel-perfect.
- **Link Connections**: Fixed an issue where connection lines would point to the wrong location when a node is minimized. Links now correctly snap to the card's edges in minimized mode.
- **Canvas Consistency**: Ensured `DataNode` shares the exact same canvas behavior (drag, scroll, LOD) as `GeneralArgsNode` and updated its default dimensions to match.

### 4. Subset Card Interaction Refinements
- **Editable Header**:
    - **Direct Renaming**: Subset names are now directly editable within the card header.
    - **Dynamic Sizing**: The name input field automatically adjusts its width to fit the text content.
    - **Visual Cues**: Added a subtle "Pencil" icon that appears on hover to indicate editability.
- **Improved Hitboxes**:
    - **Unified Edit Zone**: Wrapped the name input and pencil icon in a larger, unified click target with extra padding.
    - **Conflict Prevention**: Clicking the name/edit zone stops propagation, preventing accidental card collapse.
    - **Header Toggle**: Clicking anywhere else on the header toggles the collapse/expand state.
- **Focus Management**:
    - **Click-Away Blur**: Clicking the canvas background now automatically blurs any active input field, improving the "deselect" experience.
- **Layout Fixes**:
    - **Header Height**: Used negative margins to ensure the larger click targets don't increase the visual height of the header.

### 5. Canvas & Node Interaction Polish
- **Smart Un-Minimize**:
    - **Logic Update**: Manually minimized nodes now automatically "un-minimize" when activated if the current zoom level allows them to be expanded. This fixes an issue where nodes would re-collapse immediately after being deselected.
    - **Behavior**: Clicking a minimized node while zoomed in keeps it expanded; clicking while zoomed out (LOD mode) keeps it as a temporary peek.
- **Visual Indicators**:
    - **Minimize Icon**: Added a "Minimize" icon to the top-right of the card view (LOD view) when a node is manually minimized. This clearly distinguishes manually minimized nodes from those that are simply auto-collapsed due to zoom.
- **Collision Physics Upgrade**:
    - **Minimized State Awareness**: The collision system now correctly detects if a node is minimized (manually or via zoom) and uses its smaller "Card Size" boundary for physics calculations.
    - **Logic Synchronization**: Synchronized the collision engine's LOD logic with the visual rendering engine's logic (using exact viewport thresholds). This ensures that what you see is exactly what you collide with, eliminating "ghost" collisions around expanded-looking nodes that physics treated as cards.

### 6. BucketUI Integration
-   **New "Bucketing" Section**:
    -   **Implementation**: Added a dedicated "Bucketing" section to the `GeneralArgsNode` component.
    -   **Reordering**: Reorganized the Node's layout to follow a logical flow: Model -> Training -> Resolution -> Bucketing.
    -   **New Fields**:
        -   **Enable Bucketing**: Main toggle to enable/disable the entire feature.
        -   **Don't Upscale Images**: Toggle switch.
        -   **Min/Max Bucket Resolution**: Number inputs for defining resolution boundaries.
        -   **Bucket Resolution Steps**: Number input for step size.
    -   **UX Refinement**: Implemented a "disabled state" logic where turning off the main "Bucketing" toggle visually dims and disables all related input fields, preventing accidental edits while keeping settings visible.
-   **State Management**:
    -   Updated `TrainingConfig` interface (`types.ts`) and Zustand store (`store.ts`) to support the new bucketing parameters (`enableBucket`, `minBucketReso`, `maxBucketReso`, `bucketResoSteps`, `bucketNoUpscale`).

### 7. Network Node Implementation
-   **New Component**: Created `NetworkNode.tsx` with a tabbed interface (Main, Layers, Args).
-   **Main Tab**: Implemented configuration fields for:
    -   **Network Algo**: Dropdown for selecting algorithm (LoRA, LoHa, etc.).
    -   **LyCORIS Preset**: Input for preset path.
    -   **Dimensions**: Network Dim/Alpha and Conv Dim/Alpha inputs.
-   **Args Tab**: Implemented a dynamic key-value pair list for adding arbitrary network arguments.
-   **Visual Polish**:
    -   **Separators**: Added visual separators to group related fields (Algo/Preset, Dims, Conv Dims).
    -   **Spacing**: Ensured consistent 20px spacing between all sections using `space-y-5` and margin collapse, mirroring the `GeneralArgsNode` style.
-   **Robustness**:
    -   **Runtime Safety**: Implemented fallback logic in `Canvas.tsx`, `Node.tsx`, and `NetworkNode.tsx` to handle missing data in local storage gracefully, preventing application crashes when loading older state.

### 8. Node Styling Standardization
-   **Shared Components**: Introduced `NodeSeparator` and `NodeHeader` components in `web/components/NodeStyles.tsx` to ensure consistent styling across all nodes.
-   **Refactoring**: Updated `NetworkNode`, `GeneralArgsNode`, `DataNode`, and `OptimizerNode` to use these shared components, replacing inconsistent manual styling.
-   **Spacing Fixes**:
    -   Removed the default `mb-5` margin from `FieldWrapper` in `FormComponents.tsx`. This resolved an issue where grid layouts had double the vertical spacing compared to block layouts. Spacing is now consistently controlled by parent containers.
    -   Refactored `GeneralArgsNode` to split "Model Configuration" and "Flags" into separate sections, ensuring the separator between them has equal spacing (20px) above and below, matching the rest of the UI.

---

## Entry: November 24, 2025

### 1. Network Node Refinement
- **Dynamic UI Architecture**:
    - **Algorithm-Aware Rendering**: The UI now dynamically adapts based on the selected "Network Algo", showing only relevant options for each algorithm (LoRA, LoCon, LoHa, LoKr, IA3, DyLoRA, etc.).
    - **Smart Defaults**: Implemented logic to handle default values and visibility for algorithm-specific settings.
- **Visual & UX Polish**:
    - **Standardized Toggles**: Replaced custom toggle implementations with the shared `Toggle` component, removing redundant "Enabled/Disabled" text labels for a cleaner look.
    - **3-Column Grid**: Organized boolean flags into a dense, readable 3-column grid layout.
    - **"Toggle + Input" Pattern**: Implemented a unified pattern for optional numeric fields (like `Constraint` and `Factor`) where the input is visually merged with its enabling toggle.
- **Layout Reorganization**:
    - **Logical Ordering**: Reordered settings to prioritize input fields (DyLoRA Unit, Factor, Constraint) at the top, followed by the grid of toggles.
    - **Toggle Grouping**: Within the grid, algorithm-specific toggles (e.g., LoKr's "Full Matrix") appear first, followed by common toggles (Weight Decomposition), and finally general toggles (Train Norm, Bypass).
- **Smart Logic**:
    - **WD on Output**: Made `wd_on_output` always visible when applicable. Enabling it automatically enables the parent `weight_decomposition` flag.
    - **LoKr Factor**: Implemented specific logic for the Factor field, allowing it to be toggled between "Auto" (-1) and a manual numeric value.

### 2. Network Node UI Adjustments
- **Option Renaming**:
    - Renamed "LoRA" to "LoRA (Kohya)" to clarify the implementation.
    - Renamed "LoCon (LyCORIS)" to "LoCon" and "DyLoRA (LyCORIS)" to "DyLoRA" for cleaner labels.
    - Removed "LoCon (Kohya)" and "DyLoRA (Kohya)" from the dropdown (deprecated implementations).
- **Visibility Logic Refinements**:
    - **Conv Dim/Alpha**: Updated visibility to hide for `LoRA (Kohya)`, `IA3`, `DIAG-OFT`, `BOFT`, and `FULL` algorithms.
    - **Block Size**: Added new "Block Size" field (default: 4) visible for `DyLoRA`, `DIAG-OFT`, and `BOFT`.
    - **DyLoRA Unit**: Removed redundant "DyLoRA Unit" field - replaced by "Block Size".
    - **Preset Field**: Made "LyCORIS Preset" always visible but disabled (with opacity fade) when `LoRA (Kohya)` is selected, matching the General Args bucketing style.
- **LoKr QoL Improvements**:
    - **Factor Field**: Applied disabled styling (`opacity-50 pointer-events-none`) when "Full Matrix" toggle is enabled, preventing conflicting configurations.
    - **Factor Default**: Ensured "Factor" field defaults to `-1` (auto) instead of empty, with proper fallback logic.
- **State Management**:
    - Added `networkBlockSize` to `TrainingConfig` interface and store with default value of 4.

---

## Entry: November 25, 2025

### 1. Path Entry Field Enhancements
- **Folder Icons**: Added folder icons to path entry fields for improved UX and visual consistency:
    - **General Args Node**:
        - Added `FolderOpen` icon to "Base Model" field
        - Added `FolderOpen` icon to "External VAE" field
    - **Network Node**:
        - Added `FolderOpen` icon to "LyCORIS Preset" field
- **Implementation Details**:
    - Icons positioned absolutely on the right side of input fields (`right-3 top-9`)
    - Consistent hover effect: icons transition from gray (`#484463`) to violet (`violet-400`)
    - Wrapped input fields in `relative group cursor-pointer` containers for proper icon positioning
    - Icons match the existing design pattern from Dataset Node subset path fields
- **Visual Consistency**: All path-related input fields across the application now share the same visual language

### 2. Training Node Implementation (formerly Optimizer Node)
- **Dynamic Architecture**:
    - **JSON Schema Driven**: The entire UI for the Training Node is now generated dynamically from a JSON schema (`web/lib/optimizer-schema.ts`). This allows for instant support of new optimizers without manual UI coding.
    - **Automated Schema Generation**: Created a Python script (`generate_schema.py`) that parses Python optimizer source files (`ref_opt_*.py`) and automatically generates the TypeScript schema. This bridges the gap between backend definitions and frontend UI.
- **Advanced Optimizer Support**:
    - **Reference Optimizers**: Fully integrated complex optimizers like **AdaBelief**, **CAME**, and **OCGOpt**.
    - **Dynamic Fields**: The UI correctly renders specific fields for each optimizer (e.g., "Rectify" for AdaBelief, "Update Strategy" for CAME) based on the schema.
    - **Tuple Handling**: Automatically splits tuple arguments (like `betas`) into individual UI fields (`beta1`, `beta2`).
- **Renaming & Refinement**:
    - Renamed "Optimizer Node" to "**Training Node**" to better reflect its scope (Optimizer + Scheduler + future training settings).
    - Renamed "Training Parameters" section in General Args to "**Run Configuration**".

### 3. General Args Node Refinements
- **Gradient Section Polish**:
    - **Gradient Checkpointing**: Simplified the UI by removing the background box, presenting it as a clean, standalone toggle.
    - **Gradient Accumulation**:
        - **Enabled State Logic**: Implemented a "toggle + input" pattern. The toggle enables/disables the input field.
        - **Value Preservation**: Toggling OFF resets the value to 1. Toggling ON restores editability without auto-incrementing the value.
        - **Visual Consistency**: Fixed the disabled state styling to match the "Bucketing" section (faded background and text), ensuring a uniform look for disabled inputs across the app.

### 4. Connection & Interaction System Overhaul
- **Dynamic Port Anchoring**:
    - **Problem**: Connections were anchoring to static positions, causing visual disconnects during resizing and LOD transitions.
    - **Solution**: Implemented a hybrid anchoring system. `Canvas` now calculates connection points dynamically based on the node's current visual state (LOD vs Detailed) and dimensions.
    - **Optimization**: Initially implemented a "push" model where nodes reported port positions to the store, but this caused double-renders. Switched to a "pull" model where `Canvas` calculates positions on-demand using shared logic.
- **Drag & Resize Physics**:
    - **Decoupled Selection**: Dragging a node no longer triggers "selection" (which caused auto-expansion). Added `draggedNode` state to track physical manipulation separately from UI focus.
    - **Instant Snapping**: Connections attached to a node being dragged or resized now snap instantly (0s duration) to track the cursor perfectly, while other connections animate smoothly (0.3s).
    - **Resize Lag Fix**: Fixed an issue where connections would "lag behind" a resizing node by ensuring the resize action also flags the node as "being manipulated".
- **LOD Stability**:
    - **Resize Freeze**: Modified `useNodeLOD` to "freeze" the LOD state while a node is being resized. This prevents the node from flickering between "Card" and "Detailed" views if the user crosses the size threshold mid-drag.

---
---

## Entry: November 26, 2025

### 1. Cascading Node Collision
- **Problem**: Previously, collision detection was limited to a single layer of interaction. Dragging Node A into Node B would push Node B, but if Node B then overlapped with Node C, Node C would remain stationary. This created unnatural overlaps in dense layouts.
- **Solution**: Implemented a recursive "wave propagation" algorithm for collision detection.
    - **Logic**: When a node moves (due to drag or push), it is added to a queue. The system iteratively checks if these moved nodes collide with any others, propagating the force through the graph.
    - **Safety**: Added a `MAX_ITERATIONS` limit (10) to prevent infinite loops or performance degradation in complex cycles.
    - **Consistency**: Applied the same cascading logic to both drag and resize operations.
- **Result**: A true "physical" feel where pushing a node into a cluster causes the entire cluster to shuffle and reorganize naturally, maintaining the defined padding between all elements.

---

## Entry: December 6, 2025

### 1. Physics Engine Tuning
- **Documentation Update**: Rewrote `PHYSICS_GUIDE.md` to accurately reflect the `Matter.js` implementation, documenting the hybrid loop, interaction models (Drag/Resize/Expand), and critical constants.
- **Responsiveness**:
    - **Expansion Speed**: Increased `lerpFactor` from 0.1 to 0.4 to make nodes expand faster visually, reducing the feeling of "lag" when activating a node.
    - **Wake Neighbors**: Fixed a physics sleeping issue where neighboring nodes would ignore an expanding node until deep overlap occurred. Added logic to explicitly wake up all neighbors (`Matter.Sleeping.set(b, false)`) the moment an expansion starts, ensuring immediate and forceful repulsion.

### 2. State Persistence & Initialization Fixes
- **Active Node Persistence**: Fixed an issue where the currently active (expanded) node would collapse upon page refresh.
    - **Root Cause**: The `activeNode` ID was not being persisted to `localStorage`.
    - **Fix**: Added `activeNode` to the persistence whitelist in `store.ts`.
- **Viewport Stability**: Fixed a "popping" animation on page load.
    - **Root Cause**: The app initialized with a default 1920x1080 viewport, calculated LOD state based on that, and then snapped to the actual screen size frames later, causing nodes to shrink/grow unexpectedly.
    - **Fix**: Persisted `viewportSize` so correct LOD calculations happen on the very first render frame.
- **Animation Glitch**: Fixed an issue where an active node would "animate" open from 0px on refresh.
    - **Fix**: Modified `Node.tsx` to detect if a node is active on mount and force the animation spring to `jump()` instantly to its target size, bypassing the transition.

### 3. Connection Link Logic
- **Minimized State Fix**: Fixed a visual bug where connection lines would point to the "minimized" center of a node even if that node was currently active and expanded.
- **Logic Update**: Updated `Canvas.tsx` to rely solely on the `isSourceLOD` / `isTargetLOD` flags. These flags correctly account that an **Active** node is never in LOD mode, regardless of its minimized setting in the store.

### 4. Network Node Enhancements
- **Dropout Section**:
    - **New Fields**: Added `networkDropout`, `rankDropout`, and `moduleDropout` to the configuration and UI.
    - **UI Pattern**: Implemented a "Toggle + Input" pattern mimicking the Gradient Accumulation field.
        - **Persistence**: Input value is preserved locally even when the toggle is OFF.
        - **Visuals**: Disabled inputs have a dimmed background (opacity 50%) to clearly indicate their inactive state while keeping the last value visible.
    - **Layout**: Added a dedicated 3-column grid section for dropout settings.
- **Organization**:
    - **Section Headers**: Added visible `NodeHeader` components to structure the Network Node into logical groups:
        1. **Network Selection**: Algo and Preset.
        2. **Network Architecture**: Dimensions and Alpha.
        3. **Regularization**: Dropout settings.
        4. **Algorithm Specifics**: Dynamic settings for complex algorithms.
    - **Consistency**: The Network Node structure now matches the polished look of the `GeneralArgsNode`.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TrainingConfig, UIState, NodeId, NodeState, NodeConfig } from './types';
import { LOD_WIDTH, LOD_HEIGHT } from '../components/Node';

interface Store extends UIState {
    config: TrainingConfig;
    isNodeDragging: boolean;
    viewportSize: { width: number, height: number };
    lodImmuneNodes: NodeId[];
    minimizedNodes: NodeId[];

    // Actions
    setViewportSize: (width: number, height: number) => void;
    setTranslation: (x: number, y: number) => void;
    setScale: (s: number) => void;
    setTransform: (x: number, y: number, scale: number) => void;

    // [Shiro] New Consolidated Update Action
    updateNode: (id: string, updates: Partial<NodeState>) => void;

    // [Shiro] Lifecycle Actions
    initNodes: (registry: Record<string, NodeConfig>) => void;
    resetLayout: (registry: Record<string, NodeConfig>) => void;

    setActiveNode: (id: NodeId | null) => void;
    setIsNodeDragging: (isDragging: boolean) => void;
    draggedNode: NodeId | null;
    setDraggedNode: (id: NodeId | null) => void;
    toggleLodImmunity: (id: NodeId) => void;
    toggleMinimize: (id: NodeId) => void;
    updateConfig: (partial: Partial<TrainingConfig>) => void;
    openGemini: (context: string) => void;
    closeGemini: () => void;
    setHighlightedField: (fieldId: string | null) => void;

    // Port Registration
    nodePorts: Partial<Record<NodeId, { input: { x: number, y: number }, output: { x: number, y: number } }>>;
    setNodePorts: (id: NodeId, ports: { input: { x: number, y: number }, output: { x: number, y: number } }) => void;

    // Hydration
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            // Initial UI State
            scale: 0.8,
            translation: { x: 0, y: 0 },
            activeNode: null,
            geminiContext: null,
            isGeminiOpen: false,
            isNodeDragging: false,
            highlightedField: null,

            // [Shiro] Empty by default. Populated by initNodes on mount.
            nodes: {},

            // Config State
            config: {
                trainMode: 'lora',
                seed: 23,
                clipSkip: 2,
                priorLossWeight: 1.0,
                maxDataLoaderWorkers: 1,
                cacheLatents: true,
                cacheLatentsToDisk: false,
                useXformers: false,
                useSdpa: true,
                width: 512,
                height: 512,
                batchSize: 1,
                maxTokenLength: '225',
                mixedPrecision: 'fp16',
                maxTrainTimeType: 'epochs',
                maxTrainTimeValue: 10,
                keepTokensSeparator: '',
                gradientAccumulation: 1,
                gradientCheckpointing: true,
                enableBucket: false,
                minBucketReso: 256,
                maxBucketReso: 1024,
                bucketResoSteps: 64,
                bucketNoUpscale: false,
                baseModelPath: 'runwayml/stable-diffusion-v1-5',
                modelType: 'sd15',
                v_parameterization: false,
                scaleVPredLoss: false,
                debiasedEstimationLoss: false,
                fullFp16: false,
                fullBf16: false,
                fp8Base: false,
                noHalfVae: false,
                lowRam: false,
                highVram: false,
                vaePath: '',
                vaePaddingMode: 'zeros',
                comment: '',
                subsets: [],
                outputDir: '/content/output',
                learningRate: 0.0001,
                unetLr: 0.0001,
                textEncoderLr: 0.00005,
                optimizerType: 'AdamW8bit',
                optimizerArgs: {},
                lrScheduler: 'cosine',
                networkDim: 32,
                networkAlpha: 16,
                networkAlgo: 'lora',
                networkPreset: '',
                networkConvDim: 32,
                networkConvAlpha: 16,
                networkArgs: [],
                networkLoConType: 'kohya',
                networkDyLoRAType: 'lycoris',
                networkWeightDecomposition: false,
                networkWdOnOutput: false,
                networkTuckerDecomposition: false,
                networkOrthogonalize: false,
                networkRankStabilized: false,
                networkTrainNorm: false,
                networkUseScalar: false,
                networkBypassMode: false,
                networkLoKrFactor: -1,
                networkLoKrUnbalancedFactorization: false,
                networkLoKrFullMatrix: false,
                networkLoKrDecomposeBoth: false,
                networkDyLoRAUnit: 4,
                networkTrainOnInput: false,
                networkRescaled: false,
                networkConstraint: 1.0,
                networkConstraintEnabled: false,
                networkBlockSize: 4,
            },

            // Viewport State
            viewportSize: { width: 1920, height: 1080 },
            setViewportSize: (width, height) => set({ viewportSize: { width, height } }),
            lodImmuneNodes: [],
            minimizedNodes: [],

            setTranslation: (x, y) => set({ translation: { x, y } }),
            setScale: (s) => set({ scale: s }),
            setTransform: (x, y, scale) => set({ translation: { x, y }, scale }),

            updateNode: (id, updates) => set((state) => ({
                nodes: {
                    ...state.nodes,
                    [id]: { ...state.nodes[id], ...updates }
                }
            })),

            // [Shiro] Dynamic Initialization
            initNodes: (registry) => set((state) => {
                const newNodes = { ...state.nodes };
                let hasChanges = false;

                Object.values(registry).forEach((conf) => {
                    if (!newNodes[conf.id]) {
                        newNodes[conf.id] = {
                            id: conf.id,
                            // Convert Top-Left (Registry) -> Center (Store)
                            cx: conf.defaultPosition.x + conf.defaultDimensions.width / 2,
                            cy: conf.defaultPosition.y + conf.defaultDimensions.height / 2,
                            width: conf.defaultDimensions.width,
                            height: conf.defaultDimensions.height
                        };
                        hasChanges = true;
                    } else {
                        // [Shiro] PERSISTENCE FIX:
                        // If node exists, check if it's minimized. If so, ensure dimensions match LOD size.
                        // This prevents "ballooning" where a minimized node loads with full size then shrinks.
                        const node = newNodes[conf.id];
                        const isMinimized = state.minimizedNodes.includes(conf.id);
                        if (isMinimized && (node.width !== LOD_WIDTH || node.height !== LOD_HEIGHT)) {
                            newNodes[conf.id] = {
                                ...node,
                                width: LOD_WIDTH,
                                height: LOD_HEIGHT
                            };
                            hasChanges = true;
                        }
                    }
                });

                return hasChanges ? { nodes: newNodes } : {};
            }),

            resetLayout: (registry) => {
                const newNodes: Record<string, any> = {};
                Object.values(registry).forEach((conf) => {
                    newNodes[conf.id] = {
                        id: conf.id,
                        cx: conf.defaultPosition.x + conf.defaultDimensions.width / 2,
                        cy: conf.defaultPosition.y + conf.defaultDimensions.height / 2,
                        width: conf.defaultDimensions.width,
                        height: conf.defaultDimensions.height
                    };
                });
                set({
                    nodes: newNodes,
                    translation: { x: 0, y: 0 },
                    scale: 0.8
                });
            },

            setActiveNode: (id) => set({ activeNode: id }),
            setIsNodeDragging: (isDragging) => set({ isNodeDragging: isDragging }),
            draggedNode: null,
            setDraggedNode: (id) => set({ draggedNode: id }),

            toggleLodImmunity: (id) => set((state) => {
                const isImmune = state.lodImmuneNodes.includes(id);
                return {
                    lodImmuneNodes: isImmune
                        ? state.lodImmuneNodes.filter((i) => i !== id)
                        : [...state.lodImmuneNodes, id]
                };
            }),
            toggleMinimize: (id) => set((state) => {
                const isMinimized = state.minimizedNodes.includes(id);
                return {
                    minimizedNodes: isMinimized
                        ? state.minimizedNodes.filter((i) => i !== id)
                        : [...state.minimizedNodes, id]
                };
            }),
            updateConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
            openGemini: (context) => set({ geminiContext: context, isGeminiOpen: true }),
            closeGemini: () => set({ isGeminiOpen: false, geminiContext: null }),
            setHighlightedField: (fieldId) => set({ highlightedField: fieldId }),

            nodePorts: {},
            setNodePorts: (id, ports) => set((state) => ({
                nodePorts: {
                    ...state.nodePorts,
                    [id]: ports
                }
            })),

            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            // [Shiro] Version Bump to invalidate old data
            name: 'kuro-canvas-v2',
            partialize: (state) => ({
                translation: state.translation,
                scale: state.scale,
                nodes: state.nodes,
                lodImmuneNodes: state.lodImmuneNodes,
                minimizedNodes: state.minimizedNodes,
                config: state.config,
                nodePorts: state.nodePorts,
            }),
            onRehydrateStorage: () => (state) => {
                console.log('[Store] Rehydration complete', state);
                state?.setHasHydrated(true);
            },
        }
    )
);
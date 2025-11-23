import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TrainingConfig, UIState, NodeId } from './types';

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
    moveNode: (id: NodeId, x: number, y: number) => void;
    resizeNode: (id: NodeId, width: number, height: number) => void;
    setActiveNode: (id: NodeId | null) => void;
    setIsNodeDragging: (isDragging: boolean) => void;
    toggleLodImmunity: (id: NodeId) => void;
    toggleMinimize: (id: NodeId) => void;
    updateConfig: (partial: Partial<TrainingConfig>) => void;
    openGemini: (context: string) => void;
    closeGemini: () => void;
    resetLayout: () => void;
    setHighlightedField: (fieldId: string | null) => void;
}

export const DEFAULT_POSITIONS = {
    [NodeId.GENERAL_ARGS]: { x: 100, y: 400 },
    [NodeId.DATA]: { x: 600, y: 500 },
    [NodeId.OPTIMIZER]: { x: 1550, y: 150 },
    [NodeId.NETWORK]: { x: 100, y: 1100 },
    [NodeId.OUTPUT]: { x: 1900, y: 300 },
};

export const DEFAULT_DIMENSIONS = {
    [NodeId.GENERAL_ARGS]: { width: 400, height: 600 },
    [NodeId.DATA]: { width: 400, height: 500 },
    [NodeId.OPTIMIZER]: { width: 380, height: 350 },
    [NodeId.NETWORK]: { width: 400, height: 600 },
    [NodeId.OUTPUT]: { width: 300, height: 200 },
};

export const useStore = create<Store>()(
    persist(
        (set) => ({
            // Initial UI State
            scale: 0.8, // Zoom out a bit to fit the larger graph
            translation: { x: 0, y: 0 },
            activeNode: null,
            geminiContext: null,
            isGeminiOpen: false,
            isNodeDragging: false,
            highlightedField: null,

            // Initial Positions
            nodePositions: { ...DEFAULT_POSITIONS },
            nodeDimensions: { ...DEFAULT_DIMENSIONS },

            // Initial Config State
            config: {
                // Global
                trainMode: 'lora',

                // Base Args
                seed: 23,
                clipSkip: 2,
                priorLossWeight: 1.0,
                maxDataLoaderWorkers: 1,
                cacheLatents: true,
                cacheLatentsToDisk: false,
                useXformers: false,
                useSdpa: true,

                // Resolution
                width: 512,
                height: 512,

                // Training
                batchSize: 1,
                maxTokenLength: '225',
                mixedPrecision: 'fp16',
                maxTrainTimeType: 'epochs',
                maxTrainTimeValue: 10,
                keepTokensSeparator: '',
                gradientAccumulation: 1,
                gradientCheckpointing: true,

                // Bucketing
                enableBucket: false,
                minBucketReso: 256,
                maxBucketReso: 1024,
                bucketResoSteps: 64,
                bucketNoUpscale: false,

                // Model
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

                // Data
                subsets: [],
                outputDir: '/content/output',

                // Optimizer
                learningRate: 0.0001,
                unetLr: 0.0001,
                textEncoderLr: 0.00005,
                optimizerType: 'AdamW8bit',
                lrScheduler: 'cosine',
                networkDim: 32,
                networkAlpha: 16,

                // Network
                networkAlgo: 'lora',
                networkPreset: '',
                networkConvDim: 32,
                networkConvAlpha: 16,
                networkArgs: [],
            },

            // Viewport State
            viewportSize: { width: 1920, height: 1080 }, // Default to 1080p until hydrated/resized
            setViewportSize: (width, height) => set({ viewportSize: { width, height } }),
            lodImmuneNodes: [],
            minimizedNodes: [],

            setTranslation: (x, y) => set({ translation: { x, y } }),
            setScale: (s) => set({ scale: s }),
            setTransform: (x, y, scale) => set({ translation: { x, y }, scale }),
            moveNode: (id, x, y) => set((state) => ({
                nodePositions: {
                    ...state.nodePositions,
                    [id]: { x, y }
                }
            })),
            resizeNode: (id, width, height) => set((state) => ({
                nodeDimensions: {
                    ...state.nodeDimensions,
                    [id]: { width, height }
                }
            })),
            setActiveNode: (id) => set({ activeNode: id }),
            setIsNodeDragging: (isDragging) => set({ isNodeDragging: isDragging }),
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
            resetLayout: () => set({
                nodePositions: { ...DEFAULT_POSITIONS },
                nodeDimensions: { ...DEFAULT_DIMENSIONS },
                translation: { x: 0, y: 0 },
                scale: 0.8
            }),
            setHighlightedField: (fieldId) => set({ highlightedField: fieldId }),
        }),
        {
            name: 'kuro-canvas-storage',
            // Only persist canvas state, not transient UI state
            partialize: (state) => ({
                translation: state.translation,
                scale: state.scale,
                nodePositions: state.nodePositions,
                nodeDimensions: state.nodeDimensions,
                lodImmuneNodes: state.lodImmuneNodes,
                minimizedNodes: state.minimizedNodes,
                config: state.config,
            }),
        }
    )
);

import { create } from 'zustand';
import { TrainingConfig, UIState, IslandId } from './types';

interface Store extends UIState {
    config: TrainingConfig;
    isIslandDragging: boolean;

    // Actions
    setTranslation: (x: number, y: number) => void;
    setScale: (s: number) => void;
    setTransform: (x: number, y: number, scale: number) => void;
    moveIsland: (id: IslandId, x: number, y: number) => void;
    resizeIsland: (id: IslandId, width: number, height: number) => void;
    setActiveIsland: (id: IslandId | null) => void;
    setIsIslandDragging: (isDragging: boolean) => void;
    updateConfig: (partial: Partial<TrainingConfig>) => void;
    openGemini: (context: string) => void;
    closeGemini: () => void;
    resetLayout: () => void;
    setHighlightedField: (fieldId: string | null) => void;
}

const DEFAULT_POSITIONS = {
    [IslandId.GENERAL_ARGS]: { x: 100, y: 400 },
    [IslandId.MODEL]: { x: 600, y: 150 },
    [IslandId.DATA]: { x: 600, y: 500 },
    [IslandId.TRAINING]: { x: 1100, y: 150 },
    [IslandId.OPTIMIZER]: { x: 1550, y: 150 },
    [IslandId.OUTPUT]: { x: 1900, y: 300 },
};

const DEFAULT_DIMENSIONS = {
    [IslandId.GENERAL_ARGS]: { width: 400, height: 600 },
    [IslandId.DATA]: { width: 350, height: 250 },
    [IslandId.MODEL]: { width: 350, height: 200 },
    [IslandId.TRAINING]: { width: 400, height: 300 },
    [IslandId.OPTIMIZER]: { width: 380, height: 350 },
    [IslandId.OUTPUT]: { width: 300, height: 200 },
};

export const useStore = create<Store>((set) => ({
    // Initial UI State
    scale: 0.8, // Zoom out a bit to fit the larger graph
    translation: { x: 0, y: 0 },
    activeIsland: null,
    geminiContext: null,
    isGeminiOpen: false,
    isIslandDragging: false,
    highlightedField: null,

    // Initial Positions
    islandPositions: { ...DEFAULT_POSITIONS },
    islandDimensions: { ...DEFAULT_DIMENSIONS },

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
        imageDir: '/content/train/images',
        regDir: '/content/train/reg',
        outputDir: '/content/output',

        // Optimizer
        learningRate: 0.0001,
        unetLr: 0.0001,
        textEncoderLr: 0.00005,
        optimizerType: 'AdamW8bit',
        lrScheduler: 'cosine',
        networkDim: 32,
        networkAlpha: 16,
    },

    setTranslation: (x, y) => set({ translation: { x, y } }),
    setScale: (s) => set({ scale: s }),
    setTransform: (x, y, scale) => set({ translation: { x, y }, scale }),
    moveIsland: (id, x, y) => set((state) => ({
        islandPositions: {
            ...state.islandPositions,
            [id]: { x, y }
        }
    })),
    resizeIsland: (id, width, height) => set((state) => ({
        islandDimensions: {
            ...state.islandDimensions,
            [id]: { width, height }
        }
    })),
    setActiveIsland: (id) => set({ activeIsland: id }),
    setIsIslandDragging: (isDragging) => set({ isIslandDragging: isDragging }),
    updateConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
    openGemini: (context) => set({ geminiContext: context, isGeminiOpen: true }),
    closeGemini: () => set({ isGeminiOpen: false, geminiContext: null }),
    resetLayout: () => set({
        islandPositions: { ...DEFAULT_POSITIONS },
        islandDimensions: { ...DEFAULT_DIMENSIONS },
        translation: { x: 0, y: 0 },
        scale: 0.8
    }),
    setHighlightedField: (fieldId) => set({ highlightedField: fieldId }),
}));

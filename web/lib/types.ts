
import { LucideIcon } from 'lucide-react';

export enum IslandId {
  BASE_ARGS = 'base_args',
  DATA = 'data',
  MODEL = 'model',
  TRAINING = 'training',
  OPTIMIZER = 'optimizer',
  OUTPUT = 'output'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface IslandPosition {
  x: number;
  y: number;
}

export interface IslandDimensions {
  width: number;
  height: number;
}

export interface TrainingConfig {
  // Global
  trainMode: 'lora' | 'textual_inversion';

  // Base Args
  seed: number;
  clipSkip: number;
  priorLossWeight: number;
  maxDataLoaderWorkers: number;
  cacheLatents: boolean;
  cacheLatentsToDisk: boolean;
  useXformers: boolean;
  useSdpa: boolean;
  maxTokenLength: '75' | '150' | '225';
  keepTokensSeparator: string;
  gradientAccumulation: number;
  scaleVPredLoss: boolean;
  debiasedEstimationLoss: boolean;
  fullFp16: boolean;
  fullBf16: boolean;
  fp8Base: boolean;
  noHalfVae: boolean;
  lowRam: boolean;
  highVram: boolean;
  vaePath: string;
  vaePaddingMode: 'zeros' | 'reflect' | 'replicate' | 'circular';
  comment: string;

  // Model
  pretrainedModelPath: string;
  modelType: 'sd15' | 'sdxl' | 'sd2';
  v_parameterization: boolean;
  
  // Data
  imageDir: string;
  regDir: string;
  outputDir: string;
  
  // Training
  resolution: number;
  batchSize: number;
  maxTrainEpochs: number;
  saveEveryNEpochs: number;
  mixedPrecision: 'no' | 'fp16' | 'bf16';
  gradientCheckpointing: boolean;
  
  // Optimizer
  learningRate: number;
  unetLr: number;
  textEncoderLr: number;
  optimizerType: 'AdamW8bit' | 'Adafactor' | 'Prodigy';
  lrScheduler: 'cosine' | 'constant' | 'constant_with_warmup';
  networkDim: number; // LoRA Rank
  networkAlpha: number;
}

export interface UIState {
  scale: number;
  translation: Coordinates;
  islandPositions: Record<IslandId, IslandPosition>;
  islandDimensions: Record<IslandId, IslandDimensions>;
  activeIsland: IslandId | null;
  geminiContext: string | null; // The parameter user wants help with
  isGeminiOpen: boolean;
  highlightedField: string | null; // For search result highlighting
}

export interface IslandConfig {
  id: IslandId;
  title: string;
  icon: LucideIcon;
  component: React.FC;
}

export interface GraphEdge {
  source: IslandId;
  target: IslandId;
}

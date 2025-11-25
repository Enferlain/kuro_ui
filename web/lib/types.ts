
import { LucideIcon } from 'lucide-react';

export enum NodeId {
  GENERAL_ARGS = 'general_args',
  DATA = 'data',
  OPTIMIZER = 'optimizer',
  NETWORK = 'network',
  OUTPUT = 'output'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeDimensions {
  width: number;
  height: number;
}

export interface SubsetConfig {
  id: string;
  name: string;

  // Paths
  imageDir: string;
  targetImageDir: string;
  maskedImageDir: string;

  // Basic
  numRepeats: number;
  keepTokens: number;
  captionExtension: string;
  randomCropPadding: number;

  // Toggles
  shuffleCaptions: boolean;
  flipAugment: boolean;
  colorAugment: boolean;
  randomCrop: boolean;
  isRegImage: boolean;
  isValImage: boolean;

  // Optional Args - Face Crop
  faceCrop: boolean;
  augmentRangeWidth: number;
  augmentRangeHeight: number;

  // Optional Args - Caption Dropout
  captionDropout: boolean;
  captionDropoutRate: number;
  captionDropoutRateViaEpoch: number;
  tagDropoutRate: number;

  // Optional Args - Token Warmup
  tokenWarmup: boolean;
  tokenWarmupMin: number;
  tokenWarmupStep: number;

  // Optional Args - Caption Shuffle
  captionShuffleModifiers: boolean;
  captionShuffleSigma: number;
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

  // Resolution
  width: number;
  height: number;

  // Training
  batchSize: number;
  maxTokenLength: '75' | '150' | '225';
  mixedPrecision: 'no' | 'fp16' | 'bf16';
  maxTrainTimeType: 'epochs' | 'steps';
  maxTrainTimeValue: number;
  keepTokensSeparator: string;
  gradientAccumulation: number;
  gradientCheckpointing: boolean;

  // Bucketing
  enableBucket: boolean;
  minBucketReso: number;
  maxBucketReso: number;
  bucketResoSteps: number;
  bucketNoUpscale: boolean;

  // Model
  baseModelPath: string; // Replaces pretrainedModelPath
  modelType: 'sd15' | 'sdxl' | 'sd2';
  v_parameterization: boolean;
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

  // Data
  subsets: SubsetConfig[];
  outputDir: string;

  // Optimizer
  learningRate: number;
  unetLr: number;
  textEncoderLr: number;
  optimizerType: string;
  optimizerArgs: Record<string, any>;
  lrScheduler: 'cosine' | 'constant' | 'constant_with_warmup';
  networkDim: number; // LoRA Rank
  networkAlpha: number;

  // Network
  networkAlgo: string;
  networkPreset: string;
  networkConvDim: number;
  networkConvAlpha: number;
  networkArgs: Array<{ key: string; value: string }>;

  // Network Algo Specific
  networkLoConType: 'kohya' | 'lycoris';
  networkDyLoRAType: 'kohya' | 'lycoris';
  networkWeightDecomposition: boolean;
  networkWdOnOutput: boolean;
  networkTuckerDecomposition: boolean;
  networkOrthogonalize: boolean;
  networkRankStabilized: boolean;
  networkTrainNorm: boolean;
  networkUseScalar: boolean;
  networkBypassMode: boolean;
  networkLoKrFactor: number;
  networkLoKrUnbalancedFactorization: boolean;
  networkLoKrFullMatrix: boolean;
  networkLoKrDecomposeBoth: boolean;
  networkDyLoRAUnit: number;
  networkTrainOnInput: boolean;
  networkRescaled: boolean;
  networkConstraint: number;
  networkConstraintEnabled: boolean;
  networkBlockSize: number;
}

export interface UIState {
  scale: number;
  translation: Coordinates;
  nodePositions: Record<NodeId, NodePosition>;
  nodeDimensions: Record<NodeId, NodeDimensions>;
  activeNode: NodeId | null;
  geminiContext: string | null; // The parameter user wants help with
  isGeminiOpen: boolean;
  highlightedField: string | null; // For search result highlighting
}

export interface NodeConfig {
  id: NodeId;
  title: string;
  icon: LucideIcon;
  component: React.FC;
}

export interface GraphEdge {
  source: NodeId;
  target: NodeId;
}

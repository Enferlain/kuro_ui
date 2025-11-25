
export interface OptimizerArgDef {
    name: string;
    label: string;
    type: 'float' | 'int' | 'bool' | 'string' | 'enum';
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: string[]; // For enum
    description?: string;
    visible?: boolean; // Defaults to true
}

export interface OptimizerDef {
    id: string;
    name: string;
    args: OptimizerArgDef[];
}

export const OPTIMIZER_SCHEMAS: OptimizerDef[] = [
    {
        id: 'AdaBelief',
        name: 'AdaBelief',
        args: [
            { name: 'lr', label: 'Lr', type: 'float', default: 0.001, step: 0.001 },
            { name: 'beta1', label: 'Beta 1', type: 'float', default: 0.9, step: 0.01, max: 1.0 },
            { name: 'beta2', label: 'Beta 2', type: 'float', default: 0.999, step: 0.001, max: 1.0 },
            { name: 'weight_decay', label: 'Weight Decay', type: 'float', default: 0.0, step: 0.001 },
            { name: 'weight_decouple', label: 'Weight Decouple', type: 'bool', default: true },
            { name: 'fixed_decay', label: 'Fixed Decay', type: 'bool', default: false },
            { name: 'rectify', label: 'Rectify', type: 'bool', default: false },
            { name: 'n_sma_threshold', label: 'N Sma Threshold', type: 'int', default: 5 },
            { name: 'degenerated_to_sgd', label: 'Degenerated To Sgd', type: 'bool', default: true },
            { name: 'ams_bound', label: 'Ams Bound', type: 'bool', default: false },
            { name: 'r', label: 'R', type: 'float', default: 0.95, step: 0.1 },
            { name: 'adanorm', label: 'Adanorm', type: 'bool', default: false },
            { name: 'adam_debias', label: 'Adam Debias', type: 'bool', default: false },
            { name: 'eps', label: 'Eps', type: 'float', default: 1e-16, step: 1e-16 },
            { name: 'cautious', label: 'Cautious', type: 'bool', default: false },
        ]
    },
    {
        id: 'CAME',
        name: 'CAME',
        args: [
            { name: 'lr', label: 'Lr', type: 'float', default: 0.0002, step: 0.0002 },
            { name: 'beta1', label: 'Beta 1', type: 'float', default: 0.9, step: 0.01, max: 1.0 },
            { name: 'beta2', label: 'Beta 2', type: 'float', default: 0.999, step: 0.001, max: 1.0 },
            { name: 'beta3', label: 'Beta 3', type: 'float', default: 0.9999, step: 0.001, max: 1.0 },
            { name: 'weight_decay', label: 'Weight Decay', type: 'float', default: 0.0, step: 0.001 },
            { name: 'weight_decouple', label: 'Weight Decouple', type: 'bool', default: true },
            { name: 'fixed_decay', label: 'Fixed Decay', type: 'bool', default: false },
            { name: 'clip_threshold', label: 'Clip Threshold', type: 'float', default: 1.0, step: 0.1 },
            { name: 'ams_bound', label: 'Ams Bound', type: 'bool', default: false },
            { name: 'eps1', label: 'Eps1', type: 'float', default: 1e-30, step: 1e-30 },
            { name: 'eps2', label: 'Eps2', type: 'float', default: 1e-16, step: 1e-16 },
            { name: 'cautious', label: 'Cautious', type: 'bool', default: false },
            { name: 'update_strategy', label: 'Update Strategy', type: 'enum', default: 'unmodified', options: ['unmodified', 'cautious', 'grams'] },
        ]
    },
    {
        id: 'OCGOpt',
        name: 'OCGOpt',
        args: [
            { name: 'lr', label: 'Lr', type: 'float', default: 0.0001, step: 0.0001 },
            { name: 'beta1', label: 'Beta 1', type: 'float', default: 0.95, step: 0.01, max: 1.0 },
            { name: 'beta2', label: 'Beta 2', type: 'float', default: 0.9999999, step: 0.001, max: 1.0 },
            { name: 'beta3', label: 'Beta 3', type: 'float', default: 0.9999999, step: 0.001, max: 1.0 },
            { name: 'weight_decay', label: 'Weight Decay', type: 'float', default: 0.0, step: 0.001 },
            { name: 'weight_decay_rate', label: 'Weight Decay Rate', type: 'float', default: 0.995, step: 0.001 },
            { name: 'centralization', label: 'Centralization', type: 'float', default: 1.0, step: 0.1 },
            { name: 'spectral_adaptive', label: 'Spectral Adaptive', type: 'bool', default: true },
            { name: 'spectral_clip_compile', label: 'Spectral Clip Compile', type: 'bool', default: true },
            { name: 'spectral_clip_dtype', label: 'Spectral Clip Dtype', type: 'enum', default: null, options: ['float32', 'float16', 'bfloat16', 'float64'] },
            { name: 'adaptive', label: 'Adaptive', type: 'bool', default: true },
            { name: 'adaptive_min', label: 'Adaptive Min', type: 'float', default: -1.0, step: 0.1 },
            { name: 'adaptive_max', label: 'Adaptive Max', type: 'float', default: 1.0, step: 0.1 },
            { name: 'input_norm', label: 'Input Norm', type: 'bool', default: false },
            { name: 'lowpass_grad', label: 'Lowpass Grad', type: 'float', default: 0.0, step: 0.1 },
            { name: 'sim_match', label: 'Sim Match', type: 'bool', default: false },
            { name: 'cautious_min', label: 'Cautious Min', type: 'float', default: 0.0, step: 0.1 },
            { name: 'stochastic_fp', label: 'Stochastic Fp', type: 'bool', default: true },
        ]
    },
    {
        id: 'AdamW',
        name: 'AdamW',
        args: [
            { name: 'weight_decay', label: 'Weight Decay', type: 'float', default: 0.01, step: 0.001 },
            { name: 'beta1', label: 'Beta 1', type: 'float', default: 0.9, step: 0.01, max: 1.0 },
            { name: 'beta2', label: 'Beta 2', type: 'float', default: 0.999, step: 0.001, max: 1.0 },
            { name: 'epsilon', label: 'Epsilon', type: 'float', default: 1e-08, step: 1e-09 },
        ]
    },
    {
        id: 'AdamW8bit',
        name: 'AdamW 8-bit',
        args: [
            { name: 'weight_decay', label: 'Weight Decay', type: 'float', default: 0.01, step: 0.001 },
            { name: 'beta1', label: 'Beta 1', type: 'float', default: 0.9, step: 0.01, max: 1.0 },
            { name: 'beta2', label: 'Beta 2', type: 'float', default: 0.999, step: 0.001, max: 1.0 },
            { name: 'epsilon', label: 'Epsilon', type: 'float', default: 1e-08, step: 1e-09 },
        ]
    },
    {
        id: 'Adafactor',
        name: 'Adafactor',
        args: [
            { name: 'scale_parameter', label: 'Scale Parameter', type: 'bool', default: true },
            { name: 'relative_step', label: 'Relative Step', type: 'bool', default: true },
            { name: 'warmup_init', label: 'Warmup Init', type: 'bool', default: true },
        ]
    },
    {
        id: 'Prodigy',
        name: 'Prodigy',
        args: [
            { name: 'weight_decay', label: 'Weight Decay', type: 'float', default: 0.0, step: 0.01 },
            { name: 'decouple', label: 'Decouple', type: 'bool', default: true },
            { name: 'use_bias_correction', label: 'Bias Correction', type: 'bool', default: true },
            { name: 'safeguard_warmup', label: 'Safeguard Warmup', type: 'bool', default: true },
            { name: 'd_coef', label: 'D Coefficient', type: 'float', default: 1.0, step: 0.1 },
        ]
    },
];

export const SCHEDULER_OPTIONS = [
    { value: 'cosine', label: 'Cosine' },
    { value: 'cosine_with_restarts', label: 'Cosine with Restarts' },
    { value: 'linear', label: 'Linear' },
    { value: 'polynomial', label: 'Polynomial' },
    { value: 'constant', label: 'Constant' },
    { value: 'constant_with_warmup', label: 'Constant with Warmup' },
    { value: 'adafactor', label: 'Adafactor' },
];

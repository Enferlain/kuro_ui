import { NodeId } from './types';

export interface FieldDefinition {
    id: string; // The config key or unique identifier
    label: string;
    nodeId: NodeId;
    keywords?: string[]; // Optional extra search keywords
}

// Helper to define fields with less boilerplate
const define = (nodeId: NodeId, defs: Record<string, string | { label: string, keywords?: string[] }>): Record<string, FieldDefinition> => {
    const result: Record<string, FieldDefinition> = {};
    for (const [key, value] of Object.entries(defs)) {
        if (typeof value === 'string') {
            result[key] = { id: key, label: value, nodeId };
        } else {
            result[key] = { id: key, label: value.label, nodeId, keywords: value.keywords };
        }
    }
    return result;
};

// ==========================================
// General Args Node
// ==========================================
export const GENERAL_ARGS_DEFS = define(NodeId.GENERAL_ARGS, {
    // Model Config
    base_model: 'Base Model',
    vae_path: 'External VAE',
    vae_padding_mode: 'VAE Padding Mode',

    // Flags - Model
    sdxl_enable: 'SDXL',
    v2_enable: 'SD2.X',

    // Flags - Precision
    full_fp16: 'Full FP16',
    full_bf16: 'Full BF16',
    fp8_base: 'FP8 Base',

    // Flags - Objective
    v_pred: 'V-Prediction',
    scale_v_pred_loss: 'Scale V Loss',
    debiased_estimation: 'Debiased Estimation',

    // Flags - Optimizations
    xformers_enable: 'Xformers',
    sdpa_enable: 'SDPA',
    cache_latents: 'Cache Latents',
    cache_latents_to_disk: 'Cache Latents to Disk',
    no_half_vae: 'No Half VAE',

    // Run Config
    seed: 'Seed',
    batch_size: 'Batch Size',
    clip_skip: 'Clip Skip',
    max_token_length: 'Max Token Length',
    prior_loss_weight: 'Prior Loss Weight',
    mixed_precision: 'Training Precision',
    max_data_loader_n_workers: 'Max Data Loader Workers',
    max_train_time: { label: 'Max Train Duration', keywords: ['steps', 'epochs'] },
    keep_tokens_separator_enable: 'Keep Tokens Separator',

    // Resolution
    width: 'Width',
    height: 'Height',

    // Gradient
    grad_checkpointing: 'Gradient Checkpointing',
    grad_accumulation_enable: 'Gradient Accumulation',

    // Bucketing
    enable_bucket: 'Bucketing', // Label for the main toggle section
    bucket_no_upscale: "Don't Upscale Images",
    min_bucket_reso: 'Min Bucket Reso',
    max_bucket_reso: 'Max Bucket Reso',
    bucket_reso_steps: 'Bucket Reso Steps',

    // Metadata
    comment: 'Comment',
});

// ==========================================
// Network Node
// ==========================================
export const NETWORK_ARGS_DEFS = define(NodeId.NETWORK, {
    // Selection
    network_algo: { label: 'Network Algo', keywords: ['lora', 'locon', 'loha', 'lokr', 'ia3', 'dlora', 'diag-oft', 'boft', 'glora', 'abba', 'full'] },
    network_preset: 'LyCORIS Preset',

    // Architecture
    network_dim: 'Network Dim',
    network_alpha: 'Network Alpha',
    network_conv_dim: 'Conv Dim',
    network_conv_alpha: 'Conv Alpha',

    // Regularization
    network_dropout: 'Network Dropout',
    rank_dropout: 'Rank Dropout',
    module_dropout: 'Module Dropout',

    // Algo Specifics
    network_block_size: 'Block Size',
    network_lokr_factor: 'Factor',
    network_constraint_enabled: 'Constraint',

    // Specific Toggles
    network_lokr_full_matrix: 'Full Matrix',
    network_lokr_unbalanced: 'Unbalanced Factorization',
    network_lokr_decompose_both: 'Decompose Both',
    network_weight_decomposition: 'Weight Decomposition',
    network_wd_on_output: 'WD on Output',
    network_tucker_decomposition: 'Tucker Decomposition',
    network_orthogonalize: 'Orthogonalize',
    network_rank_stabilized: 'Rank Stabilized',
    network_train_on_input: 'Train on Input',
    network_rescaled: 'Rescaled',
    network_train_norm: 'Train Norm',
    network_use_scalar: 'Use Scalar',
    network_bypass_mode: 'Bypass Mode',
});

// ==========================================
// Data Node
// ==========================================
export const DATA_ARGS_DEFS = define(NodeId.DATA, {
    // Note: Most data node settings are dynamic per subset, but we can define the generic labels here for search relevance if needed.
    // However, search usually jumps to the node. 
    // We'll define the keys that represent the "concepts" available in the data node.
    subset_image_dir: 'Input Image Directory',
    subset_target_image_dir: 'Target Image Directory',
    subset_masked_image_dir: 'Masked Image Directory',
    subset_repeats: 'Repeats',
    subset_keep_tokens: 'Keep First n Tokens',
    subset_caption_ext: 'Caption Extension',
    subset_crop_padding: 'Random Crop Padding %',
    subset_shuffle_captions: 'Shuffle Captions',
    subset_flip_augment: 'Flip Augment',
    subset_color_augment: 'Color Augment',
    subset_random_crop: 'Random Crop',
    subset_reg_images: 'Reg Images',
    subset_val_images: 'Val Images',
    subset_face_crop: 'Face Crop',
    subset_caption_dropout: 'Caption Dropout',
    subset_token_warmup: 'Token Warmup',
    subset_caption_shuffle_modifiers: 'Caption Shuffle Modifiers',
});

// ==========================================
// Training Node (Static Parts)
// ==========================================
// Optimizers are dynamic, but some parts like LR are static
export const TRAINING_ARGS_DEFS = define(NodeId.TRAINING, {
    optimizer_type: 'Optimizer Type',
    learning_rate: 'Main Learning Rate',
    unet_lr: 'Unet Learning Rate',
    text_encoder_lr: 'Text Encoder LR',
    lr_scheduler: { label: 'LR Scheduler', keywords: ['cosine', 'linear', 'constant', 'polynomial'] },
    warmup_ratio: 'Warmup Ratio',
    num_cycles: 'Num Cycles',
});

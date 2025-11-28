import { NodeId, NodeConfig, GraphEdge } from '../lib/types';
import { Database, Sliders, Cpu, Settings2 } from 'lucide-react';

import { DataNode } from './nodes/DataNode';
import { TrainingNode } from './nodes/TrainingNode';
import { GeneralArgsNode } from './nodes/GeneralArgsNode';
import { NetworkNode } from './nodes/NetworkNode';

export const NODE_REGISTRY: Record<string, NodeConfig> = {
    [NodeId.GENERAL_ARGS]: {
        id: NodeId.GENERAL_ARGS,
        title: 'General',
        icon: Sliders,
        component: GeneralArgsNode,
        defaultPosition: { x: 100, y: 400 },
        defaultDimensions: { width: 400, height: 600 }
    },
    [NodeId.DATA]: {
        id: NodeId.DATA,
        title: 'Dataset',
        icon: Database,
        component: DataNode,
        defaultPosition: { x: 600, y: 500 },
        defaultDimensions: { width: 400, height: 500 }
    },
    [NodeId.TRAINING]: {
        id: NodeId.TRAINING,
        title: 'Training',
        icon: Settings2,
        component: TrainingNode,
        defaultPosition: { x: 1550, y: 150 },
        defaultDimensions: { width: 380, height: 350 }
    },
    [NodeId.NETWORK]: {
        id: NodeId.NETWORK,
        title: 'Network',
        icon: Database,
        component: NetworkNode,
        defaultPosition: { x: 100, y: 1100 },
        defaultDimensions: { width: 400, height: 600 }
    },
};

export const GRAPH_EDGES: GraphEdge[] = [
    { source: NodeId.GENERAL_ARGS, target: NodeId.DATA },
    { source: NodeId.DATA, target: NodeId.NETWORK },
    { source: NodeId.NETWORK, target: NodeId.TRAINING },
];

export interface SearchItem {
    id: string;
    label: string;
    nodeId: NodeId;
}

export const SEARCH_INDEX: SearchItem[] = [
    // General Args
    { id: 'seed', label: 'Seed', nodeId: NodeId.GENERAL_ARGS },
    { id: 'clip_skip', label: 'Clip Skip', nodeId: NodeId.GENERAL_ARGS },
    { id: 'loss_weight', label: 'Prior Loss Weight', nodeId: NodeId.GENERAL_ARGS },
    { id: 'max_data_loader_n_workers', label: 'Max Data Loader Workers', nodeId: NodeId.GENERAL_ARGS },
    { id: 'cache_latents', label: 'Cache Latents', nodeId: NodeId.GENERAL_ARGS },
    { id: 'cache_latents_to_disk', label: 'Cache Latents To Disk', nodeId: NodeId.GENERAL_ARGS },
    { id: 'xformers_enable', label: 'Xformers', nodeId: NodeId.GENERAL_ARGS },
    { id: 'sdpa_enable', label: 'SDPA', nodeId: NodeId.GENERAL_ARGS },
    { id: 'width', label: 'Width', nodeId: NodeId.GENERAL_ARGS },
    { id: 'height', label: 'Height', nodeId: NodeId.GENERAL_ARGS },
    { id: 'batch_size', label: 'Batch Size', nodeId: NodeId.GENERAL_ARGS },
    { id: 'max_token_length', label: 'Max Token Length', nodeId: NodeId.GENERAL_ARGS },
    { id: 'mixed_precision', label: 'Training Precision', nodeId: NodeId.GENERAL_ARGS },
    { id: 'max_train_time_type', label: 'Max Training Time Type', nodeId: NodeId.GENERAL_ARGS },
    { id: 'max_train_time_value', label: 'Max Training Time Value', nodeId: NodeId.GENERAL_ARGS },
    { id: 'keep_tokens_separator', label: 'Keep Tokens Separator', nodeId: NodeId.GENERAL_ARGS },
    { id: 'grad_accumulation_steps', label: 'Gradient Accumulation Steps', nodeId: NodeId.GENERAL_ARGS },
    { id: 'grad_checkpointing', label: 'Gradient Checkpointing', nodeId: NodeId.GENERAL_ARGS },
    { id: 'base_model', label: 'Base Model', nodeId: NodeId.GENERAL_ARGS },
    { id: 'v_param', label: 'V Param', nodeId: NodeId.GENERAL_ARGS },
    { id: 'scale_v_pred_loss', label: 'Scale V Pred Loss', nodeId: NodeId.GENERAL_ARGS },
    { id: 'full_fp16', label: 'Full FP16', nodeId: NodeId.GENERAL_ARGS },
    { id: 'full_bf16', label: 'Full BF16', nodeId: NodeId.GENERAL_ARGS },
    { id: 'fp8_base', label: 'FP8 Base', nodeId: NodeId.GENERAL_ARGS },
    { id: 'debiased_estimation', label: 'Debiased Estimation', nodeId: NodeId.GENERAL_ARGS },
    { id: 'v2_enable', label: 'SD2.X Based', nodeId: NodeId.GENERAL_ARGS },
    { id: 'sdxl_enable', label: 'SDXL Based', nodeId: NodeId.GENERAL_ARGS },
    { id: 'no_half_vae', label: 'No Half VAE', nodeId: NodeId.GENERAL_ARGS },
    { id: 'low_ram', label: 'Low RAM', nodeId: NodeId.GENERAL_ARGS },
    { id: 'high_vram', label: 'High VRAM', nodeId: NodeId.GENERAL_ARGS },
    { id: 'vae_path', label: 'External VAE', nodeId: NodeId.GENERAL_ARGS },
    { id: 'vae_padding_mode', label: 'VAE Padding Mode', nodeId: NodeId.GENERAL_ARGS },
    { id: 'comment', label: 'Comment', nodeId: NodeId.GENERAL_ARGS },

    // Data Node
    // Subsets are dynamic, so we don't index them statically for now.

    // Training Node
    { id: 'optimizer_type', label: 'Optimizer Type', nodeId: NodeId.TRAINING },
    { id: 'lr_scheduler', label: 'LR Scheduler', nodeId: NodeId.TRAINING },
    { id: 'learning_rate', label: 'Learning Rate', nodeId: NodeId.TRAINING },
    { id: 'unet_lr', label: 'UNet Learning Rate', nodeId: NodeId.TRAINING },
    { id: 'text_encoder_lr', label: 'Text Encoder LR', nodeId: NodeId.TRAINING },
    { id: 'network_dim', label: 'Network Rank (Dim)', nodeId: NodeId.NETWORK },
    { id: 'network_alpha', label: 'Network Alpha', nodeId: NodeId.NETWORK },
    { id: 'network_algo', label: 'Network Algo', nodeId: NodeId.NETWORK },
    { id: 'network_preset', label: 'LyCORIS Preset', nodeId: NodeId.NETWORK },
    { id: 'network_conv_dim', label: 'Conv Dim', nodeId: NodeId.NETWORK },
    { id: 'network_conv_alpha', label: 'Conv Alpha', nodeId: NodeId.NETWORK },
];

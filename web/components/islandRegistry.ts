import { IslandId, IslandConfig, GraphEdge } from '../lib/types';
import { Database, Box, Settings, Cpu, Sliders } from 'lucide-react';

import { DataIsland } from './islands/DataIsland';
import { ModelIsland } from './islands/ModelIsland';
import { TrainingIsland } from './islands/TrainingIsland';
import { OptimizerIsland } from './islands/OptimizerIsland';
import { BaseArgsIsland } from './islands/BaseArgsIsland';

export const ISLAND_REGISTRY: Record<string, IslandConfig> = {
    [IslandId.BASE_ARGS]: {
        id: IslandId.BASE_ARGS,
        title: 'Base Arguments',
        icon: Sliders,
        component: BaseArgsIsland
    },
    [IslandId.DATA]: {
        id: IslandId.DATA,
        title: 'Dataset',
        icon: Database,
        component: DataIsland
    },
    [IslandId.MODEL]: {
        id: IslandId.MODEL,
        title: 'Model',
        icon: Box,
        component: ModelIsland
    },
    [IslandId.TRAINING]: {
        id: IslandId.TRAINING,
        title: 'Training',
        icon: Settings,
        component: TrainingIsland
    },
    [IslandId.OPTIMIZER]: {
        id: IslandId.OPTIMIZER,
        title: 'Optimizer',
        icon: Cpu,
        component: OptimizerIsland
    },
};

export const GRAPH_EDGES: GraphEdge[] = [
    { source: IslandId.BASE_ARGS, target: IslandId.MODEL },
    { source: IslandId.MODEL, target: IslandId.DATA },
    { source: IslandId.DATA, target: IslandId.TRAINING },
    { source: IslandId.TRAINING, target: IslandId.OPTIMIZER },
];

export interface SearchItem {
    id: string;
    label: string;
    islandId: IslandId;
}

export const SEARCH_INDEX: SearchItem[] = [
    // Base Args
    { id: 'seed', label: 'Seed', islandId: IslandId.BASE_ARGS },
    { id: 'clip_skip', label: 'Clip Skip', islandId: IslandId.BASE_ARGS },
    { id: 'loss_weight', label: 'Prior Loss Weight', islandId: IslandId.BASE_ARGS },
    { id: 'max_data_loader_n_workers', label: 'Max Data Loader Workers', islandId: IslandId.BASE_ARGS },
    { id: 'cache_latents', label: 'Cache Latents', islandId: IslandId.BASE_ARGS },
    { id: 'cache_latents_to_disk', label: 'Cache Latents To Disk', islandId: IslandId.BASE_ARGS },
    { id: 'xformers_enable', label: 'Xformers', islandId: IslandId.BASE_ARGS },
    { id: 'sdpa_enable', label: 'SDPA', islandId: IslandId.BASE_ARGS },
    { id: 'max_token_length', label: 'Max Token Length', islandId: IslandId.BASE_ARGS },
    { id: 'keep_tokens_separator', label: 'Keep Tokens Separator', islandId: IslandId.BASE_ARGS },
    { id: 'grad_accumulation', label: 'Gradient Accumulation', islandId: IslandId.BASE_ARGS },
    { id: 'low_ram', label: 'Low RAM', islandId: IslandId.BASE_ARGS },
    { id: 'high_vram', label: 'High VRAM', islandId: IslandId.BASE_ARGS },
    { id: 'no_half_vae', label: 'No Half VAE', islandId: IslandId.BASE_ARGS },
    { id: 'vae_path', label: 'VAE Path', islandId: IslandId.BASE_ARGS },
    { id: 'vae_padding_mode', label: 'VAE Padding Mode', islandId: IslandId.BASE_ARGS },
    { id: 'comment', label: 'Metadata Comment', islandId: IslandId.BASE_ARGS },

    // Data Island
    { id: 'image_directory', label: 'Image Directory', islandId: IslandId.DATA },
    { id: 'reg_directory', label: 'Regularization Directory', islandId: IslandId.DATA },
    { id: 'output_directory', label: 'Output Directory', islandId: IslandId.DATA },

    // Model Island
    { id: 'pretrained_model_name_or_path', label: 'Pretrained Model Path', islandId: IslandId.MODEL },
    { id: 'model_architecture', label: 'Model Architecture', islandId: IslandId.MODEL },

    // Training Island
    { id: 'resolution', label: 'Resolution', islandId: IslandId.TRAINING },
    { id: 'train_batch_size', label: 'Batch Size', islandId: IslandId.TRAINING },
    { id: 'max_train_epochs', label: 'Max Epochs', islandId: IslandId.TRAINING },
    { id: 'mixed_precision', label: 'Mixed Precision', islandId: IslandId.TRAINING },
    { id: 'grad_chk', label: 'Gradient Checkpointing', islandId: IslandId.TRAINING },

    // Optimizer Island
    { id: 'optimizer_type', label: 'Optimizer Type', islandId: IslandId.OPTIMIZER },
    { id: 'lr_scheduler', label: 'LR Scheduler', islandId: IslandId.OPTIMIZER },
    { id: 'learning_rate', label: 'Learning Rate', islandId: IslandId.OPTIMIZER },
    { id: 'unet_lr', label: 'UNet Learning Rate', islandId: IslandId.OPTIMIZER },
    { id: 'text_encoder_lr', label: 'Text Encoder LR', islandId: IslandId.OPTIMIZER },
    { id: 'network_dim', label: 'Network Rank (Dim)', islandId: IslandId.OPTIMIZER },
    { id: 'network_alpha', label: 'Network Alpha', islandId: IslandId.OPTIMIZER },
];

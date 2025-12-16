import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Input, Select, Toggle, FieldWrapper } from '../FormComponents';
import { NodeHeader } from '../NodeStyles';
import { FolderOpen, Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Pencil } from 'lucide-react';
import { SubsetConfig } from '../../lib/types';
import { DATA_ARGS_DEFS } from '../../lib/field-definitions';

// TODO: query to flags

const SubsetCard: React.FC<{
    subset: SubsetConfig;
    index: number;
    onUpdate: (id: string, updates: Partial<SubsetConfig>) => void;
    onDelete: (id: string) => void;
    globalKeepTokensSeparator: string;
}> = ({ subset, index, onUpdate, onDelete, globalKeepTokensSeparator }) => {
    const [isOptionalOpen, setIsOptionalOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="bg-[#1E1B2E] rounded-md border border-[#3E3B5E] overflow-hidden transition-all duration-200">
            {/* Header */}
            <div
                className="flex items-center justify-between gap-3 p-3 bg-[#232034] border-b border-[#3E3B5E]/50 cursor-pointer hover:bg-[#2A273F] transition-colors group"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex-1 flex items-center">
                    <div
                        className="flex items-center gap-2 py-2 -my-2 pr-4 pl-1 -ml-1 rounded cursor-text"
                        onClick={(e) => {
                            e.stopPropagation();
                            inputRef.current?.focus();
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={subset.name}
                            onChange={(e) => onUpdate(subset.id, { name: e.target.value })}
                            className="bg-transparent text-sm font-bold text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono tracking-wide border-b border-transparent focus:border-violet-500 transition-colors"
                            placeholder={`Subset ${index + 1}`}
                            style={{ width: `${(subset.name || `Subset ${index + 1}`).length + 2}ch` }}
                        />
                        <Pencil
                            size={12}
                            className="text-[#5B5680] opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCollapsed(!isCollapsed);
                        }}
                        className="p-1.5 text-[#5B5680] group-hover:text-white transition-colors rounded-sm hover:bg-[#3E3B5E]"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(subset.id);
                        }}
                        className="p-1.5 text-[#5B5680] hover:text-red-400 transition-colors rounded-sm hover:bg-[#3E3B5E]"
                        title="Delete Subset"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isCollapsed && (
                <div className="p-3 space-y-4">
                    {/* Paths */}
                    <div className="space-y-3">
                        <div className="relative group cursor-pointer">
                            <Input
                                label={DATA_ARGS_DEFS.subset_image_dir.label}
                                name={`subset_${subset.id}_image_dir`}
                                value={subset.imageDir}
                                onChange={(e) => onUpdate(subset.id, { imageDir: e.target.value })}
                            />
                            <FolderOpen className="absolute right-3 top-9 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
                        </div>
                        <div className="relative group cursor-pointer">
                            <Input
                                label={DATA_ARGS_DEFS.subset_target_image_dir.label}
                                name={`subset_${subset.id}_target_image_dir`}
                                value={subset.targetImageDir}
                                onChange={(e) => onUpdate(subset.id, { targetImageDir: e.target.value })}
                            />
                            <FolderOpen className="absolute right-3 top-9 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
                        </div>
                        <div className="relative group cursor-pointer">
                            <Input
                                label={DATA_ARGS_DEFS.subset_masked_image_dir.label}
                                name={`subset_${subset.id}_masked_image_dir`}
                                value={subset.maskedImageDir}
                                onChange={(e) => onUpdate(subset.id, { maskedImageDir: e.target.value })}
                            />
                            <FolderOpen className="absolute right-3 top-9 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
                        </div>
                    </div>

                    {/* Basic Fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label={DATA_ARGS_DEFS.subset_repeats.label}
                            name={`subset_${subset.id}_repeats`}
                            type="number"
                            value={subset.numRepeats}
                            onChange={(e) => onUpdate(subset.id, { numRepeats: parseInt(e.target.value) || 1 })}
                        />
                        <Input
                            label={DATA_ARGS_DEFS.subset_keep_tokens.label}
                            name={`subset_${subset.id}_keep_tokens`}
                            type="number"
                            value={subset.keepTokens}
                            onChange={(e) => onUpdate(subset.id, { keepTokens: parseInt(e.target.value) || 0 })}
                            className={!!globalKeepTokensSeparator ? 'opacity-50 cursor-not-allowed' : ''}
                        />
                        <Input
                            label={DATA_ARGS_DEFS.subset_caption_ext.label}
                            name={`subset_${subset.id}_caption_ext`}
                            value={subset.captionExtension}
                            onChange={(e) => onUpdate(subset.id, { captionExtension: e.target.value })}
                        />
                        <Input
                            label={DATA_ARGS_DEFS.subset_crop_padding.label}
                            name={`subset_${subset.id}_crop_padding`}
                            type="number"
                            value={subset.randomCropPadding}
                            onChange={(e) => onUpdate(subset.id, { randomCropPadding: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    {/* Toggles Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                        <Toggle
                            label={DATA_ARGS_DEFS.subset_shuffle_captions.label}
                            name={`subset_${subset.id}_shuffle_captions`}
                            checked={subset.shuffleCaptions}
                            onChange={(e) => onUpdate(subset.id, { shuffleCaptions: e.target.checked })}
                        />
                        <Toggle
                            label={DATA_ARGS_DEFS.subset_flip_augment.label}
                            name={`subset_${subset.id}_flip_augment`}
                            checked={subset.flipAugment}
                            onChange={(e) => onUpdate(subset.id, { flipAugment: e.target.checked })}
                        />
                        <Toggle
                            label={DATA_ARGS_DEFS.subset_color_augment.label}
                            name={`subset_${subset.id}_color_augment`}
                            checked={subset.colorAugment}
                            onChange={(e) => onUpdate(subset.id, { colorAugment: e.target.checked })}
                        />
                        <Toggle
                            label={DATA_ARGS_DEFS.subset_random_crop.label}
                            name={`subset_${subset.id}_random_crop`}
                            checked={subset.randomCrop}
                            onChange={(e) => onUpdate(subset.id, { randomCrop: e.target.checked })}
                        />
                        <Toggle
                            label={DATA_ARGS_DEFS.subset_reg_images.label}
                            name={`subset_${subset.id}_reg_images`}
                            checked={subset.isRegImage}
                            onChange={(e) => onUpdate(subset.id, { isRegImage: e.target.checked })}
                        />
                        <Toggle
                            label={DATA_ARGS_DEFS.subset_val_images.label}
                            name={`subset_${subset.id}_val_images`}
                            checked={subset.isValImage}
                            onChange={(e) => onUpdate(subset.id, { isValImage: e.target.checked })}
                        />
                    </div>

                    {/* Optional Args Accordion */}
                    <div className="border-t border-[#3E3B5E] pt-2">
                        <button
                            onClick={() => setIsOptionalOpen(!isOptionalOpen)}
                            className="flex items-center gap-2 w-full group"
                        >
                            <NodeHeader
                                title="Optional Args"
                                className="!text-[10px] group-hover:text-[#E2E0EC] transition-colors"
                            />
                            {isOptionalOpen ? <ChevronDown size={14} className="text-[#5B5680]" /> : <ChevronRight size={14} className="text-[#5B5680]" />}
                        </button>

                        {isOptionalOpen && (
                            <div className="space-y-4 pt-3 pl-2">
                                {/* Face Crop */}
                                <div className="space-y-2">
                                    <Toggle
                                        label={DATA_ARGS_DEFS.subset_face_crop.label}
                                        name={`subset_${subset.id}_face_crop`}
                                        checked={subset.faceCrop}
                                        onChange={(e) => onUpdate(subset.id, { faceCrop: e.target.checked })}
                                    />
                                    {subset.faceCrop && (
                                        <div className="grid grid-cols-2 gap-2 pl-4 border-l border-[#3E3B5E]">
                                            <Input
                                                label="Range Width"
                                                name={`subset_${subset.id}_range_width`}
                                                type="number"
                                                value={subset.augmentRangeWidth}
                                                onChange={(e) => onUpdate(subset.id, { augmentRangeWidth: parseInt(e.target.value) || 0 })}
                                            />
                                            <Input
                                                label="Range Height"
                                                name={`subset_${subset.id}_range_height`}
                                                type="number"
                                                value={subset.augmentRangeHeight}
                                                onChange={(e) => onUpdate(subset.id, { augmentRangeHeight: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Caption Dropout */}
                                <div className="space-y-2">
                                    <Toggle
                                        label={DATA_ARGS_DEFS.subset_caption_dropout.label}
                                        name={`subset_${subset.id}_caption_dropout`}
                                        checked={subset.captionDropout}
                                        onChange={(e) => onUpdate(subset.id, { captionDropout: e.target.checked })}
                                    />
                                    {subset.captionDropout && (
                                        <div className="space-y-2 pl-4 border-l border-[#3E3B5E]">
                                            <Input
                                                label="Rate"
                                                name={`subset_${subset.id}_caption_dropout_rate`}
                                                type="number"
                                                step="0.1"
                                                value={subset.captionDropoutRate}
                                                onChange={(e) => onUpdate(subset.id, { captionDropoutRate: parseFloat(e.target.value) || 0 })}
                                            />
                                            <Input
                                                label="Rate Via Epoch"
                                                name={`subset_${subset.id}_caption_dropout_rate_via_epoch`}
                                                type="number"
                                                step="0.1"
                                                value={subset.captionDropoutRateViaEpoch}
                                                onChange={(e) => onUpdate(subset.id, { captionDropoutRateViaEpoch: parseFloat(e.target.value) || 0 })}
                                            />
                                            <Input
                                                label="Tag Dropout Rate"
                                                name={`subset_${subset.id}_tag_dropout_rate`}
                                                type="number"
                                                step="0.1"
                                                value={subset.tagDropoutRate}
                                                onChange={(e) => onUpdate(subset.id, { tagDropoutRate: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Token Warmup */}
                                <div className="space-y-2">
                                    <Toggle
                                        label={DATA_ARGS_DEFS.subset_token_warmup.label}
                                        name={`subset_${subset.id}_token_warmup`}
                                        checked={subset.tokenWarmup}
                                        onChange={(e) => onUpdate(subset.id, { tokenWarmup: e.target.checked })}
                                    />
                                    {subset.tokenWarmup && (
                                        <div className="grid grid-cols-2 gap-2 pl-4 border-l border-[#3E3B5E]">
                                            <Input
                                                label="Min Warmup"
                                                name={`subset_${subset.id}_token_warmup_min`}
                                                type="number"
                                                value={subset.tokenWarmupMin}
                                                onChange={(e) => onUpdate(subset.id, { tokenWarmupMin: parseInt(e.target.value) || 1 })}
                                            />
                                            <Input
                                                label="Warmup Step"
                                                name={`subset_${subset.id}_token_warmup_step`}
                                                type="number"
                                                step="0.1"
                                                value={subset.tokenWarmupStep}
                                                onChange={(e) => onUpdate(subset.id, { tokenWarmupStep: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Caption Shuffle */}
                                <div className="space-y-2">
                                    <Toggle
                                        label={DATA_ARGS_DEFS.subset_caption_shuffle_modifiers.label}
                                        name={`subset_${subset.id}_caption_shuffle_modifiers`}
                                        checked={subset.captionShuffleModifiers}
                                        onChange={(e) => onUpdate(subset.id, { captionShuffleModifiers: e.target.checked })}
                                    />
                                    {subset.captionShuffleModifiers && (
                                        <div className="pl-4 border-l border-[#3E3B5E]">
                                            <Input
                                                label="Shuffle Sigma"
                                                name={`subset_${subset.id}_caption_shuffle_sigma`}
                                                type="number"
                                                step="0.1"
                                                value={subset.captionShuffleSigma}
                                                onChange={(e) => onUpdate(subset.id, { captionShuffleSigma: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const DataNode: React.FC = () => {
    const { config, updateConfig } = useStore();

    // Initialize subsets if they don't exist (migration for existing users)
    React.useEffect(() => {
        if (!config.subsets) {
            updateConfig({ subsets: [] });
        }
    }, [config.subsets, updateConfig]);

    const addSubset = () => {
        const currentSubsets = config.subsets || [];
        const newSubset: SubsetConfig = {
            id: crypto.randomUUID(),
            name: `Subset ${currentSubsets.length + 1}`,
            imageDir: '',
            targetImageDir: '',
            maskedImageDir: '',
            numRepeats: 1,
            keepTokens: 0,
            captionExtension: '.txt',
            randomCropPadding: 0,
            shuffleCaptions: false,
            flipAugment: false,
            colorAugment: false,
            randomCrop: false,
            isRegImage: false,
            isValImage: false,
            faceCrop: false,
            augmentRangeWidth: 0,
            augmentRangeHeight: 0,
            captionDropout: false,
            captionDropoutRate: 0,
            captionDropoutRateViaEpoch: 0,
            tagDropoutRate: 0,
            tokenWarmup: false,
            tokenWarmupMin: 1,
            tokenWarmupStep: 0,
            captionShuffleModifiers: false,
            captionShuffleSigma: 0,
        };
        updateConfig({ subsets: [...currentSubsets, newSubset] });
    };

    const updateSubset = (id: string, updates: Partial<SubsetConfig>) => {
        const currentSubsets = config.subsets || [];
        const newSubsets = currentSubsets.map(s =>
            s.id === id ? { ...s, ...updates } : s
        );
        updateConfig({ subsets: newSubsets });
    };

    const deleteSubset = (id: string) => {
        const currentSubsets = config.subsets || [];
        updateConfig({ subsets: currentSubsets.filter(s => s.id !== id) });
    };

    return (
        <div className="space-y-4">
            {/* Subsets List */}
            <div className="space-y-4">
                {(config.subsets || []).map((subset, index) => (
                    <SubsetCard
                        key={subset.id}
                        index={index}
                        subset={subset}
                        onUpdate={updateSubset}
                        onDelete={deleteSubset}
                        globalKeepTokensSeparator={config.keepTokensSeparator}
                    />
                ))}
            </div>

            {/* Add Button */}
            <button
                onClick={addSubset}
                className="w-full py-3 border-2 border-dashed border-[#3E3B5E] rounded-md text-[#5B5680] hover:border-violet-500 hover:text-violet-400 transition-all flex items-center justify-center gap-2 group"
            >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-sm font-bold uppercase tracking-wider">Add Subset</span>
            </button>
        </div>
    );
};

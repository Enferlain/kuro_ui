import React from 'react';
import { useStore } from '../../lib/store';
import { Input, Select, Toggle, TextArea, FieldWrapper } from '../FormComponents';
import { HelpCircle } from 'lucide-react';

export const GeneralArgsNode: React.FC = () => {
    const { config, updateConfig, openGemini } = useStore();

    return (
        <div className="space-y-5">
            {/* Section 1: Model Configuration */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#5B5680] uppercase tracking-wider">Model Configuration</h3>
                <Input
                    label="Base Model"
                    name="base_model"
                    value={config.baseModelPath}
                    onChange={(e) => updateConfig({ baseModelPath: e.target.value })}
                    placeholder="Base Model To Train With"
                />
                <Input
                    label="External VAE"
                    name="vae_path"
                    value={config.vaePath}
                    onChange={(e) => updateConfig({ vaePath: e.target.value })}
                    placeholder="Vae to train with"
                />
                <Select
                    label="VAE Padding Mode"
                    name="vae_padding_mode"
                    value={config.vaePaddingMode}
                    onChange={(e) => updateConfig({ vaePaddingMode: e.target.value as any })}
                    options={[
                        { value: 'zeros', label: 'zeros' },
                        { value: 'reflect', label: 'reflect' },
                        { value: 'replicate', label: 'replicate' },
                        { value: 'circular', label: 'circular' },
                    ]}
                />

                {/* Flags */}
                <h4 className="text-xs font-semibold text-[#7B77A0] uppercase tracking-wide pt-2">Flags</h4>

                {/* Model */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <h5 className="text-[10px] font-medium text-[#5B5680] uppercase tracking-wider">Model</h5>
                        <button
                            onClick={(e) => { e.stopPropagation(); openGemini('flags_model'); }}
                            className="text-[#5B5680] hover:text-violet-400 transition-colors"
                            title="Query Intelligence"
                        >
                            <HelpCircle className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-x-2 gap-y-2 px-1">
                        <Toggle
                            label="SDXL"
                            name="sdxl_enable"
                            checked={config.modelType === 'sdxl'}
                            onChange={(e) => updateConfig({ modelType: e.target.checked ? 'sdxl' : 'sd15' })}
                        />
                        <Toggle
                            label="SD2.X"
                            name="v2_enable"
                            checked={config.modelType === 'sd2'}
                            onChange={(e) => updateConfig({ modelType: e.target.checked ? 'sd2' : 'sd15' })}
                        />
                    </div>
                </div>

                {/* Precision */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <h5 className="text-[10px] font-medium text-[#5B5680] uppercase tracking-wider">Precision</h5>
                        <button
                            onClick={(e) => { e.stopPropagation(); openGemini('flags_precision'); }}
                            className="text-[#5B5680] hover:text-violet-400 transition-colors"
                            title="Query Intelligence"
                        >
                            <HelpCircle className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-x-2 gap-y-2 px-1">
                        <Toggle
                            label="Full FP16"
                            name="full_fp16"
                            checked={config.fullFp16}
                            onChange={(e) => updateConfig({
                                fullFp16: e.target.checked,
                                fullBf16: false,
                                fp8Base: false
                            })}
                        />
                        <Toggle
                            label="Full BF16"
                            name="full_bf16"
                            checked={config.fullBf16}
                            onChange={(e) => updateConfig({
                                fullBf16: e.target.checked,
                                fullFp16: false,
                                fp8Base: false
                            })}
                        />
                        <Toggle
                            label="FP8 Base"
                            name="fp8_base"
                            checked={config.fp8Base}
                            onChange={(e) => updateConfig({
                                fp8Base: e.target.checked,
                                fullFp16: false,
                                fullBf16: false
                            })}
                        />
                    </div>
                </div>

                {/* Training */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <h5 className="text-[10px] font-medium text-[#5B5680] uppercase tracking-wider">Training</h5>
                        <button
                            onClick={(e) => { e.stopPropagation(); openGemini('flags_training'); }}
                            className="text-[#5B5680] hover:text-violet-400 transition-colors"
                            title="Query Intelligence"
                        >
                            <HelpCircle className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-x-2 gap-y-2 px-1">
                        <Toggle
                            label="V-Prediction"
                            name="v_pred"
                            checked={config.v_parameterization}
                            onChange={(e) => updateConfig({ v_parameterization: e.target.checked })}
                        />
                        <Toggle
                            label="Scale V Loss"
                            name="scale_v_pred_loss"
                            checked={config.scaleVPredLoss}
                            onChange={(e) => updateConfig({ scaleVPredLoss: e.target.checked })}
                        />
                        <Toggle
                            label="Debiased Estimation"
                            name="debiased_estimation"
                            checked={config.debiasedEstimationLoss}
                            onChange={(e) => updateConfig({ debiasedEstimationLoss: e.target.checked })}
                        />
                    </div>
                </div>

                {/* Optimizations */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <h5 className="text-[10px] font-medium text-[#5B5680] uppercase tracking-wider">Optimizations</h5>
                        <button
                            onClick={(e) => { e.stopPropagation(); openGemini('flags_optimizations'); }}
                            className="text-[#5B5680] hover:text-violet-400 transition-colors"
                            title="Query Intelligence"
                        >
                            <HelpCircle className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-x-2 gap-y-2 px-1">
                        <Toggle
                            label="Xformers"
                            name="xformers_enable"
                            checked={config.useXformers}
                            onChange={(e) => updateConfig({
                                useXformers: e.target.checked,
                                useSdpa: e.target.checked ? false : config.useSdpa
                            })}
                        />
                        <Toggle
                            label="SDPA"
                            name="sdpa_enable"
                            checked={config.useSdpa}
                            onChange={(e) => updateConfig({
                                useSdpa: e.target.checked,
                                useXformers: e.target.checked ? false : config.useXformers
                            })}
                        />
                        <Toggle
                            label="Cache Latents"
                            name="cache_latents"
                            checked={config.cacheLatents}
                            onChange={(e) => updateConfig({
                                cacheLatents: e.target.checked,
                                cacheLatentsToDisk: e.target.checked ? config.cacheLatentsToDisk : false
                            })}
                        />
                        <Toggle
                            label="Cache Latents to Disk"
                            name="cache_latents_to_disk"
                            checked={config.cacheLatentsToDisk}
                            onChange={(e) => updateConfig({
                                cacheLatentsToDisk: e.target.checked,
                                cacheLatents: e.target.checked ? true : config.cacheLatents
                            })}
                        />
                        <Toggle
                            label="No Half VAE"
                            name="no_half_vae"
                            checked={config.noHalfVae}
                            onChange={(e) => updateConfig({ noHalfVae: e.target.checked })}
                        />
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#2A273F]" />

            {/* Section 2: Training Parameters - 3x3 Grid */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#5B5680] uppercase tracking-wider">Training Parameters</h3>
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        label="Seed"
                        name="seed"
                        type="number"
                        value={config.seed}
                        onChange={(e) => updateConfig({ seed: parseInt(e.target.value) })}
                    />
                    <Input
                        label="Batch Size"
                        name="batch_size"
                        type="number"
                        value={config.batchSize}
                        onChange={(e) => updateConfig({ batchSize: parseInt(e.target.value) })}
                    />
                    <Input
                        label="Clip Skip"
                        name="clip_skip"
                        type="number"
                        value={config.clipSkip}
                        onChange={(e) => updateConfig({ clipSkip: parseInt(e.target.value) })}
                    />
                    <Select
                        label="Max Token Length"
                        name="max_token_length"
                        value={config.maxTokenLength}
                        onChange={(e) => updateConfig({ maxTokenLength: e.target.value as any })}
                        options={[
                            { value: '75', label: '75' },
                            { value: '150', label: '150' },
                            { value: '225', label: '225' },
                        ]}
                    />
                    <Input
                        label="Prior Loss Weight"
                        name="prior_loss_weight"
                        type="number"
                        step="0.01"
                        value={config.priorLossWeight}
                        onChange={(e) => updateConfig({ priorLossWeight: parseFloat(e.target.value) })}
                    />
                    <Select
                        label="Training Precision"
                        name="mixed_precision"
                        value={config.mixedPrecision}
                        onChange={(e) => updateConfig({ mixedPrecision: e.target.value as any })}
                        options={[
                            { value: 'fp16', label: 'fp16' },
                            { value: 'bf16', label: 'bf16' },
                            { value: 'no', label: 'float (no)' },
                        ]}
                    />
                    <Input
                        label="Max Data Loader Workers"
                        name="max_data_loader_n_workers"
                        type="number"
                        value={config.maxDataLoaderWorkers}
                        onChange={(e) => updateConfig({ maxDataLoaderWorkers: parseInt(e.target.value) })}
                    />

                    {/* Unified Max Train Duration Field - 1 Column */}
                    <FieldWrapper label="Max Train Duration" id="max_train_time">
                        <div className="flex items-center h-[42px] bg-[#181625] border border-[#3E3B5E] rounded-sm overflow-hidden">
                            <input
                                type="number"
                                value={config.maxTrainTimeValue}
                                onChange={(e) => updateConfig({ maxTrainTimeValue: parseInt(e.target.value) })}
                                className="flex-1 bg-transparent px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono h-full min-w-0"
                            />
                            <div className="h-full border-l border-[#3E3B5E]">
                                <select
                                    value={config.maxTrainTimeType}
                                    onChange={(e) => updateConfig({ maxTrainTimeType: e.target.value as any })}
                                    className="h-full bg-[#13111C] px-2 text-sm text-[#E2E0EC] focus:outline-none font-mono cursor-pointer hover:bg-[#1a1825] transition-colors"
                                >
                                    <option value="epochs">Epochs</option>
                                    <option value="steps">Steps</option>
                                </select>
                            </div>
                        </div>
                    </FieldWrapper>

                    {/* Keep Tokens Separator - Moved here for 3x3 grid */}
                    <FieldWrapper label="Keep Tokens Separator" id="keep_tokens_separator_enable">
                        <div className="flex items-center h-[42px] bg-[#181625] border border-[#3E3B5E] rounded-sm overflow-hidden">
                            <div className="flex items-center justify-center px-3 h-full border-r border-[#3E3B5E]">
                                <Toggle
                                    name="keep_tokens_separator_enable"
                                    checked={!!config.keepTokensSeparator}
                                    onChange={(e) => updateConfig({ keepTokensSeparator: e.target.checked ? '|||' : '' })}
                                />
                            </div>
                            <input
                                value={config.keepTokensSeparator}
                                onChange={(e) => updateConfig({ keepTokensSeparator: e.target.value })}
                                disabled={!config.keepTokensSeparator}
                                className="flex-1 bg-transparent px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono h-full min-w-0"
                                placeholder="Separator"
                            />
                        </div>
                    </FieldWrapper>
                </div>
            </div>

            <div className="h-px bg-[#2A273F]" />

            {/* Section 3: Resolution & Gradient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resolution */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#5B5680] uppercase tracking-wider">Resolution</h3>
                    <div className="flex flex-col gap-3">
                        <Input
                            label="Width"
                            name="width"
                            type="number"
                            value={config.width}
                            onChange={(e) => updateConfig({ width: parseInt(e.target.value) })}
                        />
                        <Input
                            label="Height"
                            name="height"
                            type="number"
                            value={config.height}
                            onChange={(e) => updateConfig({ height: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Gradient */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#5B5680] uppercase tracking-wider">Gradient</h3>
                    <div className="flex flex-col gap-3">
                        <FieldWrapper label="Gradient Checkpointing" id="grad_checkpointing">
                            <div className="flex items-center h-[42px] bg-[#181625] border border-[#3E3B5E] rounded-sm px-3">
                                <Toggle
                                    name="grad_checkpointing"
                                    checked={config.gradientCheckpointing}
                                    onChange={(e) => updateConfig({ gradientCheckpointing: e.target.checked })}
                                />
                            </div>
                        </FieldWrapper>

                        <FieldWrapper label="Gradient Accumulation" id="grad_accumulation_enable">
                            <div className="flex items-center h-[42px] bg-[#181625] border border-[#3E3B5E] rounded-sm overflow-hidden">
                                <div className="flex items-center justify-center px-3 h-full border-r border-[#3E3B5E]">
                                    <Toggle
                                        name="grad_accumulation_enable"
                                        checked={config.gradientAccumulation > 1}
                                        onChange={(e) => updateConfig({ gradientAccumulation: e.target.checked ? 2 : 1 })}
                                    />
                                </div>
                                <input
                                    type="number"
                                    value={config.gradientAccumulation}
                                    onChange={(e) => updateConfig({ gradientAccumulation: parseInt(e.target.value) })}
                                    disabled={config.gradientAccumulation <= 1}
                                    className="flex-1 bg-transparent px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono h-full"
                                />
                            </div>
                        </FieldWrapper>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#2A273F]" />

            {/* Section 4: Bucketing */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-[#5B5680] uppercase tracking-wider">Bucketing</h3>
                        <Toggle
                            name="enable_bucket"
                            checked={config.enableBucket}
                            onChange={(e) => updateConfig({ enableBucket: e.target.checked })}
                        />
                    </div>
                    <div className={`flex items-center gap-2 transition-opacity duration-200 ${!config.enableBucket ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="text-xs text-[#7B77A0] font-medium">Don't Upscale Images</span>
                        <Toggle
                            name="bucket_no_upscale"
                            checked={config.bucketNoUpscale}
                            onChange={(e) => updateConfig({ bucketNoUpscale: e.target.checked })}
                            disabled={!config.enableBucket}
                        />
                    </div>
                </div>
                <div className={`grid grid-cols-3 gap-3 transition-opacity duration-200 ${!config.enableBucket ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Input
                        label="Min Bucket Reso"
                        name="min_bucket_reso"
                        type="number"
                        value={config.minBucketReso}
                        onChange={(e) => updateConfig({ minBucketReso: parseInt(e.target.value) })}
                        disabled={!config.enableBucket}
                    />
                    <Input
                        label="Max Bucket Reso"
                        name="max_bucket_reso"
                        type="number"
                        value={config.maxBucketReso}
                        onChange={(e) => updateConfig({ maxBucketReso: parseInt(e.target.value) })}
                        disabled={!config.enableBucket}
                    />
                    <Input
                        label="Bucket Reso Steps"
                        name="bucket_reso_steps"
                        type="number"
                        value={config.bucketResoSteps}
                        onChange={(e) => updateConfig({ bucketResoSteps: parseInt(e.target.value) })}
                        disabled={!config.enableBucket}
                    />
                </div>
            </div>

            <div className="h-px bg-[#2A273F]" />

            {/* Section 5: Metadata */}
            <div>
                <TextArea
                    label="Comment"
                    name="comment"
                    value={config.comment}
                    onChange={(e) => updateConfig({ comment: e.target.value })}
                    placeholder="Enter in a comment you want in the metadata"
                    className="min-h-[80px]"
                />
            </div>
        </div>
    );
};

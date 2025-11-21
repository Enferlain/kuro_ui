import React from 'react';
import { useStore } from '../../lib/store';
import { Input, Select, Checkbox } from '../FormComponents';

export const BaseArgsIsland: React.FC = () => {
    const { config, updateConfig } = useStore();

    return (
        <div className="space-y-4">
            {/* General Args */}
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Seed"
                        name="seed"
                        type="number"
                        value={config.seed}
                        onChange={(e) => updateConfig({ seed: parseInt(e.target.value) })}
                    />
                    <Input
                        label="Clip Skip"
                        name="clip_skip"
                        type="number"
                        value={config.clipSkip}
                        onChange={(e) => updateConfig({ clipSkip: parseInt(e.target.value) })}
                    />
                </div>
                <Input
                    label="Prior Loss Weight"
                    name="loss_weight"
                    type="number"
                    step="0.01"
                    value={config.priorLossWeight}
                    onChange={(e) => updateConfig({ priorLossWeight: parseFloat(e.target.value) })}
                />
                <Input
                    label="Max Dataloader Workers"
                    name="max_data_loader_n_workers"
                    type="number"
                    value={config.maxDataLoaderWorkers}
                    onChange={(e) => updateConfig({ maxDataLoaderWorkers: parseInt(e.target.value) })}
                />
            </div>

            {/* Memory / Optimization */}
            <div className="pt-2 border-t border-[#3E3B5E]">
                <h3 className="text-xs font-bold text-[#5B5680] uppercase mb-3">Optimization</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Checkbox label="Cache Latents" name="cache_latents" checked={config.cacheLatents} onChange={(e) => updateConfig({ cacheLatents: e.target.checked })} />
                    <Checkbox label="Cache to Disk" name="cache_latents_to_disk" checked={config.cacheLatentsToDisk} onChange={(e) => updateConfig({ cacheLatentsToDisk: e.target.checked })} />
                    <Checkbox label="Xformers" name="xformers_enable" checked={config.useXformers} onChange={(e) => updateConfig({ useXformers: e.target.checked })} />
                    <Checkbox label="SDPA" name="sdpa_enable" checked={config.useSdpa} onChange={(e) => updateConfig({ useSdpa: e.target.checked })} />
                    <Checkbox label="Gradient Accum." name="grad_accumulation" checked={config.gradientAccumulation > 1} onChange={(e) => updateConfig({ gradientAccumulation: e.target.checked ? 2 : 1 })} />
                    {config.gradientAccumulation > 1 && (
                        <Input
                            label="Accumulation Steps"
                            name="grad_accumulation_steps"
                            type="number"
                            value={config.gradientAccumulation}
                            onChange={(e) => updateConfig({ gradientAccumulation: parseInt(e.target.value) })}
                        />
                    )}
                </div>
            </div>

            {/* Token Config */}
            <div className="pt-2 border-t border-[#3E3B5E]">
                <h3 className="text-xs font-bold text-[#5B5680] uppercase mb-3">Tokens</h3>
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
                    label="Keep Tokens Separator"
                    name="keep_tokens_separator"
                    value={config.keepTokensSeparator}
                    onChange={(e) => updateConfig({ keepTokensSeparator: e.target.value })}
                />
            </div>

            {/* Advanced Model */}
            <div className="pt-2 border-t border-[#3E3B5E]">
                <h3 className="text-xs font-bold text-[#5B5680] uppercase mb-3">Advanced Model</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Checkbox label="Low RAM" name="low_ram" checked={config.lowRam} onChange={(e) => updateConfig({ lowRam: e.target.checked })} />
                    <Checkbox label="High VRAM" name="high_vram" checked={config.highVram} onChange={(e) => updateConfig({ highVram: e.target.checked })} />
                    <Checkbox label="No Half VAE" name="no_half_vae" checked={config.noHalfVae} onChange={(e) => updateConfig({ noHalfVae: e.target.checked })} />
                    <Checkbox label="FP8 Base" name="fp8_base" checked={config.fp8Base} onChange={(e) => updateConfig({ fp8Base: e.target.checked })} />
                    <Checkbox label="Full FP16" name="full_fp16" checked={config.fullFp16} onChange={(e) => updateConfig({ fullFp16: e.target.checked })} />
                    <Checkbox label="Full BF16" name="full_bf16" checked={config.fullBf16} onChange={(e) => updateConfig({ fullBf16: e.target.checked })} />
                    <Checkbox label="Scale V-Pred Loss" name="v_pred_loss" checked={config.scaleVPredLoss} onChange={(e) => updateConfig({ scaleVPredLoss: e.target.checked })} />
                    <Checkbox label="Debiased Estim." name="debiased_estimation" checked={config.debiasedEstimationLoss} onChange={(e) => updateConfig({ debiasedEstimationLoss: e.target.checked })} />
                </div>
            </div>

            {/* VAE */}
            <div className="pt-2 border-t border-[#3E3B5E]">
                <h3 className="text-xs font-bold text-[#5B5680] uppercase mb-3">External VAE</h3>
                <Input
                    label="VAE Path"
                    name="vae_path"
                    value={config.vaePath}
                    onChange={(e) => updateConfig({ vaePath: e.target.value })}
                    placeholder="Path to VAE..."
                />
                <Select
                    label="VAE Padding Mode"
                    name="vae_padding_mode"
                    value={config.vaePaddingMode}
                    onChange={(e) => updateConfig({ vaePaddingMode: e.target.value as any })}
                    options={[
                        { value: 'zeros', label: 'Zeros' },
                        { value: 'reflect', label: 'Reflect' },
                        { value: 'replicate', label: 'Replicate' },
                        { value: 'circular', label: 'Circular' },
                    ]}
                />
            </div>

            {/* Comments */}
            <div className="pt-2 border-t border-[#3E3B5E]">
                <Input
                    label="Comment"
                    name="comment"
                    value={config.comment}
                    onChange={(e) => updateConfig({ comment: e.target.value })}
                    placeholder="Metadata comment..."
                />
            </div>
        </div>
    );
};

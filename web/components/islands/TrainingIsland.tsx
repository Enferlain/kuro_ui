import React from 'react';
import { useStore } from '../../lib/store';
import { Input, Select } from '../FormComponents';

export const TrainingIsland: React.FC = () => {
    const { config, updateConfig } = useStore();

    return (
        <div className="grid grid-cols-2 gap-4">
            <Input
                label="Resolution"
                name="resolution"
                type="number"
                value={config.resolution}
                onChange={(e) => updateConfig({ resolution: parseInt(e.target.value) })}
            />
            <Input
                label="Batch Size"
                name="train_batch_size"
                type="number"
                value={config.batchSize}
                onChange={(e) => updateConfig({ batchSize: parseInt(e.target.value) })}
            />
            <Input
                label="Max Epochs"
                name="max_train_epochs"
                type="number"
                value={config.maxTrainEpochs}
                onChange={(e) => updateConfig({ maxTrainEpochs: parseInt(e.target.value) })}
            />
            <Select
                label="Mixed Precision"
                name="mixed_precision"
                value={config.mixedPrecision}
                onChange={(e) => updateConfig({ mixedPrecision: e.target.value as any })}
                options={[
                    { value: 'no', label: 'No (FP32)' },
                    { value: 'fp16', label: 'FP16' },
                    { value: 'bf16', label: 'BF16' },
                ]}
            />
            <div className="col-span-2 flex items-center gap-3 p-2.5 bg-[#181625] rounded-sm border border-[#3E3B5E]">
                <input
                    type="checkbox"
                    id="grad_chk"
                    checked={config.gradientCheckpointing}
                    onChange={(e) => updateConfig({ gradientCheckpointing: e.target.checked })}
                    className="w-4 h-4 rounded-sm border-[#3E3B5E] text-violet-600 focus:ring-violet-500 bg-[#181625]"
                />
                <label htmlFor="grad_chk" className="text-sm text-[#948FB2] select-none cursor-pointer font-mono">Enable Gradient Checkpointing</label>
            </div>
        </div>
    );
};

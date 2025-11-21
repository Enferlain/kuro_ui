import React from 'react';
import { useStore } from '../../lib/store';
import { Input, Select } from '../FormComponents';

export const ModelIsland: React.FC = () => {
    const { config, updateConfig } = useStore();

    return (
        <div className="space-y-2">
            <Input
                label="Pretrained Model Path"
                name="pretrained_model_name_or_path"
                value={config.pretrainedModelPath}
                onChange={(e) => updateConfig({ pretrainedModelPath: e.target.value })}
                placeholder="e.g., run/sd-v1-5.ckpt"
            />

            <Select
                label="Model Architecture"
                name="model_architecture"
                value={config.modelType}
                onChange={(e) => updateConfig({ modelType: e.target.value as any })}
                options={[
                    { value: 'sd15', label: 'SD 1.5 / Realistic Vision' },
                    { value: 'sdxl', label: 'SDXL 1.0 / Pony' },
                    { value: 'sd2', label: 'SD 2.0 / 2.1' },
                ]}
            />
        </div>
    );
};

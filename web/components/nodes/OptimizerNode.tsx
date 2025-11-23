import React from 'react';
import { useStore } from '../../lib/store';
import { Input, Select } from '../FormComponents';
import { NodeSeparator } from '../NodeStyles';

export const OptimizerNode: React.FC = () => {
    const { config, updateConfig } = useStore();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Select
                    label="Optimizer"
                    name="optimizer_type"
                    value={config.optimizerType}
                    onChange={(e) => updateConfig({ optimizerType: e.target.value as any })}
                    options={[
                        { value: 'AdamW8bit', label: 'AdamW 8-bit' },
                        { value: 'Adafactor', label: 'Adafactor' },
                        { value: 'Prodigy', label: 'Prodigy' },
                    ]}
                />
                <Select
                    label="LR Scheduler"
                    name="lr_scheduler"
                    value={config.lrScheduler}
                    onChange={(e) => updateConfig({ lrScheduler: e.target.value as any })}
                    options={[
                        { value: 'cosine', label: 'Cosine' },
                        { value: 'constant', label: 'Constant' },
                        { value: 'constant_with_warmup', label: 'Constant + Warmup' },
                    ]}
                />
            </div>

            <NodeSeparator />

            <div className="space-y-2">
                <Input
                    label="Learning Rate"
                    name="learning_rate"
                    value={config.learningRate}
                    onChange={(e) => updateConfig({ learningRate: parseFloat(e.target.value) })}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="UNet LR"
                        name="unet_lr"
                        value={config.unetLr}
                        onChange={(e) => updateConfig({ unetLr: parseFloat(e.target.value) })}
                    />
                    <Input
                        label="Text Enc LR"
                        name="text_encoder_lr"
                        value={config.textEncoderLr}
                        onChange={(e) => updateConfig({ textEncoderLr: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <NodeSeparator />

            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Network Dim (Rank)"
                    name="network_dim"
                    type="number"
                    value={config.networkDim}
                    onChange={(e) => updateConfig({ networkDim: parseInt(e.target.value) })}
                />
                <Input
                    label="Network Alpha"
                    name="network_alpha"
                    type="number"
                    value={config.networkAlpha}
                    onChange={(e) => updateConfig({ networkAlpha: parseInt(e.target.value) })}
                />
            </div>
        </div>
    );
};

import React, { useEffect } from 'react';
import { useStore } from '../../lib/store';
import { Input, Select, Toggle, FieldWrapper, ToggleInput } from '../FormComponents';
import { NodeSeparator, NodeHeader } from '../NodeStyles';
import { OPTIMIZER_SCHEMAS, SCHEDULER_OPTIONS, OptimizerArgDef } from '../../lib/optimizer-schema';
import { HelpCircle } from 'lucide-react';

export const TrainingNode: React.FC = () => {
    const { config, updateConfig, openGemini } = useStore();

    // Reset optimizer args when type changes if they don't match the new schema
    // This is a simple safety check, but for now we'll just let the user manually manage it
    // or we could clear them. For better UX, we'll keep them but they might not be used.

    const currentOptimizerSchema = OPTIMIZER_SCHEMAS.find(opt => opt.id === config.optimizerType);

    const handleArgChange = (name: string, value: any) => {
        updateConfig({
            optimizerArgs: {
                ...config.optimizerArgs,
                [name]: value
            }
        });
    };

    const renderDynamicInput = (arg: OptimizerArgDef) => {
        const value = config.optimizerArgs?.[arg.name] ?? arg.default;

        switch (arg.type) {
            case 'float':
            case 'int':
                return (
                    <Input
                        key={arg.name}
                        label={arg.label}
                        name={arg.name}
                        type="number"
                        step={arg.step?.toString() || (arg.type === 'float' ? "0.01" : "1")}
                        min={arg.min?.toString()}
                        max={arg.max?.toString()}
                        value={value}
                        onChange={(e) => handleArgChange(arg.name, arg.type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value))}
                    />
                );
            case 'bool':
                return (
                    <Toggle
                        key={arg.name}
                        label={arg.label}
                        name={arg.name}
                        checked={!!value}
                        onChange={(e) => handleArgChange(arg.name, e.target.checked)}
                    />
                );
            case 'enum':
                return (
                    <Select
                        key={arg.name}
                        label={arg.label}
                        name={arg.name}
                        value={value}
                        onChange={(e) => handleArgChange(arg.name, e.target.value)}
                        options={arg.options?.map(opt => ({ value: opt, label: opt })) || []}
                    />
                );
            default:
                return null;
        }
    };

    // Sort args: non-bools first, bools last
    const sortedArgs = React.useMemo(() => {
        if (!currentOptimizerSchema) return [];
        return [...currentOptimizerSchema.args].sort((a, b) => {
            const aIsToggle = a.type === 'bool';
            const bIsToggle = b.type === 'bool';
            if (aIsToggle && !bIsToggle) return 1;
            if (!aIsToggle && bIsToggle) return -1;
            return 0;
        });
    }, [currentOptimizerSchema]);

    // Calculate if we need a spacer
    const needsSpacer = React.useMemo(() => {
        if (!currentOptimizerSchema) return false;
        const nonBoolCount = currentOptimizerSchema.args.filter(a => a.type !== 'bool').length;
        // If odd number of inputs/selects, the next item (first toggle) would be on the right.
        // We want it to be on the next row (left), so we need to fill the right slot.
        return nonBoolCount % 2 !== 0;
    }, [currentOptimizerSchema]);

    return (
        <div className="space-y-5">
            {/* Optimizer Selection */}
            <div className="space-y-3">
                <NodeHeader title="Optimizer" />
                <Select
                    label="Optimizer Type"
                    name="optimizer_type"
                    value={config.optimizerType}
                    onChange={(e) => {
                        // When changing optimizer, we might want to reset args or keep them.
                        // For now, we keep them in the store but the UI will only show relevant ones.
                        updateConfig({ optimizerType: e.target.value });
                    }}
                    options={OPTIMIZER_SCHEMAS.map(opt => ({ value: opt.id, label: opt.name }))}
                />

                {/* Dynamic Optimizer Args */}
                {currentOptimizerSchema && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#181625]/50 rounded-lg border border-[#2A273F]">
                        {sortedArgs.map((arg, i) => {
                            // Insert spacer before the first bool if needed
                            if (arg.type === 'bool' && needsSpacer && i > 0 && sortedArgs[i - 1].type !== 'bool') {
                                return (
                                    <React.Fragment key="spacer">
                                        <div className="hidden md:block" /> {/* Fill the gap */}
                                        {renderDynamicInput(arg)}
                                    </React.Fragment>
                                );
                            }
                            return renderDynamicInput(arg);
                        })}
                    </div>
                )}
            </div>

            <NodeSeparator />

            {/* Learning Rates */}
            <div className="space-y-3">
                <NodeHeader title="Learning Rates" />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Main Learning Rate"
                        name="learning_rate"
                        type="number"
                        step="0.0001"
                        value={config.learningRate}
                        onChange={(e) => updateConfig({ learningRate: parseFloat(e.target.value) })}
                    />
                    <ToggleInput
                        label="Unet Learning Rate"
                        name="unet_lr"
                        defaultValue={0.0001}
                        value={config.unetLr}
                        onChange={(val) => updateConfig({ unetLr: val })}
                    />
                    <ToggleInput
                        label="Text Encoder LR"
                        name="text_encoder_lr"
                        defaultValue={0.00005}
                        value={config.textEncoderLr}
                        onChange={(val) => updateConfig({ textEncoderLr: val })}
                    />
                </div>
            </div>

            <NodeSeparator />

            {/* Scheduler */}
            <div className="space-y-3">
                <NodeHeader title="Scheduler" />
                <Select
                    label="LR Scheduler"
                    name="lr_scheduler"
                    value={config.lrScheduler}
                    onChange={(e) => updateConfig({ lrScheduler: e.target.value as any })}
                    options={SCHEDULER_OPTIONS}
                />

                {/* Common Scheduler Args */}
                <div className="grid grid-cols-2 gap-3">
                    {/* We can add specific scheduler args here later if needed, e.g. warmup_ratio */}
                    <Input
                        label="Warmup Ratio"
                        name="warmup_ratio"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        // Note: warmupRatio is not yet in store, assuming we might need to add it or use optimizerArgs
                        // For now, let's assume it's a common arg we want to add to store or just use optimizerArgs
                        // The user requested it in the "Scheduler Settings" section of the task
                        value={config.optimizerArgs?.warmup_ratio ?? 0.0}
                        onChange={(e) => handleArgChange('warmup_ratio', parseFloat(e.target.value))}
                    />
                    <Input
                        label="Num Cycles"
                        name="num_cycles"
                        type="number"
                        step="1"
                        min="1"
                        value={config.optimizerArgs?.num_cycles ?? 1}
                        onChange={(e) => handleArgChange('num_cycles', parseInt(e.target.value))}
                    // Only show for cosine with restarts? Or always?
                    // For simplicity, we show it.
                    />
                </div>
            </div>
        </div>
    );
};

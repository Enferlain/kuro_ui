import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { Input, Select, Toggle, FieldWrapper } from '../FormComponents';
import { NodeSeparator, NodeHeader } from '../NodeStyles';
import { Plus, Trash2, FolderOpen, HelpCircle } from 'lucide-react';

const DropoutInput = ({ label, name, value, onChange }: { label: string, name: string, value: number | undefined, onChange: (v: number | undefined) => void }) => {
    const [localValue, setLocalValue] = useState<string>(value !== undefined ? value.toString() : '0.1');

    useEffect(() => {
        if (value !== undefined) {
            setLocalValue(value.toString());
        }
    }, [value]);

    return (
        <FieldWrapper label={label} id={name}>
            <div className="flex items-center h-[42px] border border-[#3E3B5E] rounded-sm overflow-hidden">
                <div className="flex items-center justify-center px-3 h-full border-r border-[#3E3B5E] bg-[#181625]">
                    <Toggle
                        name={name}
                        checked={value !== undefined}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const num = parseFloat(localValue);
                                onChange(isNaN(num) ? 0.1 : num);
                            } else {
                                onChange(undefined);
                            }
                        }}
                    />
                </div>
                <input
                    type="number"
                    step={0.1}
                    value={localValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        setLocalValue(val);
                        if (value !== undefined) {
                            const num = parseFloat(val);
                            if (!isNaN(num)) onChange(num);
                        }
                    }}
                    disabled={value === undefined}
                    className={`flex-1 px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono h-full min-w-0 bg-[#181625] transition-opacity ${value === undefined ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            </div>
        </FieldWrapper>
    );
};

export const NetworkNode: React.FC = () => {
    const { config, updateConfig, openGemini } = useStore();
    const [activeTab, setActiveTab] = useState<'main' | 'layers' | 'args'>('main');

    // Helper to update network args
    const addNetworkArg = () => {
        const currentArgs = config.networkArgs || [];
        const newArgs = [...currentArgs, { key: '', value: '' }];
        updateConfig({ networkArgs: newArgs });
    };

    const removeNetworkArg = (index: number) => {
        const currentArgs = config.networkArgs || [];
        const newArgs = currentArgs.filter((_, i) => i !== index);
        updateConfig({ networkArgs: newArgs });
    };

    const updateNetworkArg = (index: number, field: 'key' | 'value', value: string) => {
        const currentArgs = config.networkArgs || [];
        const newArgs = [...currentArgs];
        newArgs[index] = { ...newArgs[index], [field]: value };
        updateConfig({ networkArgs: newArgs });
    };

    return (
        <div className="space-y-5">
            {/* Tabs */}
            <div className="flex p-1 bg-[#181625] rounded-lg border border-[#3E3B5E]">
                <button
                    onClick={() => setActiveTab('main')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'main'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-[#948FB2] hover:text-[#E2E0EC]'
                        }`}
                >
                    Main
                </button>
                <button
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'layers'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-[#948FB2] hover:text-[#E2E0EC]'
                        }`}
                >
                    Layers
                </button>
                <button
                    onClick={() => setActiveTab('args')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'args'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-[#948FB2] hover:text-[#E2E0EC]'
                        }`}
                >
                    Args
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {activeTab === 'main' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="space-y-3">
                            <NodeHeader title="Network Selection" />
                            <Select
                                label="Network Algo"
                                name="network_algo"
                                value={
                                    config.networkAlgo === 'locon'
                                        ? `locon-${config.networkLoConType || 'kohya'}`
                                        : config.networkAlgo === 'dylora'
                                            ? `dylora-${config.networkDyLoRAType || 'lycoris'}`
                                            : config.networkAlgo || 'lora'
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.startsWith('locon-')) {
                                        updateConfig({
                                            networkAlgo: 'locon',
                                            networkLoConType: val.split('-')[1] as 'kohya' | 'lycoris'
                                        });
                                    } else if (val.startsWith('dylora-')) {
                                        updateConfig({
                                            networkAlgo: 'dylora',
                                            networkDyLoRAType: val.split('-')[1] as 'kohya' | 'lycoris'
                                        });
                                    } else {
                                        updateConfig({ networkAlgo: val });
                                    }
                                }}
                                options={[
                                    { value: 'lora', label: 'LoRA (Kohya)' },
                                    { value: 'locon-lycoris', label: 'LoCon' },
                                    { value: 'loha', label: 'LoHa' },
                                    { value: 'lokr', label: 'LoKr' },
                                    { value: 'ia3', label: 'IA3' },
                                    { value: 'dylora-lycoris', label: 'DyLoRA' },
                                    { value: 'diag-oft', label: 'DIAG-OFT' },
                                    { value: 'boft', label: 'BOFT' },
                                    { value: 'glora', label: 'GLoRA' },
                                    { value: 'glora-ex', label: 'GLoRA-Ex' },
                                    { value: 'abba', label: 'ABBA' },
                                    { value: 'full', label: 'FULL' },
                                ]}
                            />

                            {/* Preset Field - Always visible but disabled for LoRA (Kohya) */}
                            <div className={`relative group cursor-pointer transition-opacity duration-200 ${config.networkAlgo === 'lora' ? 'opacity-50' : ''}`}>
                                <Input
                                    label="LyCORIS Preset"
                                    name="network_preset"
                                    value={config.networkPreset || ''}
                                    onChange={(e) => updateConfig({ networkPreset: e.target.value })}
                                    placeholder="Path to preset file..."
                                    disabled={config.networkAlgo === 'lora'}
                                />
                                <FolderOpen className="absolute right-3 top-9 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
                            </div>
                        </div>

                        <NodeSeparator />

                        {/* Standard Dim/Alpha */}
                        <div className="space-y-3">
                            <NodeHeader title="Network Architecture" />
                            {config.networkAlgo === 'ia3' ? (
                                <div className="flex items-center gap-2 text-sm text-[#8B868D] font-mono italic px-1">
                                    <span>Only a single scaling vector is trained per layer.</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGemini('ia3_info'); }}
                                        className="text-[#5B5680] hover:text-violet-400 transition-colors"
                                        title="Query Intelligence"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : config.networkAlgo === 'full' ? (
                                <div className="flex items-center gap-2 text-sm text-[#8B868D] font-mono italic px-1">
                                    <span>Uses 100% of the original layer's size (maximum parameters).</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGemini('full_info'); }}
                                        className="text-[#5B5680] hover:text-violet-400 transition-colors"
                                        title="Query Intelligence"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Network Dim"
                                            name="network_dim"
                                            type="number"
                                            value={config.networkDim || 32}
                                            onChange={(e) => updateConfig({ networkDim: parseInt(e.target.value) })}
                                        />
                                        <Input
                                            label="Network Alpha"
                                            name="network_alpha"
                                            type="number"
                                            value={config.networkAlpha || 16}
                                            onChange={(e) => updateConfig({ networkAlpha: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    {/* Conv Dim/Alpha */}
                                    {(!['lora', 'diag-oft', 'boft'].includes(config.networkAlgo)) && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Conv Dim"
                                                name="network_conv_dim"
                                                type="number"
                                                value={config.networkConvDim || 32}
                                                onChange={(e) => updateConfig({ networkConvDim: parseInt(e.target.value) })}
                                            />
                                            <Input
                                                label="Conv Alpha"
                                                name="network_conv_alpha"
                                                type="number"
                                                value={config.networkConvAlpha || 16}
                                                onChange={(e) => updateConfig({ networkConvAlpha: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <NodeSeparator />

                        {/* Dropout Section */}
                        <div className="space-y-3">
                            <NodeHeader title="Regularization" />
                            <div className="grid grid-cols-3 gap-3">
                                <DropoutInput
                                    label="Network Dropout"
                                    name="network_dropout"
                                    value={config.networkDropout}
                                    onChange={(val) => updateConfig({ networkDropout: val })}
                                />
                                <DropoutInput
                                    label="Rank Dropout"
                                    name="rank_dropout"
                                    value={config.rankDropout}
                                    onChange={(val) => updateConfig({ rankDropout: val })}
                                />
                                <DropoutInput
                                    label="Module Dropout"
                                    name="module_dropout"
                                    value={config.moduleDropout}
                                    onChange={(val) => updateConfig({ moduleDropout: val })}
                                />
                            </div>
                        </div>

                        <NodeSeparator />

                        {/* Dynamic Settings based on Algo */}
                        {config.networkAlgo !== 'lora' && (
                            <div className="space-y-3 pt-2">
                                <NodeHeader title="Algorithm Specifics" />
                                {/* Section 1: Fields & Toggle/Fields */}
                                <div className="space-y-3">
                                    {/* Block Size */}
                                    {(['dylora', 'diag-oft', 'boft'].includes(config.networkAlgo)) && (
                                        <Input
                                            label="Block Size"
                                            name="network_block_size"
                                            type="number"
                                            value={config.networkBlockSize || 4}
                                            onChange={(e) => updateConfig({ networkBlockSize: parseInt(e.target.value) })}
                                        />
                                    )}

                                    {/* LoKr Factor */}
                                    {config.networkAlgo === 'lokr' && (
                                        <div className={`transition-opacity duration-200 ${config.networkLoKrFullMatrix ? 'opacity-50' : ''}`}>
                                            <Input
                                                label="Factor"
                                                name="network_lokr_factor"
                                                type="number"
                                                value={config.networkLoKrFactor ?? -1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    updateConfig({ networkLoKrFactor: isNaN(val) ? -1 : val });
                                                }}
                                                placeholder="-1 for auto"
                                                disabled={config.networkLoKrFullMatrix}
                                            />
                                        </div>
                                    )}

                                    {/* DIAG-OFT / BOFT - Constraint (Toggle + Input) */}
                                    {['diag-oft', 'boft'].includes(config.networkAlgo) && (
                                        <FieldWrapper label="Constraint" id="network_constraint_enabled">
                                            <div className="flex items-center h-[42px] bg-[#181625] border border-[#3E3B5E] rounded-sm overflow-hidden">
                                                <div className="flex items-center justify-center px-3 h-full border-r border-[#3E3B5E]">
                                                    <Toggle
                                                        name="network_constraint_enabled"
                                                        checked={config.networkConstraintEnabled}
                                                        onChange={(e) => updateConfig({ networkConstraintEnabled: e.target.checked })}
                                                    />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={config.networkConstraint}
                                                    onChange={(e) => updateConfig({ networkConstraint: parseFloat(e.target.value) })}
                                                    disabled={!config.networkConstraintEnabled}
                                                    step={0.1}
                                                    className="flex-1 bg-transparent px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono h-full min-w-0"
                                                />
                                            </div>
                                        </FieldWrapper>
                                    )}
                                </div>

                                {/* Section 2: Toggles Grid - 3 Columns */}
                                <div className="grid grid-cols-3 gap-3">
                                    {/* --- Algo Specific Toggles --- */}

                                    {/* LoKr Specifics - Moved to top as requested */}
                                    {config.networkAlgo === 'lokr' && (
                                        <>
                                            <Toggle
                                                label="Full Matrix"
                                                name="network_lokr_full_matrix"
                                                checked={config.networkLoKrFullMatrix}
                                                onChange={(e) => updateConfig({ networkLoKrFullMatrix: e.target.checked })}
                                            />
                                            <Toggle
                                                label="Unbalanced Factorization"
                                                name="network_lokr_unbalanced"
                                                checked={config.networkLoKrUnbalancedFactorization}
                                                onChange={(e) => updateConfig({ networkLoKrUnbalancedFactorization: e.target.checked })}
                                            />
                                            <Toggle
                                                label="Decompose Both"
                                                name="network_lokr_decompose_both"
                                                checked={config.networkLoKrDecomposeBoth}
                                                onChange={(e) => updateConfig({ networkLoKrDecomposeBoth: e.target.checked })}
                                            />
                                        </>
                                    )}

                                    {/* Weight Decomposition */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'abba'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Weight Decomposition"
                                                name="network_weight_decomposition"
                                                checked={config.networkWeightDecomposition}
                                                onChange={(e) => {
                                                    const newVal = e.target.checked;
                                                    updateConfig({
                                                        networkWeightDecomposition: newVal,
                                                        networkWdOnOutput: newVal ? config.networkWdOnOutput : false
                                                    });
                                                }}
                                            />
                                        )}

                                    {/* WD on Output */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'abba'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="WD on Output"
                                                name="network_wd_on_output"
                                                checked={config.networkWdOnOutput}
                                                onChange={(e) => {
                                                    const newVal = e.target.checked;
                                                    updateConfig({
                                                        networkWdOnOutput: newVal,
                                                        networkWeightDecomposition: newVal ? true : config.networkWeightDecomposition
                                                    });
                                                }}
                                            />
                                        )}

                                    {/* Tucker Decomposition */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'glora', 'glora-ex'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Tucker Decomposition"
                                                name="network_tucker_decomposition"
                                                checked={config.networkTuckerDecomposition}
                                                onChange={(e) => updateConfig({ networkTuckerDecomposition: e.target.checked })}
                                            />
                                        )}

                                    {/* Orthogonalize */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['lokr', 'glora', 'glora-ex'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Orthogonalize"
                                                name="network_orthogonalize"
                                                checked={config.networkOrthogonalize}
                                                onChange={(e) => updateConfig({ networkOrthogonalize: e.target.checked })}
                                            />
                                        )}

                                    {/* Rank Stabilized */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'glora', 'glora-ex'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Rank Stabilized"
                                                name="network_rank_stabilized"
                                                checked={config.networkRankStabilized}
                                                onChange={(e) => updateConfig({ networkRankStabilized: e.target.checked })}
                                            />
                                        )}

                                    {/* IA3 - Train on Input */}
                                    {config.networkAlgo === 'ia3' && (
                                        <Toggle
                                            label="Train on Input"
                                            name="network_train_on_input"
                                            checked={config.networkTrainOnInput}
                                            onChange={(e) => updateConfig({ networkTrainOnInput: e.target.checked })}
                                        />
                                    )}

                                    {/* DIAG-OFT / BOFT - Rescaled */}
                                    {['diag-oft', 'boft'].includes(config.networkAlgo) && (
                                        <Toggle
                                            label="Rescaled"
                                            name="network_rescaled"
                                            checked={config.networkRescaled}
                                            onChange={(e) => updateConfig({ networkRescaled: e.target.checked })}
                                        />
                                    )}

                                    {/* --- General Toggles --- */}

                                    {/* Train Norm */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'dylora', 'diag-oft', 'boft', 'glora', 'glora-ex', 'abba', 'full'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Train Norm"
                                                name="network_train_norm"
                                                checked={config.networkTrainNorm}
                                                onChange={(e) => updateConfig({ networkTrainNorm: e.target.checked })}
                                            />
                                        )}

                                    {/* Use Scalar */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'glora', 'glora-ex', 'abba'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Use Scalar"
                                                name="network_use_scalar"
                                                checked={config.networkUseScalar}
                                                onChange={(e) => updateConfig({ networkUseScalar: e.target.checked })}
                                            />
                                        )}

                                    {/* Bypass Mode */}
                                    {((config.networkAlgo === 'locon' && config.networkLoConType === 'lycoris') ||
                                        ['loha', 'lokr', 'dylora', 'diag-oft', 'boft', 'glora', 'glora-ex', 'abba'].includes(config.networkAlgo)) && (
                                            <Toggle
                                                label="Bypass Mode"
                                                name="network_bypass_mode"
                                                checked={config.networkBypassMode}
                                                onChange={(e) => updateConfig({ networkBypassMode: e.target.checked })}
                                            />
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'layers' && (
                    <div className="flex flex-col items-center justify-center h-[300px] text-[#5B5680] animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <p className="text-sm font-mono">Layer groups feature coming soon...</p>
                    </div>
                )}

                {activeTab === 'args' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <NodeHeader
                            title="Network Arguments"
                            action={
                                <button
                                    onClick={addNetworkArg}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-[#2A273F] hover:bg-violet-600 text-[#948FB2] hover:text-white rounded text-xs font-medium transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Arg
                                </button>
                            }
                        />

                        <div className="space-y-2">
                            {(config.networkArgs || []).length === 0 ? (
                                <div className="text-center py-8 text-[#5B5680] text-xs italic">
                                    No additional arguments
                                </div>
                            ) : (
                                (config.networkArgs || []).map((arg, index) => (
                                    <div key={index} className="flex gap-2 items-start group">
                                        <div className="flex-1">
                                            <input
                                                placeholder="Key"
                                                value={arg.key}
                                                onChange={(e) => updateNetworkArg(index, 'key', e.target.value)}
                                                className="w-full bg-[#181625] border border-[#3E3B5E] rounded-sm px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none focus:border-violet-600 focus:ring-0 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                placeholder="Value"
                                                value={arg.value}
                                                onChange={(e) => updateNetworkArg(index, 'value', e.target.value)}
                                                className="w-full bg-[#181625] border border-[#3E3B5E] rounded-sm px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none focus:border-violet-600 focus:ring-0 transition-all font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeNetworkArg(index)}
                                            className="p-2 text-[#5B5680] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

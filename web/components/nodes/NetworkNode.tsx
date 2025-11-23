import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Input, Select, FieldWrapper } from '../FormComponents';
import { NodeSeparator, NodeHeader } from '../NodeStyles';
import { Plus, Trash2 } from 'lucide-react';

export const NetworkNode: React.FC = () => {
    const { config, updateConfig } = useStore();
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
                        <Select
                            label="Network Algo"
                            name="network_algo"
                            value={config.networkAlgo || 'lora'}
                            onChange={(e) => updateConfig({ networkAlgo: e.target.value })}
                            options={[
                                { value: 'lora', label: 'LoRA' },
                                { value: 'loha', label: 'LoHa' },
                                { value: 'lokr', label: 'LoKr' },
                                { value: 'ia3', label: 'IA3' },
                                { value: 'dylora', label: 'DyLoRA' },
                            ]}
                        />

                        <Input
                            label="LyCORIS Preset"
                            name="network_preset"
                            value={config.networkPreset || ''}
                            onChange={(e) => updateConfig({ networkPreset: e.target.value })}
                            placeholder="Path to preset file..."
                        />

                        <NodeSeparator />

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

                        <NodeSeparator />
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

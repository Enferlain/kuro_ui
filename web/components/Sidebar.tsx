'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ChevronLeft, ChevronRight, Settings, FolderCog } from 'lucide-react';
import { useStore } from '../lib/store';
import { Select } from './FormComponents';

export const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { config, updateConfig } = useStore();

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-1/2 -translate-y-1/2 z-50 bg-[#232034] border-y border-r border-[#3E3B5E] p-2 rounded-r-md text-[#948FB2] hover:text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${isOpen ? 'left-80' : 'left-0'}`}
            >
                {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            <motion.div
                initial={{ x: -320 }}
                animate={{ x: isOpen ? 0 : -320 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-full w-80 bg-[#181625]/95 backdrop-blur-xl border-r border-[#3E3B5E] z-40 flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-5 border-b border-[#3E3B5E] flex items-center gap-3 bg-[#13111b]/50">
                    <div className="p-2 bg-violet-600/20 rounded-sm">
                        <Globe className="text-violet-500" size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[#E2E0EC] uppercase tracking-widest font-mono">Global</h2>
                        <p className="text-[10px] text-[#5B5680] uppercase tracking-wider">Project Settings</p>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-8"
                    onWheel={(e) => e.stopPropagation()}
                >

                    {/* Train Mode Section */}
                    <section>
                        <h3 className="text-xs font-bold text-[#5B5680] uppercase mb-4 flex items-center gap-2 border-b border-[#3E3B5E]/50 pb-2">
                            <Settings size={12} /> Mode Selection
                        </h3>
                        <Select
                            label="Train Mode"
                            name="train_mode"
                            value={config.trainMode}
                            onChange={(e) => updateConfig({ trainMode: e.target.value as any })}
                            options={[
                                { value: 'lora', label: 'LoRA' },
                                { value: 'textual_inversion', label: 'Textual Inversion' },
                            ]}
                        />
                    </section>

                    {/* Quick Actions / File Ops */}
                    <section>
                        <h3 className="text-xs font-bold text-[#5B5680] uppercase mb-4 flex items-center gap-2 border-b border-[#3E3B5E]/50 pb-2">
                            <FolderCog size={12} /> Configuration
                        </h3>
                        <div className="space-y-2">
                            <button className="w-full text-left px-4 py-3 text-xs text-[#948FB2] hover:text-[#E2E0EC] bg-[#232034]/50 hover:bg-[#232034] rounded-sm transition-colors font-mono border border-[#3E3B5E] hover:border-[#5B5680]">
                                Load Config (.toml)
                            </button>
                            <button className="w-full text-left px-4 py-3 text-xs text-[#948FB2] hover:text-[#E2E0EC] bg-[#232034]/50 hover:bg-[#232034] rounded-sm transition-colors font-mono border border-[#3E3B5E] hover:border-[#5B5680]">
                                Save Config (.toml)
                            </button>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#3E3B5E] bg-[#13111b]/50 text-[10px] text-[#5B5680] text-center font-mono uppercase">
                    Kuro Trainer v0.1.0
                </div>
            </motion.div>
        </>
    );
};

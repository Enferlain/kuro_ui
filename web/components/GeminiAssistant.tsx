'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { explainParameter } from '../lib/geminiService';
import { X, Loader2, Terminal } from 'lucide-react';

export const GeminiAssistant: React.FC = () => {
    const { isGeminiOpen, geminiContext, closeGemini } = useStore();
    const [response, setResponse] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isGeminiOpen && geminiContext) {
            const fetchExplanation = async () => {
                setLoading(true);
                setResponse('');
                const text = await explainParameter(geminiContext, "LoRA Training / sd-scripts");
                setResponse(text);
                setLoading(false);
            };
            fetchExplanation();
        }
    }, [isGeminiOpen, geminiContext]);

    if (!isGeminiOpen) return null;

    return (
        <div className="fixed bottom-8 right-8 w-80 bg-[#232034]/95 backdrop-blur-xl border border-[#3E3B5E] rounded-sm shadow-2xl z-50 overflow-hidden text-[#E2E0EC] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#181625] p-3 flex items-center justify-between border-b border-[#3E3B5E]">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-violet-500" />
                    <h3 className="font-bold text-[#E2E0EC] text-xs uppercase tracking-widest">Kuro Intelligence</h3>
                </div>
                <button onClick={closeGemini} className="hover:text-white text-[#5B5680] transition">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-5">
                <div className="mb-3 text-[10px] font-bold text-violet-500 uppercase tracking-widest">
                    Analyzing: {geminiContext}
                </div>

                <div className="min-h-[100px] text-xs leading-relaxed text-[#948FB2] font-mono">
                    {loading ? (
                        <div className="flex items-center justify-center h-20 gap-2 text-[#5B5680]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        response
                    )}
                </div>
            </div>

            <div className="bg-[#0f0e14] p-2 border-t border-[#3E3B5E] text-[9px] text-[#5B5680] text-center uppercase tracking-wider">
                Powered by Gemini 2.5 Flash
            </div>
        </div>
    );
};

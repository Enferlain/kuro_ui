'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useStore } from '../lib/store';

interface FieldProps {
    label: string;
    id: string; // acts as context for AI
    children: React.ReactNode;
}

export const FieldWrapper: React.FC<FieldProps> = ({ label, id, children }) => {
    const openGemini = useStore((state) => state.openGemini);
    const highlightedField = useStore((state) => state.highlightedField);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (highlightedField === id && containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedField, id]);

    const isHighlighted = highlightedField === id;

    return (
        <div
            ref={containerRef}
            className={`flex flex-col gap-2 mb-5 transition-all duration-500 ${isHighlighted ? 'bg-violet-500/10 p-2 -m-2 rounded-md ring-1 ring-violet-500' : ''}`}
        >
            <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-widest font-mono ${isHighlighted ? 'text-violet-400' : 'text-[#5B5680]'}`}>
                    {label}
                </label>
                <button
                    onClick={(e) => { e.stopPropagation(); openGemini(id); }}
                    className="text-[#5B5680] hover:text-violet-400 transition-colors"
                    title="Query Intelligence"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                </button>
            </div>
            {children}
        </div>
    );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
}

export const Input: React.FC<InputProps> = ({ label, name, className = '', ...props }) => {
    return (
        <FieldWrapper label={label} id={name}>
            <input
                className={`bg-[#181625] border border-[#3E3B5E] rounded-sm px-3 py-2.5 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none focus:border-violet-600 focus:ring-0 transition-all font-mono w-full ${className}`}
                {...props}
            />
        </FieldWrapper>
    );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    name: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, name, options, ...props }) => {
    return (
        <FieldWrapper label={label} id={name}>
            <select
                className="bg-[#181625] border border-[#3E3B5E] rounded-sm px-3 py-2.5 text-sm text-[#E2E0EC] focus:outline-none focus:border-violet-600 focus:ring-0 transition-all appearance-none font-mono w-full"
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </FieldWrapper>
    );
};

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, name, className = '', ...props }) => {
    return (
        <div className="flex items-center gap-3 p-2.5 bg-[#181625] rounded-sm border border-[#3E3B5E]">
            <input
                type="checkbox"
                id={name}
                className={`w-4 h-4 rounded-sm border-[#3E3B5E] text-violet-600 focus:ring-violet-500 bg-[#181625] ${className}`}
                {...props}
            />
            <label htmlFor={name} className="text-sm text-[#948FB2] select-none cursor-pointer font-mono">{label}</label>
        </div>
    );
};

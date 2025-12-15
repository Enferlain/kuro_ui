'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useStore } from '../lib/store';

// Re-export Select
export { Select } from './Select';

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
            className={`flex flex-col gap-2 transition-all duration-500 ${isHighlighted ? 'bg-violet-500/10 p-2 -m-2 rounded-md ring-1 ring-violet-500' : ''}`}
        >
            <div className="flex items-center gap-1.5">
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
                className={`bg-[#181625] border border-[#3E3B5E] rounded-sm px-3 py-2.5 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none focus:border-violet-600 focus:ring-0 transition-colors font-mono w-full disabled:cursor-not-allowed ${className}`}
                {...props}
            />
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
                className={`w-4 h-4 rounded-sm border-[#3E3B5E] text-violet-600 focus:ring-violet-500 bg-[#181625] disabled:cursor-not-allowed ${className}`}
                {...props}
            />
            <label htmlFor={name} className={`text-sm text-[#948FB2] select-none font-mono ${props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>{label}</label>
        </div>
    );
};

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    name: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, name, className = '', ...props }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <label htmlFor={name} className={`relative inline-flex items-center shrink-0 ${props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="checkbox" id={name} className="sr-only peer" {...props} />
                <div className={`w-9 h-5 bg-[#2A273F] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#948FB2] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white peer-checked:after:border-white ${props.disabled ? 'opacity-50' : ''}`}></div>
            </label>
            {label && <span className={`text-sm text-[#948FB2] select-none font-mono ${props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} onClick={() => !props.disabled && document.getElementById(name)?.click()}>{label}</span>}
        </div>
    );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    name: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, name, className = '', ...props }) => {
    return (
        <FieldWrapper label={label} id={name}>
            <textarea
                className={`bg-[#181625] border border-[#3E3B5E] rounded-sm px-3 py-2.5 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none focus:border-violet-600 focus:ring-0 transition-colors font-mono w-full min-h-[100px] resize-y disabled:cursor-not-allowed ${className}`}
                {...props}
            />
        </FieldWrapper>
    );
};

interface ToggleInputProps {
    label: string;
    name: string;
    value?: string | number;
    defaultValue?: string | number;
    onChange: (value?: any) => void;
    step?: number;
    type?: 'text' | 'number';
    placeholder?: string;
}

export const ToggleInput: React.FC<ToggleInputProps> = ({
    label,
    name,
    value,
    defaultValue = 0.0001,
    onChange,
    step = 0.0001,
    type = 'number',
    placeholder,
}) => {
    const [localValue, setLocalValue] = React.useState<string>(value !== undefined ? value.toString() : defaultValue?.toString() || '');

    React.useEffect(() => {
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
                        checked={value !== undefined && value !== ''}
                        onChange={(e) => {
                            if (e.target.checked) {
                                if (type === 'number') {
                                    const num = parseFloat(localValue);
                                    onChange(isNaN(num) ? defaultValue : num);
                                } else {
                                    onChange(localValue || defaultValue);
                                }
                            } else {
                                onChange(undefined);
                            }
                        }}
                    />
                </div>
                <input
                    type={type}
                    step={type === 'number' ? step : undefined}
                    value={localValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        setLocalValue(val);
                        if (value !== undefined && value !== '') {
                            if (type === 'number') {
                                const num = parseFloat(val);
                                if (!isNaN(num)) onChange(num);
                            } else {
                                onChange(val);
                            }
                        }
                    }}
                    disabled={value === undefined || value === ''}
                    placeholder={placeholder}
                    className={`flex-1 px-3 py-2 text-sm text-[#E2E0EC] placeholder-[#5B5680] focus:outline-none font-mono h-full min-w-0 bg-[#181625] transition-opacity ${value === undefined || value === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            </div>
        </FieldWrapper>
    );
};

import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { FieldWrapper } from './FormComponents';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    name: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, name, options, className = '', value, onChange, disabled, ...props }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Click outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value || options[0]?.label || "Select...";

    const handleSelect = (newValue: string) => {
        if (onChange) {
            // Mock synthetic event to maintain compatibility with existing consumers
            const mockEvent = {
                target: { value: newValue, name },
                currentTarget: { value: newValue, name },
                preventDefault: () => { },
                stopPropagation: () => { }
            } as any; // Cast to avoid full SyntheticEvent implementation
            onChange(mockEvent);
        }
        setIsOpen(false);
    };

    return (
        <FieldWrapper label={label} id={name}>
            <div className="relative font-mono" ref={containerRef}>
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between
                        bg-[#181625] border border-[#3E3B5E] rounded-sm 
                        px-3 py-2.5 text-sm text-[#E2E0EC] 
                        focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/50 
                        transition-all duration-200
                        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#565275]'}
                        ${isOpen ? 'border-violet-600 ring-1 ring-violet-600/50' : ''}
                        ${className}
                    `}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDown size={14} className={`text-[#5B5680] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-[#1E1B2E] border border-[#3E3B5E] rounded-sm shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top">
                        {options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                        px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                                        transition-colors duration-150
                                        ${isSelected ? 'bg-violet-600/10 text-violet-400' : 'text-[#948FB2] hover:bg-[#232034] hover:text-[#E2E0EC]'}
                                    `}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={12} className="text-violet-500" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Hidden Native Select for Form Data / Accessibility backup if needed, but not strictly required if controlled */}
            <select name={name} value={value} className="hidden" aria-hidden="true" {...props}>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </FieldWrapper>
    );
};

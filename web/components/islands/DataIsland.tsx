import React from 'react';
import { useStore } from '../../lib/store';
import { Input } from '../FormComponents';
import { FolderOpen } from 'lucide-react';

export const DataIsland: React.FC = () => {
    const { config, updateConfig } = useStore();

    return (
        <div className="space-y-2">
            <div className="relative group cursor-pointer">
                <Input
                    label="Image Directory"
                    name="image_directory"
                    value={config.imageDir}
                    onChange={(e) => updateConfig({ imageDir: e.target.value })}
                />
                <FolderOpen className="absolute right-3 top-8 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
            </div>

            <div className="relative group cursor-pointer">
                <Input
                    label="Regularization Dir"
                    name="reg_directory"
                    value={config.regDir}
                    onChange={(e) => updateConfig({ regDir: e.target.value })}
                />
                <FolderOpen className="absolute right-3 top-8 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
            </div>

            <div className="relative group cursor-pointer">
                <Input
                    label="Output Directory"
                    name="output_directory"
                    value={config.outputDir}
                    onChange={(e) => updateConfig({ outputDir: e.target.value })}
                />
                <FolderOpen className="absolute right-3 top-8 w-4 h-4 text-[#484463] group-hover:text-violet-400 transition-colors" />
            </div>
        </div>
    );
};

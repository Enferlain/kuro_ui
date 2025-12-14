import React from 'react';

interface NodeSeparatorProps {
    className?: string;
}

export const NodeSeparator: React.FC<NodeSeparatorProps> = ({ className = '' }) => {
    return <div className={`h-px bg-node-border ${className}`} />;
};

interface NodeHeaderProps {
    title: string;
    action?: React.ReactNode;
    className?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({ title, action, className = '' }) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <h3 className="text-xs font-bold text-node-header uppercase tracking-wider">{title}</h3>
            {action && <div>{action}</div>}
        </div>
    );
};
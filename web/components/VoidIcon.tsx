import React from 'react';

export const VoidIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
    // === V3 GEOMETRY ===
    // This is the full petal shape
    const fullShape = "M 0 0 L 58 -57.4 Q 41.76 -103.656 0 -140 Q -41.76 -103.656 -58 -57.4 L 0 0 Z";
    
    // This is the right-half overlay for the two-tone effect
    const halfShape = "M 0 0 L 58 -57.4 Q 41.76 -103.656 0 -140 L 0 0 Z";

    return (
        <svg
            id="kuro-void-3"
            viewBox="-160 -160 320 320"
            className={`drop-shadow-2xl transition-all duration-300 ${className || ''}`.trim()}
            style={style}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
        >
            <g>
                {/* Top Petal (Standard Split) */}
                <g transform="rotate(0)">
                    <path d={fullShape} fill="#554b98" stroke="none" />
                    <path d={halfShape} fill="#8060b0" stroke="none" />
                    <path d={fullShape} fill="none" stroke="#2a2c58" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
                </g>

                {/* Right Petal (Inverted Split) */}
                <g transform="rotate(90)">
                    <path d={fullShape} fill="#8060b0" stroke="none" />
                    <path d={halfShape} fill="#554b98" stroke="none" />
                    <path d={fullShape} fill="none" stroke="#2a2c58" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
                </g>

                {/* Bottom Petal (Solid Dark) */}
                <g transform="rotate(180)">
                    <path d={fullShape} fill="#554b98" stroke="none" />
                    <path d={halfShape} fill="#554b98" stroke="none" />
                    <path d={fullShape} fill="none" stroke="#2a2c58" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
                </g>

                {/* Left Petal (Solid Dark) */}
                <g transform="rotate(270)">
                    <path d={fullShape} fill="#554b98" stroke="none" />
                    <path d={halfShape} fill="#554b98" stroke="none" />
                    <path d={fullShape} fill="none" stroke="#2a2c58" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
                </g>
            </g>
        </svg>
    );
};
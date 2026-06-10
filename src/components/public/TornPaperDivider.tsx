"use client";

import React from 'react';

export default function TornPaperDivider() {
    const spikes = 36;
    const width = 1440;
    const spikeWidth = width / spikes;
    const topY = 6;
    const bottomY = 30;

    // Generate a mathematically perfect zig-zag vector representing torn spiral notebook paper
    let pathD = `M 0 45 L 0 ${topY}`;
    for (let i = 0; i < spikes; i++) {
        const x1 = (i * spikeWidth) + (spikeWidth / 2);
        const x2 = (i + 1) * spikeWidth;
        pathD += ` L ${x1} ${bottomY} L ${x2} ${topY}`;
    }
    pathD += ` L ${width} 45 Z`;

    return (
        <div className="w-full overflow-hidden bg-transparent pointer-events-none select-none relative z-25 -mt-6 sm:-mt-8">
            <svg 
                viewBox="0 0 1440 45" 
                className="w-full h-auto block" 
                preserveAspectRatio="none"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Hard Pop-Art drop shadow */}
                <path 
                    d={pathD.replace("M 0 45", "M 0 49").replace("L 1440 45 Z", "L 1440 49 Z")} 
                    fill="black" 
                    opacity="0.15"
                />
                
                {/* Main ripped ticket/paper stroke and fill */}
                <path 
                    d={pathD} 
                    fill="#FDFCF8" 
                    stroke="black" 
                    strokeWidth="4" 
                    strokeLinejoin="miter"
                />
            </svg>
        </div>
    );
}

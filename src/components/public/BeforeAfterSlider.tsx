"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";


interface BeforeAfterSliderProps {
    beforeUrl: string;
    afterUrl: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export default function BeforeAfterSlider({
    beforeUrl,
    afterUrl,
    beforeLabel = "ANTES",
    afterLabel = "DESPUÉS",
}: BeforeAfterSliderProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const calcPos = useCallback((clientX: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onMouseMove = useCallback(
        (e: MouseEvent) => { if (isDragging) calcPos(e.clientX); },
        [isDragging, calcPos]
    );
    const onMouseUp = useCallback(() => setIsDragging(false), []);

    const onTouchStart = () => setIsDragging(true);
    const onTouchMove = useCallback(
        (e: TouchEvent) => { if (isDragging) calcPos(e.touches[0].clientX); },
        [isDragging, calcPos]
    );
    const onTouchEnd = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("touchend", onTouchEnd);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

    // Update CSS variables via ref to avoid inline styles warning
    useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.style.setProperty('--slider-pos', `${sliderPos}%`);
            containerRef.current.style.setProperty('--slider-pos-calc', `calc(${sliderPos}% - 1px)`);
            containerRef.current.style.setProperty('--slider-width', sliderPos > 0 ? `${100 / (sliderPos / 100)}%` : '0%');
        }
    }, [sliderPos]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-col-resize select-none touch-none group"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* After image (full) */}
            <div className="absolute inset-0 z-0">
                <img src={afterUrl} alt="Después" className="absolute inset-0 w-full h-full object-cover" />
                {/* Labels for AFTER */}
                <div className="absolute bottom-3 right-3 pointer-events-none">
                    <span className="bg-primary/80 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm">
                        {afterLabel}
                    </span>
                </div>
            </div>

            {/* Before image (clipped) */}
            <div
                className="absolute inset-0 overflow-hidden z-10 w-(--slider-pos)"
            >
                <div className="absolute inset-0 w-(--slider-width)">
                    <img src={beforeUrl} alt="Antes" className="absolute inset-0 w-full h-full object-cover" />
                    {/* Labels for BEFORE */}
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                        <span className="bg-black/60 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm">
                            {beforeLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Divider line */}
            <div
                className="absolute inset-y-0 z-20 pointer-events-none left-(--slider-pos-calc)"
            >
                <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
            </div>

            {/* Handle */}
            <div
                className="absolute top-1/2 z-20 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none left-(--slider-pos)"
            >
                <div className={`w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center transition-transform duration-150 ${isDragging ? "scale-125" : "group-hover:scale-110"}`}>
                    {/* Left/Right arrows */}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="currentColor">
                        <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
                        <path d="M8.59 7.41 10 6l6 6-6 6-1.41-1.41L13.17 12 8.59 7.41z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

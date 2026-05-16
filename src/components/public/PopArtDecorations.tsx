import React from 'react';
import { cn } from '@/lib/utils';
import { Star, Zap, Circle, Sparkles, Heart, Bone } from 'lucide-react';

export const PopArtStar = ({ className }: { className?: string }) => (
    <div className={cn("relative", className)}>
        <Star className="w-full h-full text-accent drop-shadow-[4px_4px_0px_#1A1A1A] fill-accent" strokeWidth={2} stroke="black" />
    </div>
);

export const PopArtZap = ({ className }: { className?: string }) => (
    <div className={cn("relative", className)}>
        <Zap className="w-full h-full text-primary drop-shadow-[4px_4px_0px_#1A1A1A] fill-primary" strokeWidth={2} stroke="black" />
    </div>
);

export const PopArtCircle = ({ className }: { className?: string }) => (
    <div className={cn("rounded-full border-4 border-black bg-info shadow-[6px_6px_0px_0px_#1A1A1A]", className)} />
);

export const PopArtBurst = ({ className }: { className?: string }) => (
    <div className={cn("relative", className)}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[4px_4px_0px_#1A1A1A]">
            <path d="M50 0 L60 35 L95 30 L70 55 L90 85 L55 70 L50 100 L45 70 L10 85 L30 55 L5 30 L40 35 Z" fill="#f09433" stroke="black" strokeWidth="3" />
        </svg>
    </div>
);

export const PopArtZigZag = ({ className }: { className?: string }) => (
    <div className={cn("relative", className)}>
        <svg viewBox="0 0 100 20" className="w-full h-full drop-shadow-[3px_3px_0px_#1A1A1A]">
            <path d="M0 10 L10 0 L30 20 L50 0 L70 20 L90 0 L100 10" fill="none" stroke="#bc1888" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

export const PopArtSticker = ({ text, className, color = "bg-primary" }: { text: string, className?: string, color?: string }) => (
    <div className={cn("px-4 py-2 border-[3px] border-black font-black uppercase text-foreground shadow-[4px_4px_0px_0px_#000] rotate-[-5deg]", color, className)}>
        {text}
    </div>
);

export const PopArtDots = ({ className }: { className?: string }) => (
    <div className={cn("relative opacity-40 bg-[radial-gradient(#000_20%,transparent_20%)] bg-size-[10px_10px]", className)} />
);

// Helper function to get a random decoration for the carousel or other sections
export const getRandomDecoration = (seed: number, className?: string) => {
    const decorations = [
        <PopArtStar key="star" className={cn("w-16 h-16", className)} />,
        <PopArtZap key="zap" className={cn("w-16 h-16", className)} />,
        <PopArtCircle key="circle" className={cn("w-12 h-12", className)} />,
        <PopArtBurst key="burst" className={cn("w-20 h-20", className)} />,
        <PopArtZigZag key="zigzag" className={cn("w-24 h-8", className)} />,
        <PopArtSticker key="sticker1" text="WOW!" color="bg-accent" className={cn("text-xl rotate-6", className)} />,
        <PopArtSticker key="sticker2" text="TOP" color="bg-info" className={cn("text-lg -rotate-6", className)} />,
        <Bone key="bone" className={cn("w-14 h-14 text-white fill-primary stroke-black stroke-2 drop-shadow-[4px_4px_0px_#000] rotate-45", className)} />,
    ];
    return decorations[seed % decorations.length];
};

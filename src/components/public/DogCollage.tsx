"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DogCollageProps {
    src: string;
    alt?: string;
    variant?: "A" | "B" | "C";
    className?: string;
}

export function DogCollage({ src, alt = "Dog", variant = "A", className }: DogCollageProps) {
    
    // Variant A: Exact replica of the reference image
    if (variant === "A") {
        return (
            <div className={cn("relative w-full aspect-square flex items-center justify-center", className)}>
                {/* 1. Large Pink Blob Background */}
                <motion.div 
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] left-[10%] w-[70%] h-[70%] bg-accent rounded-full -z-20" 
                />

                {/* 2. Top Left Cloud & XXX */}
                <motion.div 
                    className="absolute top-[5%] left-[5%] -z-10"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    <svg width="60" height="50" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M25 40C25 25 35 15 50 15C55 15 60 17 65 20C70 10 85 10 95 20C105 30 100 45 90 50C95 60 85 75 70 70C65 75 50 80 40 70C25 75 10 65 15 50C5 45 5 30 15 20C20 15 25 15 25 40Z" fill="white" stroke="black" strokeWidth="6" strokeLinejoin="round"/>
                        <path d="M40 30 Q45 25 50 35 T60 30" stroke="black" strokeWidth="4" strokeLinecap="round" fill="none"/>
                    </svg>
                </motion.div>
                <div className="absolute top-[10%] left-[25%] text-2xl font-black tracking-widest text-foreground -z-10 rotate-[-5deg]">x x x</div>

                {/* 3. Top Right Diagonal Lines */}
                <div className="absolute top-[10%] right-[10%] -z-30 opacity-80">
                    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="10" y1="90" x2="90" y2="10" stroke="black" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="30" y1="90" x2="90" y2="30" stroke="black" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="50" y1="90" x2="90" y2="50" stroke="black" strokeWidth="6" strokeLinecap="round"/>
                    </svg>
                </div>

                {/* 4. Bottom Left Yellow Zigzag & Striped Cloud */}
                <div className="absolute bottom-[20%] left-[-5%] -z-10">
                    <svg width="120" height="80" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 50 L 30 10 L 50 40 L 70 10 L 90 40" stroke="black" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 50 L 30 10 L 50 40 L 70 10 L 90 40" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <motion.div 
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] left-[10%] -z-15"
                >
                    <svg width="160" height="120" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="diagonalStripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                                <line x1="0" y1="0" x2="0" y2="20" stroke="#bae6fd" strokeWidth="10" />
                            </pattern>
                        </defs>
                        <path d="M50 80C50 50 70 30 100 30C110 30 120 34 130 40C140 20 170 20 190 40C210 60 200 90 180 100C190 120 170 150 140 140C130 150 100 160 80 140C50 150 20 130 30 100C10 90 10 60 30 40C40 30 50 30 50 80Z" fill="url(#diagonalStripes)" stroke="black" strokeWidth="8" strokeLinejoin="round"/>
                    </svg>
                </motion.div>

                {/* 5. Bottom Right Cyan Plus signs & Orange Blob */}
                <div className="absolute bottom-[20%] right-[-5%] -z-10">
                    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 10C70 5 90 20 95 40C100 60 85 85 60 90C35 95 10 80 5 60C0 40 30 15 50 10Z" fill="#F97316" stroke="black" strokeWidth="6" strokeLinejoin="round"/>
                    </svg>
                </div>
                <div className="absolute bottom-[30%] right-[0%] -z-10 text-info font-black text-4xl">
                    <div className="absolute top-0 right-0 rotate-12">+</div>
                    <div className="absolute top-8 right-8 rotate-45 scale-75">+</div>
                    <div className="absolute top-12 right-0 rotate-[-15deg]">+</div>
                </div>

                {/* The Dog Image */}
                <motion.div 
                    className="relative w-[90%] h-[90%] z-10 overflow-visible drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)]"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-contain"
                        priority
                    />
                </motion.div>
            </div>
        );
    }

    if (variant === "B") {
        return (
            <div className={cn("relative w-full aspect-square flex items-center justify-center", className)}>
                {/* 1. Large Cyan Blob Background */}
                <motion.div 
                    animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[15%] left-[5%] w-[80%] h-[75%] bg-info rounded-full -z-20" 
                />

                {/* 2. Top Right Flower */}
                <motion.div 
                    className="absolute top-[5%] right-[10%] w-24 h-24 flower-doodle -z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* 3. Bottom Right Zigzag */}
                <div className="absolute bottom-[15%] right-[-5%] w-32 h-10 blue-zigzag-line bg-secondary rotate-[-15deg] -z-10" />

                {/* 4. Left Edge Dotted Circle */}
                <div className="absolute top-[30%] left-[-10%] w-32 h-32 dotted-doodle rounded-full opacity-60 -z-10" />

                {/* The Dog Image */}
                <motion.div 
                    className="absolute bottom-0 w-[95%] h-[95%] z-10 overflow-visible drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] origin-bottom"
                    animate={{ rotate: [0, 2, 0, -2, 0], y: [0, -10, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-contain object-bottom"
                        priority
                    />
                </motion.div>
            </div>
        );
    }

    // You can add Variant C here for other sections
    return null;
}

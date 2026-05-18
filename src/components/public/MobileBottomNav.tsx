"use client";

import { Home, Scissors, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type MobileTab = "home" | "services" | "transformations";

interface MobileBottomNavProps {
    activeTab: MobileTab;
    onChangeTab: (tab: MobileTab) => void;
    t: (key: string) => string;
    transformationsEnabled?: boolean;
}

export default function MobileBottomNav({ activeTab, onChangeTab, t, transformationsEnabled }: MobileBottomNavProps) {
    const navItems = [
        { id: "home" as const, label: t("home"), icon: Home },
        { id: "services" as const, label: t("services"), icon: Scissors },
        ...(transformationsEnabled ? [{ id: "transformations" as const, label: t("transformations"), icon: Sparkles }] : []),
    ];

    return (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50 md:hidden">
            <div className="bg-white border-[3px] border-black rounded-2xl p-1.5 flex items-center justify-around shadow-[5px_5px_0px_0px_#1A1A1A] gap-0.5">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeTab(item.id)}
                            className="relative flex-1 py-1 flex flex-col items-center justify-center cursor-pointer select-none"
                        >
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.08 : 1,
                                    y: isActive ? -2 : 0,
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className={cn(
                                    "flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 z-10",
                                    isActive
                                        ? "bg-accent text-foreground border-2 border-black shadow-[2px_2px_0px_0px_#1A1A1A]"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <Icon className="h-5 w-5 stroke-[2.5]" />
                            </motion.div>
                            
                            <span 
                                className={cn(
                                    "text-[9px] font-black tracking-wider uppercase mt-1 z-10 transition-all text-center truncate w-full px-0.5",
                                    isActive ? "text-slate-900 scale-105" : "text-slate-400"
                                )}
                            >
                                {item.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    className="absolute inset-0 bg-secondary/30 rounded-xl z-0 border border-slate-100/50"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

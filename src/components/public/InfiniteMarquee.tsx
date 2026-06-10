"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Star, Zap } from "lucide-react";

export default function InfiniteMarquee() {
    const t = useTranslations("Index");

    const items = [
        { text: t("firstClassCare") },
        { text: t("mobileGroomingSpa") },
        { text: t("bookNow") }
    ];

    // Repeat the sequence to ensure perfect seamless looping
    const repeated = [...items, ...items, ...items, ...items, ...items, ...items];

    return (
        <div className="w-full bg-[#06B6D4] border-y-4 border-black py-3 sm:py-4 flex overflow-hidden whitespace-nowrap select-none relative z-20 my-4 rotate-[-0.75deg] scale-[1.005] shadow-[0px_4px_0px_0px_#000]">
            <motion.div
                className="flex shrink-0 items-center gap-10 pr-10"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 18
                }}
            >
                {repeated.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-10">
                        {/* Pop-Art Text */}
                        <span className="text-white text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-widest font-sans">
                            {item.text}
                        </span>

                        {/* Zap or Star Icon directly between text */}
                        {idx % 2 === 0 ? (
                            <Zap className="w-6.5 h-6.5 text-white fill-white shrink-0 rotate-12" />
                        ) : (
                            <Star className="w-6.5 h-6.5 text-white fill-white shrink-0" />
                        )}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

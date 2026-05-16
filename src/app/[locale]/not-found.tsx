'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { PopArtZap, PopArtDots } from '@/components/public/PopArtDecorations';

export default function NotFound() {
    const t = useTranslations('Index'); // Fallback to index or create a specific 404 namespace later
    
    return (
        <div className="relative min-h-[85vh] flex items-center justify-center bg-white overflow-hidden p-4 pt-32 pb-12">
            <PopArtDots className="absolute inset-0" />
            
            <div className="absolute top-[15%] left-[20%] w-24 h-24 -rotate-12 z-0 opacity-50">
                <PopArtZap />
            </div>

            <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative z-10 bg-info border-4 border-black p-8 md:p-12 rounded-[2rem] shadow-[12px_12px_0px_0px_#1A1A1A] max-w-lg w-full text-center rotate-1"
            >
                <div className="absolute -top-10 -right-10 bg-accent text-black font-black text-6xl p-4 border-4 border-black rounded-full rotate-12 shadow-[4px_4px_0px_0px_#000]">
                    404
                </div>

                <AlertCircle className="w-20 h-20 mx-auto text-primary mb-6 drop-shadow-[2px_2px_0px_#000]" />
                
                <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase text-white [text-shadow:2px_2px_0_#0F172A,2px_-2px_0_#0F172A,-2px_2px_0_#0F172A,-2px_-2px_0_#0F172A]">
                    Oops!
                </h1>
                
                <p className="text-lg md:text-xl font-bold mb-8 text-foreground">
                    La página que buscas se ha perdido. / The page you are looking for is missing.
                </p>

                <Link href="/" className="inline-block bg-primary text-white font-black text-xl px-8 py-4 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all -rotate-2">
                    VOLVER A INICIO / GO HOME
                </Link>
            </motion.div>
        </div>
    );
}

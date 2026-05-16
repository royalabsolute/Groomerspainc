import { notFound } from "next/navigation";
import db from "@/lib/db";
import TransformationsSection from "@/components/public/TransformationsSection";
import TransformationsHeader from "@/components/public/TransformationsHeader";
import { PopArtDots } from "@/components/public/PopArtDecorations";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transformaciones",
    description: "Mira el antes y el después de nuestros trabajos de grooming profesional.",
};

interface Props {
    params: Promise<{ locale: string }>;
}

export default async function TransformacionesPage({ params }: Props) {
    const { locale } = await params;
    
    // Check if the page is enabled
    const config = await db.siteConfig.findUnique({ where: { id: "config" } });
    
    // Use type assertion to handle potentially stale Prisma types during linting
    const isEnabled = (config as any)?.transformationsEnabled;
    
    if (!isEnabled) {
        notFound();
    }

    const items = await (db as any).transformation.findMany({
        where: { visible: true },
        orderBy: { date: "desc" },
    });

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <PopArtDots className="absolute inset-0 z-0 opacity-20" />
            <PopArtDots className="absolute top-[20%] left-[-10%] z-0 opacity-10 rotate-12 scale-150" />
            <PopArtDots className="absolute bottom-[20%] right-[-10%] z-0 opacity-10 -rotate-12 scale-150" />
            
            <TransformationsHeader locale={locale} />

            {/* Content */}
            <div className="container relative z-10 py-16 px-4 max-w-[1400px] mx-auto">
                <TransformationsSection items={items} locale={locale} />
            </div>
        </div>
    );
}

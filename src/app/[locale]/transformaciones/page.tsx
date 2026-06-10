import { notFound } from "next/navigation";
import db from "@/lib/db";
import TransformationsSection from "@/components/public/TransformationsSection";
import TransformationsHeader from "@/components/public/TransformationsHeader";
import { PopArtDots } from "@/components/public/PopArtDecorations";
import type { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const isEs = locale === "es";

    return {
        title: isEs ? "Portafolio de Transformaciones Certificadas" : "Certified Dog Grooming Transformations Portfolio",
        description: isEs
            ? "Explora el antes y después de nuestras transformaciones de peluquería canina profesional en Miami. Certificaciones de estudio y contratos de evaluación escolar incluidos."
            : "Explore the before and after transformations of our professional dog grooming services in Miami. Evaluation documents and study certifications included.",
        keywords: isEs
            ? ["transformaciones grooming miami", "antes y despues peluqueria canina", "portafolio peluqueria canina", "estudios grooming", "certificados grooming", "fotos perros antes y despues"]
            : ["grooming transformations miami", "dog grooming before and after", "dog grooming portfolio", "grooming school certificates", "grooming evaluations", "dog transformations photos"],
    };
}

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

    const rawItems = await (db as any).transformation.findMany({
        where: { visible: true },
        orderBy: { serviceDate: "desc" },
    });

    const items = rawItems.map((t: any) => ({
        id: t.id,
        petName: t.petName,
        breed: t.breed,
        age: t.age !== null && t.age !== undefined ? `${t.age} ${locale === "es" ? "años" : "years"}` : "N/A",
        serviceDate: t.serviceDate.toISOString(),
        beforePhotoUrl: t.beforePhotoUrl,
        afterPhotoUrl: t.afterPhotoUrl,
        contractImage: t.contractImage,
        descriptionEs: t.technicalDescriptionEs,
        descriptionEn: t.technicalDescriptionEn,
        visible: t.visible,
        createdAt: t.createdAt.toISOString(),
    }));

    return (
        <div className="min-h-screen bg-[#F5F2EB] relative overflow-hidden">
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

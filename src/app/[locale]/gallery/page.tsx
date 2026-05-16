import { getTranslations } from 'next-intl/server';
import db from '@/lib/db';
import GallerySection from '@/components/public/GallerySection';
import { Camera } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('galleryTitle', { defaultMessage: 'Galería | GroomingPet' }),
        description: t('galleryDesc', { defaultMessage: 'Mira a nuestros clientes felices después de su sesión de spa.' })
    };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Index');

    // Fetch all gallery items
    const galleryItems = await db.galleryItem.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="flex flex-col min-h-screen">
            {/* Mini Hero for Gallery Page */}
            <div className="relative bg-[#F3ECE2] py-32 overflow-hidden">
                <Camera className="absolute top-10 right-10 w-64 h-64 text-primary/5 -rotate-12" />
                <Camera className="absolute bottom-10 left-10 w-48 h-48 text-primary/5 rotate-12" />

                <div className="container relative z-10 text-center">
                    <h1 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl mb-6 text-foreground">
                        {t('galleryTitle', { defaultMessage: "Galería de" })} <span className="text-primary font-serif italic font-normal">Felicidad</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto font-medium">
                        {t('gallerySubtitle', { defaultMessage: "Resultados reales de nuestros peludos clientes" })}
                    </p>
                </div>
            </div>

            <div className="-mt-20">
                <GallerySection initialItems={galleryItems} />
            </div>

            {/* Booking CTA at bottom */}
            <div className="bg-primary/5 py-20 text-center">
                <div className="container">
                    <h2 className="text-3xl font-black mb-6">¿Quieres ver a tu mascota aquí?</h2>
                    <a href="/contact" className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-lg font-bold text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                        Reserva tu Cita
                    </a>
                </div>
            </div>
        </div>
    );
}

import { getTranslations } from 'next-intl/server';
import dynamic from "next/dynamic";
import { headers } from 'next/headers';
import HeroSection from "@/components/public/HeroSection";
import QuoteSection from "@/components/public/QuoteSection";
import TransformationsSection from "@/components/public/TransformationsSection";
import db from '@/lib/db';
import MobileHome from "@/components/public/MobileHome";
import { PopArtDots, PopArtZap, PopArtStar } from '@/components/public/PopArtDecorations';
import { ZigzagYellowDoodle, OrangeBlobDoodle, CyanPlusDoodle } from '@/components/public/Doodles';

const GallerySection = dynamic(() => import('@/components/public/GallerySection'), {
  loading: () => <div className="min-h-[400px] bg-secondary/10 animate-pulse rounded-3xl m-8" />
});

const Footer = dynamic(() => import('@/components/public/Footer'), {
  loading: () => <div className="h-64 bg-background" />
});

import { getConfig } from '@/lib/config';

export const revalidate = 0;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

  // Fetch all data in parallel for speed
  const [servicesRaw, galleryItems, config, transformationsRaw] = await Promise.all([
    (db as any).serviceItem.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' }
    }),
    db.galleryItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12
    }),
    getConfig(),
    db.transformation.findMany({
      where: { visible: true },
      orderBy: { serviceDate: 'desc' }
    })
  ]);

  const services = servicesRaw.map((s: any) => ({
    id: s.id,
    nameEs: s.nameEs,
    nameEn: s.nameEn,
    category: s.category,
    basePrice: Number(s.basePrice),
    isActive: s.isActive,
  })) as any[];

  const transformations = transformationsRaw.map((t: any) => ({
    id: t.id,
    petName: t.petName,
    breed: t.breed,
    age: t.age !== null && t.age !== undefined ? String(t.age) : "",
    serviceDate: t.serviceDate.toISOString(),
    beforePhotoUrl: t.beforePhotoUrl,
    afterPhotoUrl: t.afterPhotoUrl,
    descriptionEs: t.technicalDescriptionEs,
    descriptionEn: t.technicalDescriptionEn,
    visible: t.visible,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <>
      {!isMobile && (
        <div className="hidden md:flex flex-col gap-0 relative overflow-hidden bg-[#FDFCF8]">
          {/* Global subtle pop-art backgrounds */}
          <PopArtDots className="absolute inset-0 z-0 opacity-10 pointer-events-none" />
          
          {/* Subtle floating background decorations */}
          <div className="absolute top-[18%] left-[2%] z-0 opacity-15 pointer-events-none scale-150 rotate-12">
            <ZigzagYellowDoodle className="w-48 h-24" />
          </div>
          <div className="absolute top-[32%] right-[3%] z-0 opacity-20 pointer-events-none scale-125 -rotate-45">
            <PopArtZap className="w-20 h-20" />
          </div>
          <div className="absolute top-[48%] left-[4%] z-0 opacity-15 pointer-events-none scale-150">
            <CyanPlusDoodle className="w-24 h-24" />
          </div>
          <div className="absolute top-[65%] right-[5%] z-0 opacity-15 pointer-events-none scale-[1.75] rotate-45">
            <OrangeBlobDoodle className="w-28 h-28" />
          </div>
          <div className="absolute top-[82%] left-[3%] z-0 opacity-20 pointer-events-none scale-125 -rotate-12">
            <PopArtStar className="w-20 h-20" />
          </div>
          
          <div className="relative z-10 w-full flex flex-col gap-0">
            <HeroSection config={config as any} locale={locale} />
            {/* Gallery Carousel right below Hero block */}
            <GallerySection initialItems={galleryItems} />
            {/* Unified Cotizador block */}
            <QuoteSection locale={locale} initialServices={services} />
            <Footer config={config as any} locale={locale} />
          </div>
        </div>
      )}

      {isMobile && (
        <MobileHome
          config={config}
          locale={locale}
          services={services}
          galleryItems={galleryItems}
          transformations={transformations}
        />
      )}
    </>
  );
}

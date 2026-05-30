import { getTranslations } from 'next-intl/server';
import dynamic from "next/dynamic";
import { headers } from 'next/headers';
import HeroSection from "@/components/public/HeroSection";
import QuoteSection from "@/components/public/QuoteSection";
import db from '@/lib/db';
import MobileHome from "@/components/public/MobileHome";

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
        <div className="hidden md:flex flex-col gap-0">
          <HeroSection config={config as any} locale={locale} />
          {/* Unified Cotizador block */}
          <QuoteSection locale={locale} initialServices={services} />
          {/* Gallery Carousel right below Quote block */}
          <GallerySection initialItems={galleryItems} />
          <Footer config={config as any} locale={locale} />
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

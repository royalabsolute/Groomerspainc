import dynamic from "next/dynamic";
import HeroSection from "@/components/public/HeroSection";
import QuoteSection from "@/components/public/QuoteSection";
import ServicesShowcase from "@/components/public/ServicesShowcase";
import db from '@/lib/db';
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
  
  // Fetch all data in parallel for speed
  const [servicesRaw, galleryItems, config] = await Promise.all([
    (db as any).serviceItem.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' }
    }),
    db.galleryItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12
    }),
    getConfig()
  ]);

  const services = servicesRaw.map((s: any) => ({
    id: s.id,
    nameEs: s.nameEs,
    nameEn: s.nameEn,
    category: s.category,
    basePrice: Number(s.basePrice),
    isActive: s.isActive,
  })) as any[];

  return (
    <div className="flex flex-col gap-0 relative overflow-hidden bg-[#FDFCF8] min-h-screen pt-20">
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
      
      {/* Unified flex-col container where children are ordered dynamically */}
      <div className="relative z-10 w-full flex flex-col gap-0">
        
        {/* Section 1: Hero - Always First */}
        <div className="order-1">
          <HeroSection config={config as any} locale={locale} />
        </div>

        {/* Section 2: Services Showcase (order-2 on mobile, order-3 on desktop) */}
        <div className="order-2 md:order-3">
          <ServicesShowcase initialServices={services} locale={locale} />
        </div>

        {/* Section 3: Gallery Carousel (order-3 on mobile, order-2 on desktop) */}
        <div className="order-3 md:order-2">
          <GallerySection initialItems={galleryItems} />
        </div>

        {/* Section 4: Quote Wizard (order-4 on both mobile and desktop) */}
        <div className="order-4">
          <QuoteSection locale={locale} initialServices={services} />
        </div>

        {/* Section 5: Footer - Always Last */}
        <div className="order-5">
          <Footer config={config as any} locale={locale} />
        </div>

      </div>
    </div>
  );
}

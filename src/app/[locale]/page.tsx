import { getTranslations } from 'next-intl/server';
import dynamic from "next/dynamic";
import { headers } from 'next/headers';
import HeroSection from "@/components/public/HeroSection";
import ServicesSection from "@/components/public/ServicesSection";
import db from '@/lib/db';
import MobileHome from "@/components/public/MobileHome";

const GallerySection = dynamic(() => import('@/components/public/GallerySection'), {
  loading: () => <div className="min-h-[400px] bg-secondary/10 animate-pulse rounded-3xl m-8" />
});



const ContactSection = dynamic(() => import('@/components/public/ContactSection'), {
  loading: () => <div className="min-h-[400px] bg-secondary/5 animate-pulse" />
});

const Footer = dynamic(() => import('@/components/public/Footer'), {
  loading: () => <div className="h-64 bg-background" />
});

import { getConfig } from '@/lib/config';

export const revalidate = 0;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Index');
  
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

  // Fetch all data in parallel for speed
  const [servicesRaw, galleryItems, config, transformationsRaw] = await Promise.all([
    db.service.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    }),
    db.galleryItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12
    }),
    getConfig(),
    db.transformation.findMany({
      where: { visible: true },
      orderBy: { date: 'desc' }
    })
  ]);

  const services = servicesRaw.map(s => ({
    id: s.id,
    titleEs: s.titleEs,
    titleEn: s.titleEn,
    descEs: s.descEs,
    descEn: s.descEn,
    price: s.price ? s.price.toString() : null,
    imageUrl: s.imageUrl,
    active: s.active,
    order: s.order,
    icon: s.icon,
    recommendedProducts: s.recommendedProducts,
  })) as any[];

  const transformations = transformationsRaw.map(t => ({
    id: t.id,
    titleEs: t.titleEs,
    titleEn: t.titleEn,
    beforeImageUrl: t.beforeImageUrl,
    afterImageUrl: t.afterImageUrl,
    date: t.date.toISOString(),
  }));

  return (
    <>
      {!isMobile && (
        <div className="hidden md:flex flex-col gap-0">
          <HeroSection config={config as any} locale={locale} />
          <ServicesSection initialServices={services} locale={locale} />
          <GallerySection initialItems={galleryItems} />
          <ContactSection
            config={config as any}
            locale={locale}
            services={services.map(s => JSON.parse(JSON.stringify(s)))}
          />
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

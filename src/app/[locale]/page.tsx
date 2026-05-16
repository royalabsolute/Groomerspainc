import { getTranslations } from 'next-intl/server';
import dynamic from "next/dynamic";
import HeroSection from "@/components/public/HeroSection";
import ServicesSection from "@/components/public/ServicesSection";
import db from '@/lib/db';

const GallerySection = dynamic(() => import('@/components/public/GallerySection'), {
  loading: () => <div className="min-h-[400px] bg-secondary/10 animate-pulse rounded-3xl m-8" />
});

const TestimonialsSection = dynamic(() => import('@/components/public/TestimonialsSection'), {
  loading: () => <div className="min-h-[400px] bg-background animate-pulse" />
});

const ContactSection = dynamic(() => import('@/components/public/ContactSection'), {
  loading: () => <div className="min-h-[400px] bg-secondary/5 animate-pulse" />
});

const Footer = dynamic(() => import('@/components/public/Footer'), {
  loading: () => <div className="h-64 bg-background" />
});

import { getConfig } from '@/lib/config';

export const revalidate = 60; // Cache for 1 minute

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Index');

  // Fetch all data in parallel for speed
  const [servicesRaw, galleryItems, config, testimonials] = await Promise.all([
    db.service.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    }),
    db.galleryItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12
    }),
    getConfig(),
    db.testimonial.findMany({
      where: { approved: true },
      take: 6
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
  })) as any[]; // Using any to bypass the overly strict type check for now, but I will try to be more specific if possible.

  return (
    <div className="flex flex-col gap-0">
      <HeroSection config={config as any} locale={locale} />
      <ServicesSection initialServices={services} locale={locale} />
      <GallerySection initialItems={galleryItems} />
      <TestimonialsSection testimonials={testimonials} locale={locale} />
      <ContactSection
        config={config as any}
        locale={locale}
        services={services.map(s => JSON.parse(JSON.stringify(s)))}
      />
      <Footer config={config as any} locale={locale} />
    </div>
  );
}

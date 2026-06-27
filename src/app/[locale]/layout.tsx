import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "@/styles/globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import Navbar from '@/components/public/Navbar';
import RealtimeListener from '@/components/public/RealtimeListener';
import db from "@/lib/db";
import { headers } from 'next/headers';

const fredoka = Fredoka({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: '--font-fredoka', display: 'swap' });

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const isEs = locale === 'es';

    return {
        title: {
            template: '%s | Groomers, INC. Miami',
            default: isEs
                ? 'Groomers, INC. | Peluquería Canina a Domicilio Premium en Miami, FL'
                : 'Groomers, INC. | Premium Mobile Dog & Pet Grooming in Miami, FL'
        },
        description: isEs
            ? 'Servicio profesional de peluquería canina a domicilio en Miami y Broward. Cortes de pelo expertos, baños completos, limpieza dental y spa canino de lujo.'
            : 'Top-rated professional mobile pet grooming services in Miami and Broward, Florida. Expert dog haircuts, full baths, teeth cleaning, and luxury spa treatments.',
        keywords: isEs
            ? ["peluqueria canina Miami", "grooming a domicilio Miami", "baño de perros a domicilio", "estilista canino Miami", "limpieza de dientes perros Miami", "Groomers, INC.", "peluqueria canina cerca de mi", "mobile grooming miami"]
            : ["pet grooming Miami", "mobile dog grooming Miami", "dog grooming near me", "Miami pet spa", "dog haircuts Miami FL", "professional dog bath", "Groomers, INC.", "pet stylist Florida"],
        authors: [{ name: "Groomers, INC." }],
        creator: "Groomers, INC.",
        icons: {
            icon: [
                { url: '/favicon.ico', type: 'image/x-icon' },
                { url: '/icon.png', type: 'image/png', sizes: '512x512' }
            ],
            shortcut: '/favicon.ico',
            apple: [
                { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
            ]
        },
        openGraph: {
            type: "website",
            locale: isEs ? "es_ES" : "en_US",
            url: "https://groomersincathome.com",
            title: isEs
                ? 'Groomers, INC. | Peluquería Canina a Domicilio Premium en Miami, FL'
                : 'Groomers, INC. | Premium Mobile Dog & Pet Grooming in Miami, FL',
            description: isEs
                ? 'Servicio profesional de peluquería canina a domicilio en Miami y Broward. Cortes de pelo expertos, baños completos y spa canino.'
                : 'Top-rated professional mobile pet grooming services in Miami and Broward, Florida. Expert dog haircuts and baths.',
            siteName: "Groomers, INC.",
        },
        alternates: {
            canonical: "https://groomersincathome.com",
            languages: {
                'en-US': 'https://groomersincathome.com/en',
                'es-ES': 'https://groomersincathome.com/es',
            },
        },
        twitter: {
            card: "summary_large_image",
            title: isEs
                ? 'Groomers, INC. | Peluquería Canina a Domicilio Miami'
                : 'Groomers, INC. | Premium Mobile Pet Grooming Miami',
            description: isEs
                ? 'Cortes de pelo profesionales, baños y tratamientos de spa canino en Miami y Broward.'
                : 'Expert dog grooming, baths, and spa treatments in Miami and Broward, Florida.',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

import { getConfig } from "@/lib/config";

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();
    const config = await getConfig();

    const siteUrl = "https://groomersincathome.com";
    const logoUrl = `${siteUrl}/logo_groomersicn.svg`;
    const telephone = config?.phone || "+1 (305) 527-2340";
    const email = config?.email || "groomersincpetspa@gmail.com";

    // Query active services dynamically to enrich sitemap/JSON-LD catalog
    const services = await db.serviceItem.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' }
    }).catch(() => []);

    const servicesCatalog = services.length > 0 ? {
        "@type": "OfferCatalog",
        "name": locale === 'es' ? "Catálogo de Servicios de Peluquería Canina" : "Pet Grooming Service Catalog",
        "itemListElement": services.map((s: any, idx: number) => ({
            "@type": "Offer",
            "position": idx + 1,
            "itemOffered": {
                "@type": "Service",
                "name": locale === 'es' ? s.nameEs : s.nameEn,
                "description": locale === 'es'
                    ? `Servicio profesional de ${s.nameEs} a domicilio en Miami y Broward.`
                    : `Professional in-home ${s.nameEn} service in Miami and Broward.`
            },
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": s.basePrice.toString(),
                "priceCurrency": "USD"
            }
        }))
    } : undefined;

    const socialLinks = [
        config?.instagramUrl,
        config?.tiktokUrl,
        config?.twitterUrl
    ].filter(Boolean) as string[];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "additionalType": "https://www.productontology.org/id/Dog_grooming",
        "@id": `${siteUrl}/#localBusiness`,
        "name": "Groomers, INC. At Home",
        "description": locale === 'es'
            ? "Servicio profesional de mobile grooming spa en Miami y Broward. Cortes de pelo canino, baños, spa y limpiezas dentales a domicilio."
            : "Professional mobile dog grooming spa in Miami & Broward. Styled haircuts, warm baths, ear cleaning, and luxury pet care at your door.",
        "image": logoUrl,
        "telephone": telephone,
        "email": email,
        "url": siteUrl,
        "priceRange": "$$",
        "paymentAccepted": ["Cash", "Credit Card", "Zelle", "Venmo", "CashApp"],
        "currenciesAccepted": "USD",
        "sameAs": socialLinks,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Miami",
            "addressRegion": "FL",
            "addressCountry": "US"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 25.7617,
            "longitude": -80.1918
        },
        "areaServed": [
            { "@type": "AdministrativeArea", "name": "Miami-Dade County" },
            { "@type": "AdministrativeArea", "name": "Broward County" },
            { "@type": "AdministrativeArea", "name": "Miami" },
            { "@type": "AdministrativeArea", "name": "Fort Lauderdale" }
        ],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "09:00",
            "closes": "18:00"
        },
        "potentialAction": {
            "@type": "ReserveAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${siteUrl}/#cotizar`,
                "inLanguage": ["en", "es"]
            },
            "result": {
                "@type": "Reservation",
                "name": "Book Mobile Grooming Spa Session"
            }
        },
        ...(servicesCatalog ? { "hasOfferCatalog": servicesCatalog } : {})
    };

    return (
        <html lang={locale} className={`${fredoka.variable} overflow-x-hidden`} suppressHydrationWarning>
            <head>
                <meta property="og:locale" content={locale === 'es' ? 'es_ES' : 'en_US'} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="antialiased selection:bg-primary/30 scroll-smooth overflow-x-hidden">
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

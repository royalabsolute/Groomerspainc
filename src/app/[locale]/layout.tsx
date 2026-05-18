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

export const metadata: Metadata = {
    title: {
        template: '%s | Groomers, INC. Miami',
        default: 'Groomers, INC. | Premium Dog & Pet Grooming in Miami, FL'
    },
    description: "Top-rated professional pet grooming services in Miami, Florida. Expert dog haircuts, full baths, teeth cleaning, and luxury spa treatments. Book your appointment today!",
    keywords: ["pet grooming Miami", "dog grooming near me", "Miami pet spa", "dog haircuts Miami FL", "professional dog bath", "Groomers, INC.", "pet stylist Florida"],
    authors: [{ name: "Groomers, INC." }],
    creator: "Groomers, INC.",
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' }
        ]
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://groomersincmiami.com",
        title: "Groomers, INC. | Premium Dog & Pet Grooming in Miami, FL",
        description: "Top-rated professional pet grooming services in Miami, Florida.",
        siteName: "Groomers, INC.",
    },
    alternates: {
        canonical: "https://groomersincmiami.com",
        languages: {
            'en-US': 'https://groomersincmiami.com/en',
            'es-ES': 'https://groomersincmiami.com/es',
        },
    },
    twitter: {
        card: "summary_large_image",
        title: "Groomers, INC. | Premium Pet Grooming Miami",
        description: "Expert dog grooming, baths, and spa treatments in Miami, Florida.",
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

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

    return (
        <html lang={locale} className={`${fredoka.variable} overflow-x-hidden`} suppressHydrationWarning>
            <head>
                <meta property="og:locale" content={locale === 'es' ? 'es_ES' : 'en_US'} />
            </head>
            <body className="antialiased selection:bg-primary/30 scroll-smooth overflow-x-hidden">
                <NextIntlClientProvider messages={messages}>
                    <RealtimeListener />
                    <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
                        {!isMobile && (
                            <div className="hidden md:block">
                                <Navbar config={config} />
                            </div>
                        )}
                        <main className="flex-1 w-full overflow-x-hidden">{children}</main>
                    </div>
                    <Toaster richColors position="top-right" />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

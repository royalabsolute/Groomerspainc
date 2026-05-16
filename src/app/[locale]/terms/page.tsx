import { getTranslations } from 'next-intl/server';
import { PawPrint } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    return {
        title: `Terms of Service | GroomingPet`,
    };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Terms');

    return (
        <div className="flex flex-col min-h-screen">
            <div className="bg-[#F3ECE2] py-20 relative overflow-hidden">
                <PawPrint className="absolute -left-10 -bottom-10 w-64 h-64 text-primary/5 -rotate-12" />
                <div className="container relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('lastUpdated')}: {new Date().toLocaleDateString(locale)}</p>
                </div>
            </div>

            <div className="container py-12 md:py-20 max-w-4xl text-lg leading-relaxed space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('section1Title')}</h2>
                    <p>{t('section1Desc')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('section2Title')}</h2>
                    <p>{t('section2Desc')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('section3Title')}</h2>
                    <p>{t('section3Desc')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('section4Title')}</h2>
                    <p>{t('section4Desc')}</p>
                </section>
            </div>
        </div>
    );
}

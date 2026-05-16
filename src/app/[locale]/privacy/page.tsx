import { getTranslations } from 'next-intl/server';
import { PawPrint } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    return {
        title: `Privacy Policy | GroomingPet`,
    };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Privacy');

    return (
        <div className="flex flex-col min-h-screen">
            <div className="bg-[#F3ECE2] py-20 relative overflow-hidden">
                <PawPrint className="absolute -right-10 -bottom-10 w-64 h-64 text-primary/5 rotate-12" />
                <div className="container relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('lastUpdated')}: {new Date().toLocaleDateString(locale)}</p>
                </div>
            </div>

            <div className="container py-12 md:py-20 max-w-4xl text-lg leading-relaxed space-y-8">
                <p>{t('intro')}</p>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('collectTitle')}</h2>
                    <p>{t('collectDesc')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('useTitle')}</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>{t('useItem1')}</li>
                        <li>{t('useItem2')}</li>
                        <li>{t('useItem3')}</li>
                        <li>{t('useItem4')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('contactTitle')}</h2>
                    <p>{t('contactDesc')}</p>
                </section>
            </div>
        </div>
    );
}

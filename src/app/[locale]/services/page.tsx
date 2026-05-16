import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import ServicesSection from '@/components/public/ServicesSection';
import { PawPrint } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('servicesTitle', { defaultMessage: 'Nuestros Servicios | GroomingPet' }),
        description: t('servicesDesc', { defaultMessage: 'Conoce nuestros servicios de peluquería y spa canino en Miami.' })
    };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Index');

    // Fetch all active services
    const servicesRaw = await db.service.findMany({
        where: { active: true },
        orderBy: { order: 'asc' }
    });

    const services = servicesRaw.map(service => ({
        ...service,
        price: service.price ? service.price.toString() : null,
        imageUrl: service.imageUrl, // Explicitly map to match ServiceFromDB interface
    })) as any[];

    if (!services) {
        notFound();
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Mini Hero for Services Page */}
            <div className="relative bg-secondary/30 py-32 overflow-hidden">
                <PawPrint className="absolute top-10 right-10 w-64 h-64 text-primary/5 rotate-12" />
                <PawPrint className="absolute bottom-10 left-10 w-48 h-48 text-primary/5 -rotate-12" />

                <div className="container relative z-10 text-center">
                    <h1 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl mb-6 text-foreground">
                        {t('servicesTitle', { defaultMessage: "Nuestros" })} <span className="text-primary font-serif italic font-normal">{t('servicesTitleHighlight', { defaultMessage: "Servicios" })}</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto font-medium">
                        {t('servicesSubtitle', { defaultMessage: "Descubre el cuidado premium que tu mascota merece." })}
                    </p>
                </div>
            </div>

            {/* Reuse ServicesSection but maybe adapted if needed, or just let it render the list */}
            {/* Since ServicesSection has its own header/container structure but accepts a list, we can create a cleaner wrapper here or adapt it.
          For now, let's reuse it directly but consider if we want to remove the duplicate header if creating a dedicated page hero.
          Actually, ServicesSection has a built-in header. Let's create a specialized 'ServiceList' component or just render the cards here 
          to have more control over the layout without the section wrapper if we want a different look.
          
          However, usually reusing components is good. Let's render the ServicesSection but maybe we can pass a prop to hide the header?
          Checking ServicesSection.tsx... it doesn't have a prop to hide header.
          
          Start simple: Render the ServicesSection. It will look like a section on the page. 
          The 'Mini Hero' above might be redundant if ServicesSection already has a big title.
          
          Let's adjust: remove the 'Mini Hero' above and just let ServicesSection be the main content, 
          OR keep the Mini Hero and render the cards manually here for a 'Page' layout preference.
          
          Given the user requested "same structure and design", reusing the robust active component is safer.
          Use the ServicesSection directly, it handles animations and layout beautifully.
      */}

            <div className="-mt-20"> {/* Negative margin to pull it up if we want, or just let it be. */}
                <ServicesSection initialServices={services} locale={locale} />
            </div>

            {/* Booking CTA at bottom */}
            <div className="bg-primary/5 py-20 text-center">
                <div className="container">
                    <h2 className="text-3xl font-black mb-6">
                        {locale === 'es' ? "¿Listo para consentir a tu mascota?" : "Ready to pamper your pet?"}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        {locale === 'es'
                            ? "Reserva una cita hoy mismo y déjanos cuidar de tu mejor amigo como se merece."
                            : "Book an appointment today and let us take care of your best friend as they deserve."}
                    </p>
                    <a href="/#contact" className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-lg font-bold text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                        {locale === 'es' ? "Agendar Cita" : "Schedule Appointment"}
                    </a>
                </div>
            </div>

        </div>
    );
}

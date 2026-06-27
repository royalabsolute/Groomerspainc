import { getTranslations } from 'next-intl/server';
import { PawPrint, ShieldCheck } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: locale === 'es' ? 'Política de Privacidad | GroomingPet' : 'Privacy Policy | GroomingPet',
    };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFCF8] py-16 md:py-24 px-4 md:px-8">
            <div className="container max-w-4xl mx-auto pt-10">
                <div className="relative border-4 border-black bg-[#FAF6EE] rounded-3xl shadow-[8px_8px_0px_0px_#000] p-6 md:p-12 mt-6">
                    {/* Folder Tab */}
                    <div className="absolute -top-10 left-6 h-10 px-6 bg-[#FAF6EE] border-t-4 border-x-4 border-black rounded-t-2xl font-black text-xs uppercase tracking-widest flex items-center select-none">
                        {locale === "es" ? "EXPEDIENTE LEGAL" : "LEGAL FILE"}
                    </div>

                    {/* Logo & Status Badge */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b-4 border-black border-dashed">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-neutral-950 font-sans">
                                {locale === "es" ? "POLÍTICA DE PRIVACIDAD" : "PRIVACY POLICY"}
                            </h1>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-1.5 font-sans">
                                {locale === "es" ? "Última Actualización" : "Last Updated"}: {new Date().toLocaleDateString(locale)}
                            </p>
                        </div>
                        <div className="bg-[#38BDF8] border-2 border-black rounded-xl px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 select-none">
                            <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                            <span>FLORIDA COMPLIANT</span>
                        </div>
                    </div>

                    {/* Legal Content */}
                    <div className="space-y-8 font-serif text-neutral-800 leading-relaxed text-base md:text-lg">
                        {locale === "es" ? (
                            <>
                                <p className="font-semibold text-neutral-950">
                                    En GroomingPet (Groomers Inc), valoramos su privacidad y nos comprometemos a proteger sus datos personales de acuerdo con las leyes federales y estatales de los Estados Unidos, específicamente las regulaciones del Estado de Florida.
                                </p>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        1. Información que Recopilamos
                                    </h2>
                                    <p>
                                        Recopilamos información personal del usuario estrictamente necesaria para la prestación de nuestro servicio de spa móvil para mascotas en la Florida. Esto incluye:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Datos de Identificación:</strong> Nombre y apellido del propietario de la mascota.</li>
                                        <li><strong>Datos de Contacto:</strong> Número de teléfono y dirección de correo electrónico.</li>
                                        <li><strong>Ubicación Geográfica:</strong> Dirección física y código postal (Zip Code) donde se estacionará nuestra unidad móvil para realizar el servicio.</li>
                                        <li><strong>Detalles de la Mascota:</strong> Raza, edad, comportamiento e historial médico relevante para garantizar su seguridad.</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        2. Uso de sus Datos
                                    </h2>
                                    <p>
                                        Los datos personales recolectados se utilizan exclusivamente con el fin de:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Procesar cotizaciones exactas del servicio de aseo y peluquería.</li>
                                        <li>Gestionar la logística y el enrutamiento diario de nuestras unidades de spa móvil hacia su domicilio.</li>
                                        <li>Comunicarnos con usted respecto a sus citas, retrasos por tráfico o emergencias climáticas en la Florida.</li>
                                        <li>Garantizar el cumplimiento legal y la seguridad de las mascotas y nuestro personal.</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        3. No Divulgación a Terceros
                                    </h2>
                                    <p className="bg-[#FFDE4D]/10 border-2 border-[#FFDE4D] p-4 rounded-2xl">
                                        <strong>Garantía Anti-Venta:</strong> No vendemos, alquilamos ni divulgamos de ninguna otra forma su información personal a terceros con fines comerciales o de marketing. Sus datos solo se comparten internamente con nuestro equipo de estilistas y administradores autorizados.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        4. Cumplimiento Normativo (Florida & EE. UU.)
                                    </h2>
                                    <p>
                                        Nuestras prácticas de manejo de datos cumplen estrictamente con la Ley de Prácticas Comerciales Engañosas e Desleales de Florida (Florida Deceptive and Unfair Trade Practices Act - FDUTPA) y las directrices federales de protección al consumidor de la FTC. Mantenemos salvaguardas técnicas y administrativas razonables para evitar pérdidas o accesos no autorizados.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        5. Contacto
                                    </h2>
                                    <p>
                                        Si tiene preguntas sobre esta política o desea solicitar la eliminación o corrección de sus datos personales, puede escribirnos a nuestro correo electrónico corporativo o llamarnos directamente a nuestra línea en Florida.
                                    </p>
                                </section>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-neutral-950">
                                    At GroomingPet (Groomers Inc), we value your privacy and are committed to protecting your personal data in accordance with US federal and state laws, specifically the regulations of the State of Florida.
                                </p>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        1. Information We Collect
                                    </h2>
                                    <p>
                                        We collect personal information strictly necessary for providing our mobile pet spa services in Florida. This includes:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Identification Details:</strong> Pet owner's first and last name.</li>
                                        <li><strong>Contact Information:</strong> Phone number and email address.</li>
                                        <li><strong>Geographical Location:</strong> Physical address and Zip Code where our mobile unit will park to perform the service.</li>
                                        <li><strong>Pet Details:</strong> Breed, age, behavior, and relevant medical history to ensure safety.</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        2. How We Use Your Data
                                    </h2>
                                    <p>
                                        All collected personal data is used exclusively for:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Processing accurate quotes for grooming and styling services.</li>
                                        <li>Managing the daily logistics and routing of our mobile spa units to your address.</li>
                                        <li>Communicating with you regarding appointments, traffic delays, or weather emergencies in Florida.</li>
                                        <li>Ensuring legal compliance and the safety of both pets and our staff.</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        3. No Third-Party Selling
                                    </h2>
                                    <p className="bg-[#FFDE4D]/10 border-2 border-[#FFDE4D] p-4 rounded-2xl">
                                        <strong>No-Sale Guarantee:</strong> We do not sell, rent, or otherwise disclose your personal information to third parties for marketing or commercial purposes. Your data is only shared internally with our authorized stylists and administrators.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        4. Regulatory Compliance (Florida & US)
                                    </h2>
                                    <p>
                                        Our data management practices strictly comply with the Florida Deceptive and Unfair Trade Practices Act (FDUTPA) and federal consumer protection guidelines from the FTC. We maintain reasonable administrative and technical safeguards to prevent loss or unauthorized access.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        5. Contact Us
                                    </h2>
                                    <p>
                                        If you have questions about this policy or wish to request the deletion or correction of your personal data, you can contact us via our corporate email or call our Florida phone line.
                                    </p>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { getTranslations } from 'next-intl/server';
import { PawPrint, ShieldCheck } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: locale === 'es' ? 'Términos del Servicio | GroomingPet' : 'Terms of Service | GroomingPet',
    };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
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
                                {locale === "es" ? "TÉRMINOS DEL SERVICIO" : "TERMS OF SERVICE"}
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
                                    Bienvenido a GroomingPet. Al reservar o utilizar cualquiera de nuestros servicios de spa móvil para mascotas en la Florida, usted (el Cliente) acepta regirse por los siguientes Términos del Servicio y nuestras políticas corporativas.
                                </p>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        1. Naturaleza del Servicio Móvil
                                    </h2>
                                    <p>
                                        GroomingPet opera spas móviles autónomos equipados con agua y energía eléctrica para el aseo de mascotas directamente en el domicilio del cliente. El cliente debe proporcionar un espacio de estacionamiento seguro, plano y legal (por ejemplo, entrada de vehículos o espacio frente al domicilio) para nuestra unidad móvil en la Florida.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        2. Política de Cancelación e Inasistencias (No-Show)
                                    </h2>
                                    <p>
                                        Debido a la naturaleza programada de las rutas de nuestro spa móvil, requerimos notificaciones de cancelación con anticipación:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Aviso Mínimo:</strong> Se requiere un mínimo de 24 horas de antelación para cancelar o reprogramar una cita sin penalizaciones.</li>
                                        <li><strong>No-Show / Cancelación Tardía:</strong> Si nuestra unidad llega al domicilio programado y el cliente no se encuentra en el lugar o la mascota no está disponible en un plazo de 15 minutos, se aplicará un cargo de inasistencia (no-show fee) de $50 para compensar los costos operativos y de combustible de la ruta en la Florida.</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        3. Exención de Responsabilidad (Liability Waiver)
                                    </h2>
                                    <p className="bg-[#F43F5E]/10 border-2 border-[#F43F5E]/20 p-4 rounded-2xl">
                                        <strong>Referencia del Descargo:</strong> El uso de nuestro servicio requiere la firma obligatoria (física o digital) del documento de Exención de Responsabilidad y Consentimiento (Liability Waiver) antes de la primera cita. Esto abarca el consentimiento del cliente para el manejo de:
                                        <br />
                                        - Mascotas con nutos severos (matting), donde el rapado puede causar irritaciones menores no atribuibles a negligencia.
                                        <br />
                                        - Mascotas agresivas o de temperamento difícil que requieran bozal o técnicas de contención seguras.
                                        <br />
                                        - Condiciones de salud preexistentes o mascotas ancianas (senior pets) con alto riesgo de estrés durante el baño o secado.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        4. Comportamiento y Seguridad de la Mascota
                                    </h2>
                                    <p>
                                        El cliente debe informar detalladamente sobre cualquier tendencia agresiva, mordeduras previas o fobias de la mascota. Nos reservamos el derecho de rechazar o interrumpir el servicio en cualquier momento si determinamos que representa una amenaza para la seguridad de nuestro estilista o de la propia mascota.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        5. Jurisdicción y Ley Aplicable
                                    </h2>
                                    <p>
                                        Estos términos se rigen e interpretan de acuerdo con las leyes del Estado de Florida. Cualquier disputa legal derivada de estos términos se resolverá exclusivamente en los tribunales del condado correspondiente donde se prestó el servicio.
                                    </p>
                                </section>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-neutral-950">
                                    Welcome to GroomingPet. By booking or utilizing any of our mobile pet spa services in Florida, you (the Client) agree to be bound by the following Terms of Service and our corporate policies.
                                </p>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        1. Nature of Mobile Services
                                    </h2>
                                    <p>
                                        GroomingPet operates autonomous mobile units equipped with water and electrical power to groom pets directly at the client's home. The client must provide a safe, flat, and legal parking space (e.g., driveway or street parking in front of the home) for our mobile unit in Florida.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        2. Cancellation and No-Show Policy
                                    </h2>
                                    <p>
                                        Due to the scheduled nature of our mobile pet spa routes, we require timely cancellation notifications:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Minimum Notice:</strong> A minimum of 24 hours' notice is required to cancel or reschedule an appointment without penalties.</li>
                                        <li><strong>No-Show / Late Cancellation:</strong> If our mobile unit arrives at the scheduled location and the client is not home or the pet is unavailable within 15 minutes, a $50 no-show fee will apply to cover operating and fuel costs of the route in Florida.</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        3. Liability Waiver Reference
                                    </h2>
                                    <p className="bg-[#F43F5E]/10 border-2 border-[#F43F5E]/20 p-4 rounded-2xl">
                                        <strong>Waiver Reference:</strong> Using our service strictly requires the signature (physical or digital) of our Liability Waiver and Consent document prior to the first appointment. This includes client consent for handling:
                                        <br />
                                        - Severely matted coats, where shaving may cause minor skin irritation not attributable to stylist negligence.
                                        <br />
                                        - Aggressive or difficult-to-handle pets requiring muzzling or safe restraint techniques.
                                        <br />
                                        - Pre-existing medical conditions or senior pets with elevated stress risks during washing or drying.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        4. Pet Behavior and Safety
                                    </h2>
                                    <p>
                                        Clients must fully disclose any aggressive tendencies, previous bites, or phobias of their pet. We reserve the right to refuse or terminate services at any time if we determine a pet represents a safety threat to our stylist or the pet itself.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950 font-sans border-b-2 border-black pb-1">
                                        5. Governing Law and Jurisdiction
                                    </h2>
                                    <p>
                                        These terms are governed and construed in accordance with the laws of the State of Florida. Any legal dispute arising from these terms shall be resolved exclusively in the appropriate courts of the county where services were rendered.
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

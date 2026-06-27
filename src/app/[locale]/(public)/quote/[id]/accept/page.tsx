import db from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2, Calendar, MapPin, DollarSign, ShieldCheck, ClipboardCheck } from "lucide-react";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { acceptQuoteAndNotify } from "@/lib/actions/quoteAccept";
import { getTranslations } from "next-intl/server";

interface PageProps {
    params: Promise<{
        locale: string;
        id: string;
    }>;
}

export const revalidate = 0;

export default async function QuoteAcceptPage({ params }: PageProps) {
    const { locale, id } = await params;

    // Fetch the QuoteRequest
    const quote = await (db as any).quoteRequest.findUnique({
        where: { id }
    });

    if (!quote) {
        notFound();
    }

    // Confirm appointment + send English confirmation email
    if (quote.status !== "CONFIRMED" && quote.status !== "COMPLETED") {
        await acceptQuoteAndNotify(id);
    }

    const t = await getTranslations("QuoteAccept");

    const price = Number(quote.finalAdminPrice || quote.systemEstimatedPrice);
    const dateFormatted = quote.appointmentDate 
        ? new Date(quote.appointmentDate).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })
        : null;

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative">
            {/* Pop Art Dot pattern background */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1.5px)] bg-size-[16px_16px]" />

            <div className="max-w-xl w-full bg-white border-4 border-black rounded-3xl p-6 sm:p-10 shadow-[8px_8px_0px_0px_#000] relative z-10 space-y-8 animate-in fade-in zoom-in duration-300">
                
                {/* Header Badge */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-[#2ECC71]/15 text-[#2ECC71] border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000] shrink-0">
                        <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                    </div>
                    
                    <div className="space-y-1">
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                            {t("title")}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-[#FAFAFA] border-3 border-black rounded-2xl p-5 space-y-4 text-sm font-bold text-slate-700">
                    <div className="flex items-start gap-3 border-b border-black/5 pb-3">
                        <MapPin className="h-5 w-5 text-[#7C3AED] shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                {t("service_location")}
                            </span>
                            <span className="text-neutral-950 font-black">{quote.ownerName}</span>
                            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{quote.address} (FL, ZIP {quote.zipCode})</p>
                        </div>
                    </div>

                    {quote.appointmentDate && (
                        <div className="flex items-start gap-3 border-b border-black/5 pb-3">
                            <Calendar className="h-5 w-5 text-[#7C3AED] shrink-0 mt-0.5" />
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                    {t("scheduled_time")}
                                </span>
                                <span className="text-neutral-950 font-black capitalize">{dateFormatted}</span>
                                <p className="text-xs text-slate-500 mt-0.5">{t("approx_time")} <strong className="text-neutral-950">{quote.appointmentTime || "—"}</strong></p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3 pb-1">
                        <DollarSign className="h-5 w-5 text-[#2ECC71] shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                {t("official_rate")}
                            </span>
                            <span className="text-2xl font-black text-[#2ECC71] tracking-tight">
                                ${price.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Features List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5 select-none">
                        <ClipboardCheck className="h-4.5 w-4.5 text-[#7C3AED] shrink-0" />
                        {t("what_happens_next")}
                    </h3>
                    <div className="space-y-2.5 text-xs text-slate-600 font-bold leading-relaxed">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="h-4.5 w-4.5 text-[#7C3AED] shrink-0 mt-0.5" />
                            <span>
                                {t("step_rabies")}
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4.5 w-4.5 text-[#7C3AED] shrink-0 mt-0.5" />
                            <span>
                                {t("step_van")}
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4.5 w-4.5 text-[#7C3AED] shrink-0 mt-0.5" />
                            <span>
                                {t("step_arrival")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 text-center">
                    <Link href="/">
                        <Button className="w-full h-12 rounded-xl bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-black uppercase tracking-widest text-xs border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
                            {t("back_to_home")}
                        </Button>
                    </Link>
                </div>

            </div>
        </div>
    );
}

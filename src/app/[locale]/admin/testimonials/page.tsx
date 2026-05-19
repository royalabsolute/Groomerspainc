import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import db from "@/lib/db";
import { cn } from "@/lib/utils";
import TestimonialActions from "@/components/admin/TestimonialActions";

export default async function AdminTestimonialsPage() {
    const testimonials = await db.testimonial.findMany({
        orderBy: { id: 'desc' }
    });

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4 text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Testimonios"
                    subtitle="Gestiona las reseñas y comentarios de tus clientes"
                />

                <div className="grid gap-6">
                    {testimonials.length === 0 ? (
                        <div className="border-2 border-dashed border-[#3A3A3A] bg-[#1A1A1A] py-24 flex flex-col items-center rounded-2xl shadow-xl">
                            <div className="h-16 w-16 bg-[#252525] border border-[#3A3A3A] rounded-full flex items-center justify-center mb-4">
                                <Star className="h-8 w-8 text-[#7C3AED]" />
                            </div>
                            <h3 className="text-lg font-bold text-white">No hay testimonios aún</h3>
                            <p className="text-sm text-slate-500 mt-1">Las reseñas de clientes aparecerán aquí para moderación.</p>
                        </div>
                    ) : (
                        testimonials.map((t) => (
                            <Card key={t.id} className="bg-[#1A1A1A] border-[#3A3A3A] shadow-xl rounded-2xl overflow-hidden group hover:border-[#7C3AED]/40 transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-6">
                                                <div className="h-10 w-10 bg-[#252525] border border-[#3A3A3A] rounded-xl flex items-center justify-center text-slate-400">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white text-sm uppercase tracking-wider leading-tight">{t.clientName}</h3>
                                                    <div className="flex text-[#7C3AED] mt-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={cn("h-3 w-3 fill-current", i >= t.rating && "text-slate-800 fill-none")} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-[#252525] rounded-xl border border-[#3A3A3A] relative">
                                                    <p className="text-slate-300 italic text-sm font-semibold leading-relaxed">
                                                        "{t.messageEs}"
                                                    </p>
                                                </div>
                                                {t.messageEn && (
                                                    <div className="pl-4 border-l-2 border-[#3A3A3A] italic">
                                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">EN: {t.messageEn}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <TestimonialActions id={t.id} approved={t.approved} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

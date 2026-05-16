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
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Testimonios"
                    subtitle="Gestiona las reseñas y comentarios de tus clientes"
                />

                <div className="grid gap-4">
                    {testimonials.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 bg-white py-24 flex flex-col items-center rounded-xl">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Star className="h-8 w-8 text-slate-200" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No hay testimonios aún</h3>
                            <p className="text-sm text-slate-400 mt-1">Las reseñas de clientes aparecerán aquí para moderación.</p>
                        </div>
                    ) : (
                        testimonials.map((t) => (
                            <Card key={t.id} className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-6">
                                                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 leading-tight">{t.clientName}</h3>
                                                    <div className="flex text-amber-400 mt-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={cn("h-3 w-3 fill-current", i >= t.rating && "text-slate-100 fill-none")} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 relative">
                                                    <p className="text-slate-600 italic text-sm font-medium leading-relaxed line-clamp-3">
                                                        "{t.messageEs}"
                                                    </p>
                                                </div>
                                                {t.messageEn && (
                                                    <div className="pl-4 border-l-2 border-slate-100 italic">
                                                        <p className="text-[11px] text-slate-400 font-medium">EN: {t.messageEn}</p>
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

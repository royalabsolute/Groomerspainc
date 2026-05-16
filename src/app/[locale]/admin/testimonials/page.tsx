import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, CheckCircle, XCircle, User } from "lucide-react";
import db from "@/lib/db";
import { cn } from "@/lib/utils";
import TestimonialActions from "@/components/admin/TestimonialActions";

export default async function AdminTestimonialsPage() {
    const testimonials = await db.testimonial.findMany({
        orderBy: { id: 'desc' } // Or by date if added
    });

    return (
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-7xl mx-auto">
                <AdminHeader
                    title="Testimonios de Clientes"
                    subtitle="Gestiona lo que la gente dice de GroomingPet. Aprueba o elimina reseñas."
                />

                <div className="grid gap-6">
                    {testimonials.length === 0 ? (
                        <Card className="border-dashed border-2 border-border/50 bg-transparent py-20 flex flex-col items-center">
                            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                <Star className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-xl font-bold text-muted-foreground">No hay testimonios aún</h3>
                            <p className="text-muted-foreground mt-2">Los testimonios enviados por clientes aparecerán aquí para tu aprobación.</p>
                        </Card>
                    ) : (
                        testimonials.map((t) => (
                            <Card key={t.id} className="border-border/40 hover:shadow-md transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                    <User className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{t.clientName}</h3>
                                                    <div className="flex text-amber-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={cn("h-4 w-4 fill-current", i >= t.rating && "text-muted-foreground/20 fill-none")} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-muted/30 rounded-xl relative">
                                                    <span className="absolute -top-3 left-4 text-4xl text-primary/20 font-serif">"</span>
                                                    <p className="text-foreground/80 italic line-clamp-3">{t.messageEs}</p>
                                                    <span className="absolute -bottom-8 right-4 text-4xl text-primary/20 font-serif">"</span>
                                                </div>
                                                {t.messageEn && (
                                                    <p className="text-xs text-muted-foreground pl-4 border-l-2 border-primary/20 italic">EN: {t.messageEn}</p>
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

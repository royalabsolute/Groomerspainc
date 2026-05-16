import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2, ExternalLink } from "lucide-react";
import db from "@/lib/db";
import GalleryUpload from "@/components/admin/GalleryUpload";
import Image from "next/image";
import GalleryItemActions from "@/components/admin/GalleryItemActions";

export default async function AdminGalleryPage() {
    const galleryItems = await db.galleryItem.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-7xl mx-auto">
                <AdminHeader
                    title="Administrar Galería"
                    subtitle="Sube y gestiona las fotos y videos que aparecen en el carrusel y la sección de galería."
                    action={<GalleryUpload />}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {galleryItems.length === 0 ? (
                        <div className="col-span-full">
                            <Card className="border-dashed border-2 border-border/50 bg-transparent py-20 flex flex-col items-center">
                                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-bold text-muted-foreground">La galería está vacía</h3>
                                <p className="text-muted-foreground mt-2">Usa el botón superior para subir tu primera foto.</p>
                            </Card>
                        </div>
                    ) : (
                        galleryItems.map((item) => (
                            <Card key={item.id} className="group overflow-hidden border-border/40 hover:shadow-xl transition-all duration-500 bg-white">
                                <div className="relative aspect-square">
                                    <Image
                                        src={item.url}
                                        alt="Gallery"
                                        fill
                                        unoptimized
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                    />
                                    <GalleryItemActions id={item.id} url={item.url} />
                                </div>
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{item.type}</span>
                                        <span className="text-[10px] font-medium text-muted-foreground/40">{new Date(item.createdAt).toLocaleDateString()}</span>
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

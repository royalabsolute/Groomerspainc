import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2, ExternalLink, Calendar, Layers } from "lucide-react";
import db from "@/lib/db";
import GalleryUpload from "@/components/admin/GalleryUpload";
import Image from "next/image";
import GalleryItemActions from "@/components/admin/GalleryItemActions";

export default async function AdminGalleryPage() {
    const galleryItems = await db.galleryItem.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Administrar Galería"
                    subtitle="Gestiona el contenido visual de la plataforma"
                    action={<GalleryUpload />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {galleryItems.length === 0 ? (
                        <div className="col-span-full">
                            <div className="border-2 border-dashed border-slate-200 bg-white py-24 flex flex-col items-center rounded-2xl">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">La galería está vacía</h3>
                                <p className="text-slate-500 mt-1">Sube imágenes para comenzar.</p>
                            </div>
                        </div>
                    ) : (
                        galleryItems.map((item) => (
                            <div key={item.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="relative aspect-square overflow-hidden bg-slate-100">
                                    <Image
                                        src={item.url}
                                        alt="Gallery Item"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                    />
                                    
                                    {/* Actions Overlay */}
                                    <GalleryItemActions id={item.id} url={item.url} />
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-slate-400 gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center text-slate-400 gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

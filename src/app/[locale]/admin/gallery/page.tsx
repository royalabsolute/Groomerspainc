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
        <div className="min-h-screen bg-transparent p-1 sm:p-4 text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Administrar Galería"
                    subtitle="Gestiona el contenido visual de la plataforma"
                    action={<GalleryUpload />}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {galleryItems.length === 0 ? (
                        <div className="col-span-full">
                            <div className="border-2 border-dashed border-[#3A3A3A] bg-[#1A1A1A] py-24 flex flex-col items-center rounded-2xl shadow-xl">
                                <div className="h-16 w-16 bg-[#252525] border border-[#3A3A3A] rounded-full flex items-center justify-center mb-4">
                                    <ImageIcon className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">La galería está vacía</h3>
                                <p className="text-slate-500 mt-1">Sube imágenes para comenzar.</p>
                            </div>
                        </div>
                    ) : (
                        galleryItems.map((item) => (
                            <div key={item.id} className="group relative bg-[#1A1A1A] rounded-2xl border border-[#3A3A3A] overflow-hidden shadow-xl hover:border-[#00DDEB]/40 transition-all duration-300">
                                <div className="relative aspect-square overflow-hidden bg-[#252525]">
                                    <Image
                                        src={item.url}
                                        alt="Gallery Item"
                                        fill
                                        unoptimized
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                    />
                                    
                                    {/* Actions Overlay */}
                                    <GalleryItemActions id={item.id} url={item.url} />
                                </div>

                                <div className="p-4 bg-[#1A1A1A]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-slate-400 gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                            <span className="text-xs font-semibold">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-[#252525] border border-[#3A3A3A] px-2 py-0.5 rounded-md text-[#00DDEB]">
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

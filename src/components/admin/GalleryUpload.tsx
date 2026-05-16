"use client";

import LocalImageUpload from "./LocalImageUpload";
import { addGalleryItem } from "@/lib/actions/gallery";
import { useRouter } from "next/navigation";

export default function GalleryUpload() {
    const router = useRouter();

    const handleSuccess = async (url: string) => {
        const result = await addGalleryItem(url);
        if (result.success) {
            router.refresh();
        }
    };

    return <LocalImageUpload onSuccess={handleSuccess} />;
}

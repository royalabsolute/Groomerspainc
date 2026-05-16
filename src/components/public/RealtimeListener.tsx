"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RealtimeListener() {
    const router = useRouter();

    useEffect(() => {
        const eventSource = new EventSource("/api/events");

        const handleUpdate = (e: MessageEvent) => {

            router.refresh();
        };

        eventSource.addEventListener("gallery_update", handleUpdate);
        eventSource.addEventListener("services_update", handleUpdate);
        eventSource.addEventListener("config_update", handleUpdate);

        eventSource.onerror = (err) => {
            console.error("SSE Connection error:", err);
            eventSource.close();
            // Optional: Implement reconnect backoff here
        };

        return () => {
            eventSource.close();
        };
    }, [router]);

    return null;
}

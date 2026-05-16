import { events, EVENT_TOPICS } from "@/lib/events";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Callback to push data to the stream
            const push = (eventName: string, data: any) => {
                const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // Listen for each server event and push it to the client
            const onGalleryUpdate = () => push(EVENT_TOPICS.GALLERY_UPDATE, { time: Date.now() });
            const onServicesUpdate = () => push(EVENT_TOPICS.SERVICES_UPDATE, { time: Date.now() });
            const onConfigUpdate = () => push(EVENT_TOPICS.CONFIG_UPDATE, { time: Date.now() });

            events.addListener(EVENT_TOPICS.GALLERY_UPDATE, onGalleryUpdate);
            events.addListener(EVENT_TOPICS.SERVICES_UPDATE, onServicesUpdate);
            events.addListener(EVENT_TOPICS.CONFIG_UPDATE, onConfigUpdate);

            // Periodically ping to keep connection alive
            const pingInterval = setInterval(() => {
                controller.enqueue(encoder.encode(": ping\n\n"));
            }, 30000);

            // Cleanup when client disconnects
            req.signal.onabort = () => {
                clearInterval(pingInterval);
                events.removeListener(EVENT_TOPICS.GALLERY_UPDATE, onGalleryUpdate);
                events.removeListener(EVENT_TOPICS.SERVICES_UPDATE, onServicesUpdate);
                events.removeListener(EVENT_TOPICS.CONFIG_UPDATE, onConfigUpdate);
            };
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}

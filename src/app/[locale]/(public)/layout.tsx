import React from "react";
import Navbar from '@/components/public/Navbar';
import RealtimeListener from '@/components/public/RealtimeListener';
import { Toaster } from 'sonner';
import { getConfig } from "@/lib/config";

export default async function PublicLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const config = await getConfig();

    return (
        <div className="min-h-screen w-full m-0 p-0 overflow-x-hidden bg-background">
            {/* Realtime listener for client-side socket sync */}
            <RealtimeListener />
            
            {/* Client-Facing Public Header / Navigation Bar */}
            <Navbar config={config} />
            
            {/* Main content flow */}
            <main className="min-h-screen w-full m-0 p-0 overflow-x-hidden bg-background">{children}</main>
            
            {/* Notification service */}
            <Toaster richColors position="top-right" />
        </div>
    );
}

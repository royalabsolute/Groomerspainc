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
        <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
            {/* Realtime listener for client-side socket sync */}
            <RealtimeListener />
            
            {/* Client-Facing Public Header / Navigation Bar */}
            <Navbar config={config} />
            
            {/* Main content flow */}
            <main className="flex-1 w-full overflow-x-hidden">{children}</main>
            
            {/* Notification service */}
            <Toaster richColors position="top-right" />
        </div>
    );
}

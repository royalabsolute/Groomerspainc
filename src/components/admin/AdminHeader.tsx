"use client";

import { cn } from "@/lib/utils";

interface AdminHeaderProps {
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, action }: AdminHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-border/10 shadow-xs mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground leading-tight">{title}</h1>
                <p className="text-muted-foreground font-medium mt-1">{subtitle}</p>
            </div>
            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

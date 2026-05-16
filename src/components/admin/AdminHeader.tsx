"use client";

import { cn } from "@/lib/utils";

interface AdminHeaderProps {
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, action }: AdminHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 mb-8 border-b border-slate-200 gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
                <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
            </div>
            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

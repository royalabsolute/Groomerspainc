"use client";

import { cn } from "@/lib/utils";

interface AdminHeaderProps {
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, action }: AdminHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 md:pb-8 mb-6 md:mb-8 border-b border-slate-200 dark:border-slate-800/80 gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">{title}</h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{subtitle}</p>
            </div>
            {action && (
                <div className="shrink-0 w-full md:w-auto">
                    {action}
                </div>
            )}
        </div>
    );
}

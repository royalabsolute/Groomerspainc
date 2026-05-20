"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { events, EVENT_TOPICS } from "@/lib/events";

export async function updateSiteConfig(data: any) {
    try {
        const config = await (db as any).siteConfig.upsert({
            where: { id: "config" },
            update: {
                phone: data.phone,
                email: data.email,
                address: data.address,
                heroTitleEs: data.heroTitleEs,
                heroTitleEn: data.heroTitleEn,
                heroDescEs: data.heroDescEs,
                heroDescEn: data.heroDescEn,
                heroHighlightEs: data.heroHighlightEs,
                heroHighlightEn: data.heroHighlightEn,
                footerDescEs: data.footerDescEs,
                footerDescEn: data.footerDescEn,
                tiktokUrl: data.tiktokUrl,
                instagramUrl: data.instagramUrl,
                twitterUrl: data.twitterUrl,
                heroImageUrl: data.heroImageUrl,
                heroBadgeEs: data.heroBadgeEs,
                heroBadgeEn: data.heroBadgeEn,
                notificationEmail: data.notificationEmail,
                contactTitleEs: data.contactTitleEs,
                contactTitleEn: data.contactTitleEn,
                contactSubtitleEs: data.contactSubtitleEs,
                contactSubtitleEn: data.contactSubtitleEn,
                hoursEs: data.hoursEs,
                hoursEn: data.hoursEn,
                transformationsEnabled: data.transformationsEnabled,
                tiktokActive: data.tiktokActive,
                instagramActive: data.instagramActive,
                twitterActive: data.twitterActive,
                workingHoursStart: data.workingHoursStart,
                workingHoursEnd: data.workingHoursEnd,
                workingDays: data.workingDays,
                blockedDates: data.blockedDates,
            },
            create: {
                id: "config",
                phone: data.phone,
                email: data.email,
                address: data.address,
                heroTitleEs: data.heroTitleEs,
                heroTitleEn: data.heroTitleEn,
                heroDescEs: data.heroDescEs,
                heroDescEn: data.heroDescEn,
                heroHighlightEs: data.heroHighlightEs,
                heroHighlightEn: data.heroHighlightEn,
                footerDescEs: data.footerDescEs,
                footerDescEn: data.footerDescEn,
                tiktokUrl: data.tiktokUrl,
                instagramUrl: data.instagramUrl,
                twitterUrl: data.twitterUrl,
                heroImageUrl: data.heroImageUrl,
                heroBadgeEs: data.heroBadgeEs,
                heroBadgeEn: data.heroBadgeEn,
                notificationEmail: data.notificationEmail,
                contactTitleEs: data.contactTitleEs,
                contactTitleEn: data.contactTitleEn,
                contactSubtitleEs: data.contactSubtitleEs,
                contactSubtitleEn: data.contactSubtitleEn,
                hoursEs: data.hoursEs,
                hoursEn: data.hoursEn,
                transformationsEnabled: data.transformationsEnabled,
                tiktokActive: data.tiktokActive,
                instagramActive: data.instagramActive,
                twitterActive: data.twitterActive,
                workingHoursStart: data.workingHoursStart,
                workingHoursEnd: data.workingHoursEnd,
                workingDays: data.workingDays,
                blockedDates: data.blockedDates,
            }
        });

        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        
        events.emit(EVENT_TOPICS.CONFIG_UPDATE);
        
        return { success: true, config };
    } catch (error) {
        console.error("Error updating site config:", error);
        return { success: false, error: "Failed to update configuration" };
    }
}

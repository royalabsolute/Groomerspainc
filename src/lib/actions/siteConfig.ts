"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { events, EVENT_TOPICS } from "@/lib/events";

export async function updateSiteConfig(data: any) {
    try {
        const existing = await (db as any).siteConfig.findUnique({
            where: { id: "config" }
        });
        const mergedData = { ...(existing || {}), ...data };

        const config = await (db as any).siteConfig.upsert({
            where: { id: "config" },
            update: {
                phone: mergedData.phone,
                email: mergedData.email,
                address: mergedData.address,
                heroTitleEs: mergedData.heroTitleEs,
                heroTitleEn: mergedData.heroTitleEn,
                heroDescEs: mergedData.heroDescEs,
                heroDescEn: mergedData.heroDescEn,
                heroHighlightEs: mergedData.heroHighlightEs,
                heroHighlightEn: mergedData.heroHighlightEn,
                footerDescEs: mergedData.footerDescEs,
                footerDescEn: mergedData.footerDescEn,
                tiktokUrl: mergedData.tiktokUrl,
                instagramUrl: mergedData.instagramUrl,
                twitterUrl: mergedData.twitterUrl,
                heroImageUrl: mergedData.heroImageUrl,
                heroBadgeEs: mergedData.heroBadgeEs,
                heroBadgeEn: mergedData.heroBadgeEn,
                notificationEmail: mergedData.notificationEmail,
                contactTitleEs: mergedData.contactTitleEs,
                contactTitleEn: mergedData.contactTitleEn,
                contactSubtitleEs: mergedData.contactSubtitleEs,
                contactSubtitleEn: mergedData.contactSubtitleEn,
                hoursEs: mergedData.hoursEs,
                hoursEn: mergedData.hoursEn,
                transformationsEnabled: mergedData.transformationsEnabled,
                tiktokActive: mergedData.tiktokActive,
                instagramActive: mergedData.instagramActive,
                twitterActive: mergedData.twitterActive,
                workingHoursStart: mergedData.workingHoursStart,
                workingHoursEnd: mergedData.workingHoursEnd,
                workingDays: mergedData.workingDays,
                blockedDates: mergedData.blockedDates,
                weightTier1Price: mergedData.weightTier1Price !== undefined && mergedData.weightTier1Price !== null ? Number(mergedData.weightTier1Price) : (existing ? existing.weightTier1Price : null),
                weightTier2Price: mergedData.weightTier2Price !== undefined && mergedData.weightTier2Price !== null ? Number(mergedData.weightTier2Price) : (existing ? existing.weightTier2Price : null),
                weightTier3Price: mergedData.weightTier3Price !== undefined && mergedData.weightTier3Price !== null ? Number(mergedData.weightTier3Price) : (existing ? existing.weightTier3Price : null),
                weightTier4Price: mergedData.weightTier4Price !== undefined && mergedData.weightTier4Price !== null ? Number(mergedData.weightTier4Price) : (existing ? existing.weightTier4Price : null),
            },
            create: {
                id: "config",
                phone: mergedData.phone,
                email: mergedData.email,
                address: mergedData.address,
                heroTitleEs: mergedData.heroTitleEs,
                heroTitleEn: mergedData.heroTitleEn,
                heroDescEs: mergedData.heroDescEs,
                heroDescEn: mergedData.heroDescEn,
                heroHighlightEs: mergedData.heroHighlightEs,
                heroHighlightEn: mergedData.heroHighlightEn,
                footerDescEs: mergedData.footerDescEs,
                footerDescEn: mergedData.footerDescEn,
                tiktokUrl: mergedData.tiktokUrl,
                instagramUrl: mergedData.instagramUrl,
                twitterUrl: mergedData.twitterUrl,
                heroImageUrl: mergedData.heroImageUrl,
                heroBadgeEs: mergedData.heroBadgeEs,
                heroBadgeEn: mergedData.heroBadgeEn,
                notificationEmail: mergedData.notificationEmail,
                contactTitleEs: mergedData.contactTitleEs,
                contactTitleEn: mergedData.contactTitleEn,
                contactSubtitleEs: mergedData.contactSubtitleEs,
                contactSubtitleEn: mergedData.contactSubtitleEn,
                hoursEs: mergedData.hoursEs,
                hoursEn: mergedData.hoursEn,
                transformationsEnabled: mergedData.transformationsEnabled,
                tiktokActive: mergedData.tiktokActive,
                instagramActive: mergedData.instagramActive,
                twitterActive: mergedData.twitterActive,
                workingHoursStart: mergedData.workingHoursStart,
                workingHoursEnd: mergedData.workingHoursEnd,
                workingDays: mergedData.workingDays,
                blockedDates: mergedData.blockedDates,
                weightTier1Price: mergedData.weightTier1Price !== undefined && mergedData.weightTier1Price !== null ? Number(mergedData.weightTier1Price) : null,
                weightTier2Price: mergedData.weightTier2Price !== undefined && mergedData.weightTier2Price !== null ? Number(mergedData.weightTier2Price) : null,
                weightTier3Price: mergedData.weightTier3Price !== undefined && mergedData.weightTier3Price !== null ? Number(mergedData.weightTier3Price) : null,
                weightTier4Price: mergedData.weightTier4Price !== undefined && mergedData.weightTier4Price !== null ? Number(mergedData.weightTier4Price) : null,
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

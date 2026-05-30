"use server";

import translate from "google-translate-api-x";

export async function translateText(text: string, from: "es" | "en", to: "en" | "es") {
    if (!text || text.trim() === "") return { success: true, text: "" };
    
    try {
        const res = await translate(text, { from, to, autoCorrect: true });
        return { success: true, text: res.text };
    } catch (error) {
        console.error("Translation ERROR:", error);
        return { success: false, error: "No se pudo traducir", text: "" };
    }
}

import db from "@/lib/db";

export async function translateAllMissing() {
    let translationsDone = 0;

    try {
        // Translate SiteConfig
        const config = await (db as any).siteConfig.findUnique({ where: { id: "config" } });
        if (config) {
            const configUpdates: any = {};
            const pairs = [
                { es: "heroTitleEs", en: "heroTitleEn" },
                { es: "heroHighlightEs", en: "heroHighlightEn" },
                { es: "heroBadgeEs", en: "heroBadgeEn" },
                { es: "heroDescEs", en: "heroDescEn" },
                { es: "contactTitleEs", en: "contactTitleEn" },
                { es: "contactSubtitleEs", en: "contactSubtitleEn" },
                { es: "hoursEs", en: "hoursEn" },
                { es: "footerDescEs", en: "footerDescEn" },
            ];
            for (const p of pairs) {
                if (config[p.es] && !config[p.en]) {
                    const tr = await translateText(config[p.es], "es", "en");
                    if (tr.success && tr.text) { configUpdates[p.en] = tr.text; translationsDone++; }
                } else if (config[p.en] && !config[p.es]) {
                    const tr = await translateText(config[p.en], "en", "es");
                    if (tr.success && tr.text) { configUpdates[p.es] = tr.text; translationsDone++; }
                }
            }
            if (Object.keys(configUpdates).length > 0) {
                await (db as any).siteConfig.update({ where: { id: "config" }, data: configUpdates });
            }
        }

        // Translate Services
        const services = await (db as any).service.findMany();
        for (const s of services) {
            const updates: any = {};
            if (s.titleEs && !s.titleEn) {
                const tr = await translateText(s.titleEs, "es", "en");
                if (tr.success && tr.text) { updates.titleEn = tr.text; translationsDone++; }
            } else if (s.titleEn && !s.titleEs) {
                const tr = await translateText(s.titleEn, "en", "es");
                if (tr.success && tr.text) { updates.titleEs = tr.text; translationsDone++; }
            }
            if (s.descEs && !s.descEn) {
                const tr = await translateText(s.descEs, "es", "en");
                if (tr.success && tr.text) { updates.descEn = tr.text; translationsDone++; }
            } else if (s.descEn && !s.descEs) {
                const tr = await translateText(s.descEn, "en", "es");
                if (tr.success && tr.text) { updates.descEs = tr.text; translationsDone++; }
            }
            if (Object.keys(updates).length > 0) {
                await (db as any).service.update({ where: { id: s.id }, data: updates });
            }
        }

        // Translate Transformations
        const transformations = await (db as any).transformation.findMany();
        for (const t of transformations) {
            const updates: any = {};
            if (t.descriptionEs && !t.descriptionEn) {
                const tr = await translateText(t.descriptionEs, "es", "en");
                if (tr.success && tr.text) { updates.descriptionEn = tr.text; translationsDone++; }
            } else if (t.descriptionEn && !t.descriptionEs) {
                const tr = await translateText(t.descriptionEn, "en", "es");
                if (tr.success && tr.text) { updates.descriptionEs = tr.text; translationsDone++; }
            }
            if (Object.keys(updates).length > 0) {
                await (db as any).transformation.update({ where: { id: t.id }, data: updates });
            }
        }

        return { success: true, count: translationsDone };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

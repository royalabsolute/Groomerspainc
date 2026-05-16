import db from "./db";
import { cache } from "react";

// Use React cache to avoid duplicate DB queries during the same request
export const getConfig = cache(async () => {
    try {
        const config = await db.siteConfig.findUnique({
            where: { id: "config" }
        });
        return config;
    } catch (error) {
        console.error("Error fetching config:", error);
        return null;
    }
});

"use server";

export async function translateText(text: string, from: "es" | "en", to: "en" | "es") {
    if (!text || text.trim() === "") return { success: true, text: "" };
    
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const translatedText = data[0].map((item: any) => item[0]).join("");
        return { success: true, text: translatedText };
    } catch (error) {
        console.error("Translation ERROR:", error);
        return { success: false, error: "No se pudo traducir", text: "" };
    }
}


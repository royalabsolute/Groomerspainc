/**
 * Intelligent Mobile Quote Pricing Engine
 * Specific for Florida Mobile Pet Grooming Standards
 */

// Whitelisted ZIP Code Areas for Miami-Dade and Broward Counties
export function isZipCodeSupported(zipCode: string): boolean {
    const cleanZip = zipCode.trim();
    if (!/^\d{5}$/.test(cleanZip)) return false;

    const prefix = cleanZip.substring(0, 3);
    // 331xx = Miami-Dade (e.g. Miami, Miami Beach)
    // 333xx = Broward (e.g. Fort Lauderdale, Pembroke Pines)
    // 330xx = Border cities (e.g. Hollywood, Hialeah, Homestead)
    return prefix === "331" || prefix === "333" || prefix === "330";
}

export function getTravelPremium(zipCode: string): number {
    const cleanZip = zipCode.trim();
    if (!isZipCodeSupported(cleanZip)) return 0;

    const prefix = cleanZip.substring(0, 3);
    if (prefix === "333") {
        // Broward County is further from our central hub in South Miami
        return 20; 
    }
    // Miami-Dade standard coverage premium
    return 10;
}

export interface QuoteCalculation {
    success: boolean;
    inCoverage: boolean;
    basePrice: number;
    weightPremium: number;
    travelPremium: number;
    totalPrice: number;
}

export function calculateDynamicQuote(
    serviceName: string,
    weightLbs: number,
    zipCode: string
): QuoteCalculation {
    const cleanZip = zipCode.trim();
    
    // 1. Check ZIP Code Coverage
    if (!isZipCodeSupported(cleanZip)) {
        return {
            success: false,
            inCoverage: false,
            basePrice: 0,
            weightPremium: 0,
            travelPremium: 0,
            totalPrice: 0
        };
    }

    // 2. Base Price Determination based on Service Tiers
    let basePrice = 50; // Fallback rate
    const s = serviceName.toLowerCase();

    if (s.includes("baño") || s.includes("bath") || s.includes("básico")) {
        basePrice = 45;
    } else if (s.includes("grooming") || s.includes("corte") || s.includes("completo")) {
        basePrice = 75;
    } else if (s.includes("spa") || s.includes("deluxe") || s.includes("premium")) {
        basePrice = 95;
    }

    // 3. Pet Weight Premium (Larger dogs require more product, mechanical power, and handling time)
    let weightPremium = 0;
    if (weightLbs < 15) {
        weightPremium = 0;      // Toy/Small Dogs (<15 lbs)
    } else if (weightLbs >= 15 && weightLbs < 30) {
        weightPremium = 15;     // Medium Dogs (15-30 lbs)
    } else if (weightLbs >= 30 && weightLbs < 60) {
        weightPremium = 30;     // Large Dogs (30-60 lbs)
    } else {
        weightPremium = 50;     // Giant/Extra-Large Dogs (>=60 lbs)
    }

    // 4. Travel Surcharge
    const travelPremium = getTravelPremium(cleanZip);

    // 5. Total Price Compilation
    const totalPrice = basePrice + weightPremium + travelPremium;

    return {
        success: true,
        inCoverage: true,
        basePrice,
        weightPremium,
        travelPremium,
        totalPrice
    };
}

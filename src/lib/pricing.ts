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



export interface ZipCodeInfo {
  zip: string;
  name: string;
  lat: number;
  lng: number;
}

// Coordinate of Base 33312 (Fort Lauderdale Operations Center)
export const BASE_LAT = 26.1014;
export const BASE_LNG = -80.1706;
export const BASE_ZIP = "33312";

// Main South Florida Zip Codes for automatic calculation
export const SOUTH_FLORIDA_ZIPS: Record<string, Omit<ZipCodeInfo, "zip">> = {
  "33312": { name: "Fort Lauderdale Base (Melrose Park)", lat: 26.1014, lng: -80.1706 },
  "33301": { name: "Fort Lauderdale (Las Olas / Downtown)", lat: 26.1212, lng: -80.1373 },
  "33316": { name: "Fort Lauderdale (Harbordale / Port)", lat: 26.0987, lng: -80.1312 },
  "33315": { name: "Fort Lauderdale (Edgewood)", lat: 26.0954, lng: -80.1589 },
  "33304": { name: "Fort Lauderdale (Victoria Park)", lat: 26.1398, lng: -80.1251 },
  "33311": { name: "Fort Lauderdale (Lauderdale Manors)", lat: 26.1412, lng: -80.1698 },
  "33020": { name: "Hollywood (Downtown / Lakes)", lat: 26.0131, lng: -80.1554 },
  "33019": { name: "Hollywood Beach", lat: 26.0210, lng: -80.1198 },
  "33021": { name: "Hollywood (Emerald Hills)", lat: 26.0212, lng: -80.1989 },
  "33024": { name: "Hollywood (Pembroke Pines East)", lat: 26.0214, lng: -80.2541 },
  "33025": { name: "Miramar (East)", lat: 25.9760, lng: -80.3112 },
  "33027": { name: "Miramar (West)", lat: 25.9721, lng: -80.3892 },
  "33324": { name: "Plantation (Jacaranda)", lat: 26.1221, lng: -80.2741 },
  "33325": { name: "Davie / Sunrise (West)", lat: 26.1151, lng: -80.3112 },
  "33326": { name: "Weston", lat: 26.1012, lng: -80.3891 },
  "33327": { name: "Weston (Savanna)", lat: 26.1098, lng: -80.4212 },
  "33308": { name: "Lauderdale-by-the-Sea", lat: 26.1924, lng: -80.1065 },
  "33309": { name: "Fort Lauderdale (Oakland Park West)", lat: 26.1895, lng: -80.1712 },
  "33060": { name: "Pompano Beach", lat: 26.2301, lng: -80.1264 },
  "33062": { name: "Pompano Beach (Waterfront)", lat: 26.2312, lng: -80.0898 },
  "33064": { name: "Lighthouse Point", lat: 26.2789, lng: -80.1112 },
  "33401": { name: "West Palm Beach", lat: 26.7153, lng: -80.0536 },
  
  // Miami-Dade County
  "33131": { name: "Brickell (Miami Financial District)", lat: 25.7679, lng: -80.1901 },
  "33130": { name: "Brickell / Miami River", lat: 25.7651, lng: -80.1985 },
  "33129": { name: "Miami (Roads / Brickell South)", lat: 25.7512, lng: -80.2098 },
  "33139": { name: "Miami Beach (South Beach)", lat: 25.7781, lng: -80.1313 },
  "33140": { name: "Miami Beach (Mid Beach)", lat: 25.8112, lng: -80.1287 },
  "33141": { name: "Miami Beach (North Beach)", lat: 25.8498, lng: -80.1298 },
  "33154": { name: "Bal Harbour / Surfside", lat: 25.8821, lng: -80.1278 },
  "33180": { name: "Aventura", lat: 25.9621, lng: -80.1398 },
  "33160": { name: "Sunny Isles Beach", lat: 25.9324, lng: -80.1221 },
  "33161": { name: "North Miami", lat: 25.8912, lng: -80.1843 },
  "33181": { name: "North Miami (Keystone Point)", lat: 25.8923, lng: -80.1541 },
  "33156": { name: "Pinecrest", lat: 25.6601, lng: -80.3168 },
  "33143": { name: "South Miami", lat: 25.7012, lng: -80.2891 },
  "33149": { name: "Key Biscayne", lat: 25.7001, lng: -80.1668 },
  "33133": { name: "Coconut Grove", lat: 25.7289, lng: -80.2411 },
  "33134": { name: "Coral Gables (Downtown)", lat: 25.7467, lng: -80.2721 },
  "33146": { name: "Coral Gables (University)", lat: 25.7212, lng: -80.2743 },
  "33166": { name: "Doral (Main / Golf Resort)", lat: 25.8195, lng: -80.3551 },
  "33172": { name: "Doral (West)", lat: 25.7992, lng: -80.3664 },
  "33178": { name: "Doral (Isles)", lat: 25.8243, lng: -80.4012 },
  "33010": { name: "Hialeah (Downtown)", lat: 25.8291, lng: -80.2764 },
  "33012": { name: "Hialeah (West)", lat: 25.8612, lng: -80.3012 },
  "33014": { name: "Miami Lakes", lat: 25.9112, lng: -80.3098 },
  "33122": { name: "Miami (International Airport)", lat: 25.7932, lng: -80.2912 },
  "33125": { name: "Miami (Little Havana)", lat: 25.7798, lng: -80.2312 },
  "33126": { name: "Miami (Flagler)", lat: 25.7743, lng: -80.2987 },
  "33137": { name: "Miami (Design District / Midtown)", lat: 25.8112, lng: -80.1912 },
  "33138": { name: "Miami (Belle Meade / Upper East)", lat: 25.8451, lng: -80.1812 },
};

/**
 * Calculates the Haversine distance in miles between two coordinates
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Procedural travel fee logic:
 * First 10 miles are free ($0), then $1.00 per each extra mile.
 */
export function calculateTravelFee(distance: number): number {
  if (distance <= 10) return 0;
  return parseFloat(Math.ceil(distance - 10).toFixed(2));
}

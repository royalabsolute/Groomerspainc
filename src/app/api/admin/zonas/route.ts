import { NextResponse } from "next/server";
import db from "@/lib/db";
import { 
  SOUTH_FLORIDA_ZIPS, 
  BASE_LAT, 
  BASE_LNG, 
  calculateHaversineDistance, 
  calculateTravelFee 
} from "@/lib/zipcodes";

/**
 * GET: Retrieve all configured service zones
 */
export async function GET() {
  try {
    const zones = await (db as any).serviceZone.findMany({
      orderBy: { zipCode: "asc" }
    });
    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching service zones:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Create or toggle a service zone
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode } = body;

    if (!zipCode || typeof zipCode !== "string") {
      return NextResponse.json({ error: "Invalid Zip Code provided" }, { status: 400 });
    }

    const cleanZip = zipCode.trim();

    // Check if zone already exists in DB
    const existingZone = await (db as any).serviceZone.findUnique({
      where: { zipCode: cleanZip }
    });

    if (existingZone) {
      // Toggle active status as a quick action
      const updated = await (db as any).serviceZone.update({
        where: { zipCode: cleanZip },
        data: { isActive: !existingZone.isActive }
      });
      return NextResponse.json(updated);
    }

    // Look up in our in-memory South Florida directory
    const zipInfo = SOUTH_FLORIDA_ZIPS[cleanZip];
    let name = body.name || `Zip Code ${cleanZip}`;
    let distance = body.distanceMiles !== undefined ? Number(body.distanceMiles) : 0;
    let fee = body.travelFee !== undefined ? Number(body.travelFee) : 0;

    if (zipInfo) {
      name = zipInfo.name;
      distance = calculateHaversineDistance(BASE_LAT, BASE_LNG, zipInfo.lat, zipInfo.lng);
      fee = calculateTravelFee(distance);
    } else {
      // Fallback procedural calculations for Florida zip codes not explicitly in list
      // Fort Lauderdale/Miami zip codes start with 330, 331, 332, 333, 334
      if (cleanZip.startsWith("33")) {
        const zipVal = Number(cleanZip) || 33312;
        distance = parseFloat((Math.abs(zipVal - 33312) % 35 + 2).toFixed(1));
        fee = calculateTravelFee(distance);
        name = `South Florida Region (${cleanZip})`;
      } else {
        return NextResponse.json({ 
          error: "Zip Code outside coverage scope (South Florida zips starting with 33xxx only)" 
        }, { status: 400 });
      }
    }

    const newZone = await (db as any).serviceZone.create({
      data: {
        zipCode: cleanZip,
        name,
        distanceMiles: distance,
        travelFee: fee,
        isActive: true
      }
    });

    return NextResponse.json(newZone);
  } catch (error) {
    console.error("Error creating service zone:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT: Update an existing service zone (travel fee or isActive status)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { zipCode, travelFee, isActive, name } = body;

    if (!zipCode) {
      return NextResponse.json({ error: "Zip Code is required" }, { status: 400 });
    }

    const data: any = {};
    if (travelFee !== undefined) data.travelFee = parseFloat(travelFee);
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (name !== undefined) data.name = String(name);

    const updated = await (db as any).serviceZone.update({
      where: { zipCode },
      data
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating service zone:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a service zone
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get("zipCode");

    if (!zipCode) {
      return NextResponse.json({ error: "Zip Code is required" }, { status: 400 });
    }

    await (db as any).serviceZone.delete({
      where: { zipCode }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service zone:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

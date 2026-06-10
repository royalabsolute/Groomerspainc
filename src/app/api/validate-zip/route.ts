import { NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const zipQuerySchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "ZIP Code must be exactly 5 digits."),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get("zip") || "";

    const validation = zipQuerySchema.safeParse({ zip: zip.trim() });
    if (!validation.success) {
      return NextResponse.json({ supported: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const cleanZip = validation.data.zip;

    // Query active service zone in database
    const zone = await (db as any).serviceZone.findUnique({
      where: { zipCode: cleanZip }
    });

    if (zone && zone.isActive) {
      return NextResponse.json({
        supported: true,
        name: zone.name,
        travelFee: Number(zone.travelFee),
        distanceMiles: Number(zone.distanceMiles)
      });
    }

    return NextResponse.json({ supported: false });
  } catch (error) {
    console.error("Error validating zip code:", error);
    return NextResponse.json({ supported: false, error: "Internal Server Error" }, { status: 500 });
  }
}

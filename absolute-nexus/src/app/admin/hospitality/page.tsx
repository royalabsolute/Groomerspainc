import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import HotelAdminClient from "./HotelAdminClient";

export const dynamic = "force-dynamic";

export default async function HospitalityAdminPage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin/hospitality");
  }

  // Fetch all property, room and content data from db to initial pass
  const properties = await db.hotelProperty.findMany({
    include: {
      rooms: {
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });

  const contents = await db.hotelContent.findMany({
    orderBy: { key: "asc" }
  });

  // Safe type conversion for pass to client component
  const typedProperties = properties.map((p: any) => ({
    id: p.id,
    name: p.name,
    descriptionEs: p.descriptionEs,
    descriptionEn: p.descriptionEn,
    rooms: p.rooms.map((r: any) => ({
      id: r.id,
      propertyId: r.propertyId,
      name: r.name,
      status: r.status,
      price: r.price,
      svgMapId: r.svgMapId,
    }))
  }));

  const typedContents = contents.map((c: any) => ({
    key: c.key,
    es: c.es,
    en: c.en,
  }));

  return (
    <HotelAdminClient
      initialProperties={typedProperties}
      initialContents={typedContents}
      user={session.user}
    />
  );
}

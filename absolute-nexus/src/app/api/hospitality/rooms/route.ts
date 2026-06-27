import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

// GET: Fetch properties and rooms (Public)
export async function GET(request: NextRequest) {
  try {
    // Check if properties exist. If not, auto-seed database.
    const propertyCount = await db.hotelProperty.count();
    if (propertyCount === 0) {
      console.log("[Hospitality API] Seeding initial properties and rooms...");
      
      const villaMaria = await db.hotelProperty.create({
        data: {
          name: "Hostal Villa María",
          descriptionEs: "Un hostal acogedor rodeado de colinas y jardines floridos. Perfecto para caminatas y descansar en un ambiente familiar.",
          descriptionEn: "A cozy hostel surrounded by hills and blooming gardens. Perfect for hiking and relaxing in a family atmosphere.",
        }
      });

      const fincaMaria = await db.hotelProperty.create({
        data: {
          name: "Finca María",
          descriptionEs: "Una finca campestre de lujo con piscina privada, establos y senderos ecológicos. La máxima expresión de confort rústico.",
          descriptionEn: "A luxury country estate with a private pool, stables, and ecological trails. The ultimate expression of rustic comfort.",
        }
      });

      // Seed rooms for Hostal Villa María (room-101 to room-106)
      await db.hotelRoom.createMany({
        data: [
          { propertyId: villaMaria.id, name: "Suite Sol", price: 120, status: "AVAILABLE", svgMapId: "room-101" },
          { propertyId: villaMaria.id, name: "Habitación Luna", price: 85, status: "OCCUPIED", svgMapId: "room-102" },
          { propertyId: villaMaria.id, name: "Habitación Estrella", price: 90, status: "AVAILABLE", svgMapId: "room-103" },
          { propertyId: villaMaria.id, name: "Suite Familiar", price: 150, status: "MAINTENANCE", svgMapId: "room-104" },
          { propertyId: villaMaria.id, name: "Habitación Nube", price: 80, status: "AVAILABLE", svgMapId: "room-105" },
          { propertyId: villaMaria.id, name: "Suite Terraza", price: 135, status: "OCCUPIED", svgMapId: "room-106" },
        ]
      });

      // Seed rooms for Finca María (room-201 to room-206)
      await db.hotelRoom.createMany({
        data: [
          { propertyId: fincaMaria.id, name: "Cabaña del Bosque", price: 200, status: "AVAILABLE", svgMapId: "room-201" },
          { propertyId: fincaMaria.id, name: "Cabaña del Río", price: 180, status: "AVAILABLE", svgMapId: "room-202" },
          { propertyId: fincaMaria.id, name: "Cabaña de la Loma", price: 220, status: "OCCUPIED", svgMapId: "room-203" },
          { propertyId: fincaMaria.id, name: "Cabaña Familiar", price: 300, status: "AVAILABLE", svgMapId: "room-204" },
          { propertyId: fincaMaria.id, name: "Refugio Ecológico", price: 150, status: "MAINTENANCE", svgMapId: "room-205" },
          { propertyId: fincaMaria.id, name: "Imperial Finca Suite", price: 350, status: "AVAILABLE", svgMapId: "room-206" },
        ]
      });

      // Seed content texts
      const initialContents = [
        { key: "hero_title", es: "Un Refugio Exclusivo de Tranquilidad", en: "An Exclusive Sanctuary of Tranquility" },
        { key: "hero_desc", es: "Descubre la perfecta armonía entre el lujo rústico y el descanso en nuestras exclusivas propiedades en el campo. Ofrecemos experiencias inigualables en nuestro acogedor hostal o la sofisticada finca privada.", en: "Discover the perfect harmony between rustic luxury and relaxation in our exclusive countryside properties. We offer unmatched experiences in our cozy hostel or the sophisticated private estate." },
        { key: "map_title", es: "Plano Interactivo de Disponibilidad", en: "Interactive Availability Plan" },
        { key: "map_desc", es: "Visualiza el estado de nuestras habitaciones en tiempo real. Haz clic sobre cualquier espacio del plano para ver precios, detalles e iniciar tu reserva ficticia.", en: "View the status of our rooms in real-time. Click on any room space on the plan to view pricing, details, and start your mock reservation." },
        { key: "cta_book", es: "Simular Reserva", en: "Simulate Booking" },
        { key: "btn_view_properties", es: "Ver Propiedades", en: "View Properties" },
        { key: "footer_text", es: "© 2026 Ecosistema Corporativo Absolute Nexus - Módulo de Gestión Hotelera.", en: "© 2026 Absolute Nexus Corporate Ecosystem - Hospitality Management Module." },
      ];

      for (const content of initialContents) {
        await db.hotelContent.upsert({
          where: { key: content.key },
          update: {},
          create: content,
        });
      }
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const query: any = {
      include: {
        rooms: {
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    };

    if (propertyId) {
      query.where = { id: propertyId };
    }

    const properties = await db.hotelProperty.findMany(query);
    return NextResponse.json({ success: true, properties });
  } catch (error: any) {
    console.error("[Hospitality Get Rooms Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new room (Admin Protected)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, name, price, status, svgMapId } = body;

    if (!propertyId || !name || price === undefined || !status || !svgMapId) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 });
    }

    const newRoom = await db.hotelRoom.create({
      data: {
        propertyId,
        name,
        price: parseFloat(price),
        status,
        svgMapId,
      }
    });

    return NextResponse.json({ success: true, room: newRoom });
  } catch (error: any) {
    console.error("[Hospitality Create Room Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update room details or status (Admin Protected)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, price, status, svgMapId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de habitación requerido" }, { status: 400 });
    }

    const updatedRoom = await db.hotelRoom.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(status && { status }),
        ...(svgMapId && { svgMapId }),
      }
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error("[Hospitality Update Room Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a room (Admin Protected)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de habitación requerido" }, { status: 400 });
    }

    await db.hotelRoom.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Habitación eliminada exitosamente" });
  } catch (error: any) {
    console.error("[Hospitality Delete Room Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

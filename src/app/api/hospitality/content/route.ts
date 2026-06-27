import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

// GET: Fetch all editable texts (Public)
export async function GET() {
  try {
    const contents = await db.hotelContent.findMany();
    return NextResponse.json({ success: true, contents });
  } catch (error: any) {
    console.error("[Hospitality Get Content Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Bulk update content translation texts (Admin Protected)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { key, es, en } = body;

    if (!key || es === undefined || en === undefined) {
      return NextResponse.json({ success: false, error: "Clave (key) y traducciones (es, en) requeridas" }, { status: 400 });
    }

    const updatedContent = await db.hotelContent.upsert({
      where: { key },
      update: { es, en },
      create: { key, es, en }
    });

    return NextResponse.json({ success: true, content: updatedContent });
  } catch (error: any) {
    console.error("[Hospitality Update Content Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

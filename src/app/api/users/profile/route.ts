import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("[Profile GET API Error]:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error interno al obtener el perfil.",
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body = await request.json();
    const { name, email, bio } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "El correo electrónico es requerido" }, { status: 400 });
    }

    // 3. Verify email uniqueness
    const emailConflict = await db.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (emailConflict) {
      return NextResponse.json({
        success: false,
        error: "El correo electrónico ya está en uso por otra cuenta."
      }, { status: 400 });
    }

    // 4. Update database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: name || "",
        email,
        bio: bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        image: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("[Profile Update API Error]:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error interno al actualizar el perfil.",
    }, { status: 500 });
  }
}

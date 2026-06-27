import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { compare, hash } from "bcryptjs";

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: "Los campos contraseña actual y nueva contraseña son requeridos."
      }, { status: 400 });
    }

    // 3. Retrieve user and verify current password
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const isPasswordCorrect = await compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({
        success: false,
        error: "La contraseña actual suministrada es incorrecta."
      }, { status: 400 });
    }

    // 4. Hash new password and save
    const hashedPassword = await hash(newPassword, 10);
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente."
    });
  } catch (error: any) {
    console.error("[Security Update API Error]:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error interno al actualizar la contraseña de seguridad.",
    }, { status: 500 });
  }
}

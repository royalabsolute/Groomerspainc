import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // 1. Validar autenticación y rol
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN_GENERAL") {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requiere rol ADMIN_GENERAL." },
        { status: 403 }
      );
    }

    // 2. Obtener datos del cuerpo
    const body = await req.json();
    const { email, name, password, role } = body;

    // Validación básica de campos
    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Los campos email, password y role son requeridos." },
        { status: 400 }
      );
    }

    // 3. Verificar si el usuario ya existe
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico ya está registrado." },
        { status: 400 }
      );
    }

    // 4. Encriptar contraseña
    const hashedPassword = await hash(password, 10);

    // 5. Crear usuario
    const newUser = await db.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role
      }
    });

    return NextResponse.json({
      success: true,
      message: `Usuario '${newUser.name || newUser.email}' creado correctamente con el rol ${role}.`,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error: any) {
    console.error("Error en create user endpoint:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}

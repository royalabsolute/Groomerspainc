import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const adminEmail = "admin@absolutenexus.com";

    // 1. Verificar si el usuario administrador ya existe
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      if ((existingAdmin as any).role !== "ADMIN_GENERAL") {
        await db.user.update({
          where: { id: existingAdmin.id },
          data: { role: "ADMIN_GENERAL" }
        });
      }
      return NextResponse.json({
        success: true,
        message: "El usuario administrador ya existe en el sistema (rol asegurado como ADMIN_GENERAL).",
        user: {
          id: existingAdmin.id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: "ADMIN_GENERAL"
        }
      });
    }

    // 2. Encriptar la contraseña maestra
    const masterPassword = "NexusAdmin2026!";
    const hashedPassword = await hash(masterPassword, 10);

    // 3. Crear el usuario administrador en la base de datos con rol ADMIN_GENERAL
    const newAdmin = await db.user.create({
      data: {
        email: adminEmail,
        name: "Admin General",
        password: hashedPassword,
        role: "ADMIN_GENERAL"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Usuario administrador creado correctamente.",
      credentials: {
        email: adminEmail,
        password: "[PROTEGIDO] Usa 'NexusAdmin2026!' para iniciar sesión",
        role: "ADMIN_GENERAL"
      },
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: "ADMIN_GENERAL"
      }
    });
  } catch (error) {
    console.error("Error en setup endpoint:", error);
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor al inicializar el usuario."
    }, { status: 500 });
  }
}

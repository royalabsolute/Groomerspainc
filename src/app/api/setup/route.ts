import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    console.log("=== INICIANDO CONFIGURACIÓN DE USUARIO MAESTRO (HTTP API) ===");

    // 1. Eliminar TODOS los usuarios existentes
    const deleteResult = await db.user.deleteMany();
    console.log(`Se eliminaron ${deleteResult.count} usuarios existentes de la base de datos.`);

    // 2. Encriptar la contraseña maestra "Mega1321@"
    const plainPassword = "Mega1321@";
    const hashedPassword = await hash(plainPassword, 10);

    // 3. Crear el único usuario maestro
    const masterUser = await db.user.create({
      data: {
        email: "srjaggeroff@gmail.com",
        name: "Master User",
        password: hashedPassword,
        role: "ADMIN_GENERAL" // Se mantiene en la BD por compatibilidad
      }
    });

    console.log(`Usuario maestro creado con éxito a través de API: ${masterUser.email}`);
    
    return NextResponse.json({
      success: true,
      message: "Base de datos reseteada. Usuario maestro creado correctamente.",
      user: {
        id: masterUser.id,
        email: masterUser.email,
        name: masterUser.name,
        role: masterUser.role
      }
    });
  } catch (error: any) {
    console.error("Error en setup endpoint:", error);
    return NextResponse.json({
      success: false,
      error: `Error interno del servidor al inicializar el usuario: ${error.message || error}`
    }, { status: 500 });
  }
}

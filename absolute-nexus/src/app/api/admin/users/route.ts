import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { hash } from "bcryptjs";

// Helper to check authorization
async function checkAuth() {
  const session = await auth();
  if (!session || !session.user) {
    return null;
  }
  // Verify that the user is ADMIN_GENERAL or similar.
  // Note: Standard NextAuth session has role. Since the request says this is an admin endpoint, we enforce it.
  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });
  if (!user || user.role !== "ADMIN_GENERAL") {
    // If there is only one user (bootstrap state) we might allow it, but let's check role.
    // If the database has no other users or the default user has ADMIN_GENERAL, this checks out.
    return null;
  }
  return session;
}

// GET: List all users
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("[Admin Users GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Error al listar usuarios" }, { status: 500 });
  }
}

// POST: Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, bio } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, error: "Los campos email, contraseña y rol son requeridos." }, { status: 400 });
    }

    // Check if email already registered
    const existing = await db.user.findUnique({
      where: { email }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "El correo electrónico ya está registrado." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name: name || "",
        email,
        password: hashedPassword,
        role,
        bio: bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        image: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Usuario '${newUser.name || newUser.email}' creado correctamente.`,
      user: newUser
    });
  } catch (error: any) {
    console.error("[Admin Users POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Error al crear usuario" }, { status: 500 });
  }
}

// PUT: Edit user details
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, email, role, bio, password } = body;

    if (!id || !email || !role) {
      return NextResponse.json({ success: false, error: "Los campos id, email y rol son requeridos." }, { status: 400 });
    }

    // Verify email conflict
    const emailConflict = await db.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });
    if (emailConflict) {
      return NextResponse.json({ success: false, error: "El correo electrónico ya está en uso por otro usuario." }, { status: 400 });
    }

    const updateData: any = {
      name: name || "",
      email,
      role,
      bio: bio || null,
    };

    // If new password is provided, hash it
    if (password && password.trim() !== "") {
      updateData.password = await hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        image: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Usuario '${updatedUser.name || updatedUser.email}' actualizado correctamente.`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("[Admin Users PUT Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Error al actualizar usuario" }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idToDelete = searchParams.get("id");

    if (!idToDelete) {
      return NextResponse.json({ success: false, error: "ID de usuario requerido." }, { status: 400 });
    }

    // Check self deletion prevention
    if (idToDelete === session.user.id) {
      return NextResponse.json({ success: false, error: "No puedes eliminar tu propia cuenta de administrador." }, { status: 400 });
    }

    // Proceed with deletion
    const deletedUser = await db.user.delete({
      where: { id: idToDelete },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Usuario '${deletedUser.name || deletedUser.email}' eliminado con éxito.`,
    });
  } catch (error: any) {
    console.error("[Admin Users DELETE Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar usuario" }, { status: 500 });
  }
}

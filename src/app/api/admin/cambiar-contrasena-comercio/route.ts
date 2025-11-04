import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { username, newPassword } = await req.json();

    // Validaciones
    if (!username || !newPassword) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe y es un comercio
    const userResult = await pool.query(
      "SELECT id, username, roles FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (!user.roles.includes("comercio")) {
      return NextResponse.json(
        { error: "El usuario no es un comercio" },
        { status: 403 }
      );
    }

    // Hash de la nueva contraseña
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = $2",
      [password_hash, username]
    );

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
      username: username,
    });
  } catch (error) {
    console.error("Error cambiando contraseña de comercio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

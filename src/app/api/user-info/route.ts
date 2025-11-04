import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Obtener el DNI del usuario logueado desde las cookies
    const dni = req.cookies.get("dni")?.value;

    if (!dni) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Buscar el usuario en la base de datos
    const result = await pool.query(
      "SELECT nombre, apellido, tipo_usuario FROM personas WHERE dni = $1",
      [dni]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const usuario = result.rows[0];

    return NextResponse.json({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      tipo_usuario: usuario.tipo_usuario,
    });
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener información del usuario" },
      { status: 500 }
    );
  }
}

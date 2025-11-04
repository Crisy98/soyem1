import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const roles = payload.roles as string;
    
    // Verificar que sea un comercio
    if (roles !== 'comercio') {
      return NextResponse.json({ error: "acceso_denegado", message: "Solo comercios pueden acceder" }, { status: 403 });
    }

    const idComercio = payload.idcomercio as number;

    if (!idComercio) {
      return NextResponse.json({ error: "no_comercio", message: "Usuario no tiene comercio asociado" }, { status: 403 });
    }

    // Obtener datos del comercio
    const result = await pool.query(
      "SELECT idcomercio, nombrecomercio FROM comercios WHERE idcomercio = $1",
      [idComercio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "comercio_no_encontrado", message: "Comercio no encontrado" }, { status: 404 });
    }

    const comercio = result.rows[0];

    return NextResponse.json({
      idComercio: comercio.idcomercio,
      nombreComercio: comercio.nombrecomercio,
    });
  } catch (error) {
    console.error("Error obteniendo datos del comercio:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

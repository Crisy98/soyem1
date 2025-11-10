import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface DecodedToken {
  id: number;
  roles: string;
  idafiliado: number;
  idcomercio?: number;
  activo: boolean;
}

export async function GET(req: NextRequest) {
  try {
    // Obtener token
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const decoded = payload as unknown as DecodedToken;

    // Verificar que sea un comercio
    if (decoded.roles !== "comercio") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener el idcomercio del token o de la base de datos
    let idcomercio = decoded.idcomercio;

    if (!idcomercio) {
      // Si no está en el token, buscarlo en la tabla users
      const userResult = await pool.query(
        "SELECT idcomercio FROM users WHERE id = $1",
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
      }
      
      idcomercio = userResult.rows[0].idcomercio;
    }

    // Consultar ventas del comercio
    const result = await pool.query(
      `SELECT 
        m.idmovimiento,
        m.fechacompra,
        m.importe,
        m.cuotas,
        p.nombre as afiliado_nombre,
        p.apellido as afiliado_apellido
       FROM movimientos m
       JOIN afiliados a ON m.idafiliado = a.idafiliado
       JOIN personas p ON a.dni = p.dni
       WHERE m.idcomercio = $1
       ORDER BY m.fechacompra DESC`,
      [idcomercio]
    );

    type VentaRow = {
      importe: number | string | null;
      cuotas: number | string | null;
      [key: string]: unknown;
    };

    const ventas = result.rows.map((row: VentaRow) => ({
      ...row,
      importe: Number(row.importe) || 0,
      cuotas: Number(row.cuotas) || 0,
    }));

    return NextResponse.json({
      idcomercio,
      ventas,
    });
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

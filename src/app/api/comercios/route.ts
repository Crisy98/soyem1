import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
        c.idcomercio,
        c.nombrecomercio,
        c.fechaafiliacion,
        c.calle,
        c.numerocalle,
        c.localidad,
        c.activo,
        c.idrubro,
        c.idusuario,
        json_build_object(
          'idrubro', r.idrubro,
          'nombrerubro', r.nombrerubro
        ) as rubro,
        json_build_object(
          'id', u.id,
          'username', u.username
        ) as usuario
      FROM comercios c
      LEFT JOIN rubros r ON c.idrubro = r.idrubro
      LEFT JOIN users u ON c.idusuario = u.id
      ORDER BY c.nombrecomercio ASC`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo comercios:", err);
    return NextResponse.json(
      { error: "Error obteniendo comercios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      nombrecomercio,
      fechaafiliacion,
      calle,
      numerocalle,
      localidad,
      idrubro,
      idusuario,
    } = data;

    // Validaciones
    if (!nombrecomercio || !fechaafiliacion || !idrubro || !idusuario) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que el rubro existe
    const rubroExists = await pool.query(
      "SELECT idrubro FROM rubros WHERE idrubro = $1",
      [idrubro]
    );

    if (rubroExists.rowCount === 0) {
      return NextResponse.json(
        { error: "El rubro especificado no existe" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userExists = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [idusuario]
    );

    if (userExists.rowCount === 0) {
      return NextResponse.json(
        { error: "El usuario especificado no existe" },
        { status: 400 }
      );
    }

    // Insertar comercio
    const result = await pool.query(
      `INSERT INTO comercios 
        (nombrecomercio, fechaafiliacion, calle, numerocalle, localidad, idrubro, idusuario, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        nombrecomercio,
        fechaafiliacion,
        calle || null,
        numerocalle || null,
        localidad || null,
        idrubro,
        idusuario,
      ]
    );

    return NextResponse.json({
      message: "Comercio creado correctamente",
      comercio: result.rows[0],
    });
  } catch (err) {
    console.error("Error creando comercio:", err);
    return NextResponse.json(
      { error: "Error creando comercio" },
      { status: 500 }
    );
  }
}
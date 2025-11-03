import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
          'username', u.username,
          'roles', u.roles
        ) as usuario
      FROM comercios c
      JOIN rubros r ON c.idrubro = r.idrubro
      JOIN users u ON c.idusuario = u.id
      WHERE c.idcomercio = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error obteniendo detalle de comercio:", err);
    return NextResponse.json(
      { error: "Error obteniendo comercio" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await req.json();
    const {
      nombrecomercio,
      fechaafiliacion,
      calle,
      numerocalle,
      localidad,
      idrubro,
      activo,
    } = data;

    // Validaciones
    if (!nombrecomercio || !fechaafiliacion || !idrubro) {
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

    // Actualizar comercio
    const result = await pool.query(
      `UPDATE comercios 
       SET nombrecomercio = $1, 
           fechaafiliacion = $2, 
           calle = $3, 
           numerocalle = $4, 
           localidad = $5, 
           idrubro = $6,
           activo = $7
       WHERE idcomercio = $8
       RETURNING *`,
      [
        nombrecomercio,
        fechaafiliacion,
        calle || null,
        numerocalle || null,
        localidad || null,
        idrubro,
        activo ?? true,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Comercio actualizado correctamente",
      comercio: result.rows[0],
    });
  } catch (err) {
    console.error("Error actualizando comercio:", err);
    return NextResponse.json(
      { error: "Error actualizando comercio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Soft delete - marcar como inactivo
    const result = await pool.query(
      `UPDATE comercios 
       SET activo = false 
       WHERE idcomercio = $1 
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Comercio marcado como inactivo",
      comercio: result.rows[0],
    });
  } catch (err) {
    console.error("Error eliminando comercio:", err);
    return NextResponse.json(
      { error: "Error eliminando comercio" },
      { status: 500 }
    );
  }
}
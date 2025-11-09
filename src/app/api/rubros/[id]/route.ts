import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET - Obtener un rubro específico
export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const { id } = (context?.params || {}) as { id: string };
    const result = await pool.query(
      "SELECT * FROM rubros WHERE idrubro = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener rubro:", error);
    return NextResponse.json(
      { error: "Error al obtener rubro" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar rubro
export async function PUT(
  req: NextRequest,
  context: any
) {
  try {
    const body = await req.json();
    const { nombrerubro } = body;

    if (!nombrerubro || nombrerubro.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del rubro es requerido" },
        { status: 400 }
      );
    }

    const { id } = (context?.params || {}) as { id: string };
    const result = await pool.query(
      "UPDATE rubros SET nombrerubro = $1 WHERE idrubro = $2 RETURNING *",
      [nombrerubro.trim(), id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar rubro:", error);
    return NextResponse.json(
      { error: "Error al actualizar rubro" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar rubro
export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
    const { id } = (context?.params || {}) as { id: string };
    // Verificar si hay comercios usando este rubro
    const comerciosResult = await pool.query(
      "SELECT COUNT(*) as count FROM comercios WHERE idrubro = $1",
      [id]
    );

    if (parseInt(comerciosResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el rubro porque tiene comercios asociados" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "DELETE FROM rubros WHERE idrubro = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Rubro eliminado correctamente",
      rubro: result.rows[0]
    });
  } catch (error) {
    console.error("Error al eliminar rubro:", error);
    return NextResponse.json(
      { error: "Error al eliminar rubro" },
      { status: 500 }
    );
  }
}

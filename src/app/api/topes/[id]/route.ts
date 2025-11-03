import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET - Obtener un tope específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      "SELECT * FROM topes WHERE idtope = $1",
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Tope no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener tope:", error);
    return NextResponse.json(
      { error: "Error al obtener tope" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tope
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { fecha, importe } = body;

    const result = await pool.query(
      "UPDATE topes SET fecha = $1, importe = $2 WHERE idtope = $3 RETURNING *",
      [fecha, importe, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Tope no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar tope:", error);
    return NextResponse.json(
      { error: "Error al actualizar tope" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tope
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      "DELETE FROM topes WHERE idtope = $1 RETURNING *",
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Tope no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Tope eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar tope:", error);
    return NextResponse.json(
      { error: "Error al eliminar tope" },
      { status: 500 }
    );
  }
}

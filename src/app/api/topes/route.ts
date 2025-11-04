import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET - Obtener todos los topes
export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM topes ORDER BY fecha DESC"
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener topes:", error);
    return NextResponse.json(
      { error: "Error al obtener topes" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo tope
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fecha, importe } = body;

    if (!fecha || !importe) {
      return NextResponse.json(
        { error: "Fecha e importe son requeridos" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "INSERT INTO topes (fecha, importe) VALUES ($1, $2) RETURNING *",
      [fecha, importe]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear tope:", error);
    return NextResponse.json(
      { error: "Error al crear tope" },
      { status: 500 }
    );
  }
}

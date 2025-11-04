import { pool } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface User {
  id: number;
  username: string;
  password_hash: string;
  roles: string;
  idafiliado: number;
  activo: boolean;
  idcomercio?: number; // Obtenido desde JOIN con comercios
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Consultar usuario junto con el estado activo y idcomercio
    const result = await pool.query<User>(
      `SELECT u.id,
              u.username,
              u.password_hash,
              u.roles,
              u.idafiliado,
              COALESCE(a.activo, c.activo, true) as activo,
              c.idcomercio
       FROM users u
       LEFT JOIN afiliados a ON u.idafiliado = a.idafiliado
       LEFT JOIN comercios c ON u.id = c.idusuario
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 401 });
    }

    const user = result.rows[0];

    // Verificar si el afiliado está activo (solo si no es null)
    if (user.activo === false) {
      return new Response(JSON.stringify({ error: "Usuario desactivado" }), { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), { status: 401 });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        roles: user.roles,
        idafiliado: user.idafiliado,
        idcomercio: user.idcomercio || null, // Ahora viene del JOIN con comercios
        activo: user.activo ?? true
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    return new Response(JSON.stringify({ 
      message: "Login exitoso",
      roles: user.roles 
    }), {
      status: 200,
      headers: {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=28800; Secure; SameSite=Strict`,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Error en login" }), { status: 500 });
  }
}

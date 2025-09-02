import { pool } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface User {
  id: number;
  username: string;
  password_hash: string;
  roles: string;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const result = await pool.query<User>(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 401 });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, roles: user.roles },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return new Response(JSON.stringify({ message: "Login exitoso" }), {
      status: 200,
      headers: {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=3600; Secure; SameSite=Strict`,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Error en login" }), { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface DecodedToken {
  id: number;
  roles: string;
  idafiliado: number;
  activo: boolean;
  iat: number;
  exp: number;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // IMPORTANTE: Los logs en middleware no siempre aparecen en desarrollo
  // pero las redirecciones SÍ funcionan
  
  // RUTAS DE ADMIN - Requieren autenticación de administrador
  if (path.startsWith("/admin")) {
    // Permitir acceso al login de admin sin autenticación
    if (path === "/admin/login") {
      // Si ya tiene token válido de admin, redirigir al panel
      if (token) {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          const { payload } = await jwtVerify(token, secret);
          const decoded = payload as unknown as DecodedToken;
          
          if (decoded.roles === "administrador" && decoded.activo) {
            return NextResponse.redirect(new URL("/admin/afiliado", req.url));
          }
        } catch (err) {
          // Token inválido, permitir acceso al login
        }
      }
      const response = NextResponse.next();
      response.headers.set("x-middleware-admin-login", "allowed");
      return response;
    }

    // Para cualquier otra ruta /admin/*, verificar autenticación
    if (!token) {
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.headers.set("x-middleware-redirect-reason", "no-token");
      return response;
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const decoded = payload as unknown as DecodedToken;

      // Verificar que sea administrador y esté activo
      if (decoded.roles !== "administrador" || !decoded.activo) {
        const response = NextResponse.redirect(new URL("/unauthorized", req.url));
        response.cookies.delete("token");
        response.headers.set("x-middleware-redirect-reason", "not-admin");
        return response;
      }

      const response = NextResponse.next();
      response.headers.set("x-middleware-admin-verified", "true");
      return response;
    } catch (err) {
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.delete("token");
      response.headers.set("x-middleware-redirect-reason", "invalid-token");
      return response;
    }
  }

  // Rutas de comercio y afiliado (código existente)
  if (path.startsWith("/comercio") || path.startsWith("/afiliado")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const decoded = payload as unknown as DecodedToken;

      if (path.startsWith("/comercio") && decoded.roles !== "comercio") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      if (path.startsWith("/afiliado") && decoded.roles !== "afiliado" && decoded.roles !== "comercio") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      return NextResponse.next();
    } catch (err) {
      console.error("Error verificando token", err);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

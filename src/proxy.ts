import { NextRequest, NextResponse } from "next/server";
import { puedeAcceder, rutaInicial } from "@/modules/identidad/domain/permisos";
import { verifyClienteToken, verifySessionToken } from "@/modules/identidad/domain/token";
import { SESSION_COOKIE } from "@/modules/identidad/infrastructure/session-cookie";
import { isDevAuthBypass } from "@/modules/identidad/infrastructure/dev-bypass";

const CLIENTE_COOKIE = "cf_cliente";

// APIs que no piden sesión del personal: login, chat, cuentas de clientes y compras de la
// tienda (estas revisan por su cuenta la sesión de cliente o la clave del pedido).
function esApiPublica(pathname: string): boolean {
  return (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/ingresar" ||
    pathname === "/api/chat" ||
    pathname.startsWith("/api/cuenta/") ||
    pathname.startsWith("/api/tienda/")
  );
}

function redirigir(request: NextRequest, pathname: string, volver?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = volver ? `?volver=${encodeURIComponent(volver)}` : "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.JWT_SECRET;

  if (esApiPublica(pathname)) return NextResponse.next();

  // «Mi cuenta» exige sesión de cliente. El checkout admite invitado (la UI ofrece ingresar opcional).
  if (pathname === "/cuenta" || pathname.startsWith("/cuenta/")) {
    const token = request.cookies.get(CLIENTE_COOKIE)?.value;
    const cliente = secret && token ? await verifyClienteToken(token, secret) : null;
    return cliente ? NextResponse.next() : redirigir(request, "/ingresar", pathname);
  }

  const isLoginPage = pathname === "/panel/login" || pathname === "/panel";

  // TEMPORAL (solo dev): con DEV_BYPASS_AUTH=true no se exige sesión en el panel.
  if (isDevAuthBypass()) {
    return isLoginPage ? redirigir(request, "/panel/dashboard") : NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = secret && token ? await verifySessionToken(token, secret) : null;

  if (isLoginPage) {
    return session ? redirigir(request, rutaInicial(session.rol)) : NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "No hay sesión" } }, { status: 401 });
    }
    return redirigir(request, "/ingresar");
  }

  // Cada rol solo entra a sus módulos (tabla en modules/identidad/domain/permisos.ts).
  if (!puedeAcceder(session.rol, pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Tu rol no tiene acceso a esta función" } },
        { status: 403 },
      );
    }
    return redirigir(request, rutaInicial(session.rol));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/api/:path*", "/cuenta", "/cuenta/:path*"],
};

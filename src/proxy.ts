import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/modules/identidad/domain/token";
import { SESSION_COOKIE } from "@/modules/identidad/infrastructure/session-cookie";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/panel/login" || pathname === "/panel";
  const isLoginApi = pathname === "/api/auth/login";

  const secret = process.env.JWT_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = secret && token ? await verifySessionToken(token, secret) : null;

  if (isLoginPage) {
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = "/panel/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isLoginApi) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "No hay sesión" } },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/panel/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/api/:path*"],
};

import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./navigation";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.includes("/login-admin");
  const isAdminPage = req.nextUrl.pathname.includes("/admin");
  
  // Obtener el Hostname de la petición para preparación de multi-dominio
  const host = req.headers.get('host') || '';
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const locale = (segments[0] === "es" || segments[0] === "en") ? segments[0] : "es";

  // =========================================================================
  // SOPORTE MULTI-DOMINIO FUTURO (Comentado para activación posterior):
  // =========================================================================
  /*
  const url = req.nextUrl.clone();
  if (host.includes('villa-maria-hotel.com') || host.includes('finca-maria.com')) {
    // Reescribe la raíz limpia hacia el portal del hotel /hospitality
    url.pathname = `/${locale}/hospitality${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  } else if (host.includes('groomersinc.com')) {
    // Reescribe la raíz limpia hacia el portal de peluquería /groomers
    url.pathname = `/${locale}/groomers${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  */

  // Bloquea estrictamente acceso a /admin si no ha iniciado sesión, redirigiendo a la pantalla de login localizada
  if (isAdminPage && !isLoggedIn) {
    return Response.redirect(new URL(`/${locale}/login-admin`, req.nextUrl.origin));
  }

  // De lo contrario, permite que next-intl maneje la localización y redirección
  return intlMiddleware(req);
});

export const config = {
  // Coincidir con la raíz y rutas localizadas
  matcher: ["/", "/(es|en)/:path*"],
};

import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./navigation";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.includes("/login-admin");
  const isAdminPage = req.nextUrl.pathname.includes("/admin");
  
  // Obtener el Hostname de la petición para enrutamiento multi-dominio activo
  const host = req.headers.get('host') || '';
  const groomersDomain = process.env.NEXT_PUBLIC_GROOMERS_DOMAIN || 'groomersinc.com';
  const hospitalityDomain = process.env.NEXT_PUBLIC_HOSPITALITY_DOMAIN || 'fincamaria.com';

  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const locale = (segments[0] === "es" || segments[0] === "en") ? segments[0] : "es";

  // Reescritura por hostname activa
  if (host.includes(groomersDomain) && !req.nextUrl.pathname.includes('/groomers')) {
    const url = req.nextUrl.clone();
    const cleanPath = (segments[0] === 'es' || segments[0] === 'en')
      ? '/' + segments.slice(1).join('/')
      : url.pathname;

    if (cleanPath === '/') {
      url.pathname = `/${locale}/groomers`;
    } else {
      url.pathname = `/${locale}${cleanPath}`;
    }
    return NextResponse.rewrite(url);
  }

  if (host.includes(hospitalityDomain) && !req.nextUrl.pathname.includes('/hospitality')) {
    const url = req.nextUrl.clone();
    const cleanPath = (segments[0] === 'es' || segments[0] === 'en')
      ? '/' + segments.slice(1).join('/')
      : url.pathname;

    if (cleanPath === '/') {
      url.pathname = `/${locale}/hospitality`;
    } else {
      url.pathname = `/${locale}${cleanPath}`;
    }
    return NextResponse.rewrite(url);
  }

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

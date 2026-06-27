import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.includes("/login-admin");
  const isAdminPage = req.nextUrl.pathname.includes("/admin");

  // Bloquea estrictamente acceso a /admin si no ha iniciado sesión, redirigiendo a la pantalla de login localizada
  if (isAdminPage && !isLoggedIn) {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const locale = (segments[0] === "es" || segments[0] === "en") ? segments[0] : "es";
    return Response.redirect(new URL(`/${locale}/login-admin`, req.nextUrl.origin));
  }

  // De lo contrario, permite que next-intl maneje la localización y redirección
  return intlMiddleware(req);
});

export const config = {
  // Coincidir con la raíz y rutas localizadas
  matcher: ["/", "/(es|en)/:path*"],
};

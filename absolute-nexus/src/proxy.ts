import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  // Redirigir a /login si el usuario no ha iniciado sesión y no está en la página de login
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Redirigir al panel principal (home) si el usuario ya inició sesión y trata de entrar a /login
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

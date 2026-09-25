import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SHIELD_COOKIE_NAME,
  verificarClaveAcceso,
  isTokenValido,
} from "./lib/shieldAuth";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Rutas públicas excluidas de autenticación (Assets estáticos, 3D, WASM, Draco, SVG logos, health check, AR nativo)
  const esRutaPublica =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/site.webmanifest") ||
    pathname.startsWith("/icon-") ||
    pathname.startsWith("/publicidad") ||
    pathname.startsWith("/draco") ||
    pathname.startsWith("/library") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".glb") ||
    pathname.endsWith(".gltf") ||
    pathname.endsWith(".wasm") ||
    pathname.endsWith(".bin") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/ar-model") ||
    pathname.startsWith("/api/bloques") ||
    pathname.startsWith("/api/compute") ||
    pathname.startsWith("/api/metadata") ||
    pathname.startsWith("/api/definitions") ||
    pathname.startsWith("/api/drive") ||
    pathname.startsWith("/api/thumbnail") ||
    pathname.startsWith("/api/compress-glb") ||
    pathname.startsWith("/api/mecanizar-intercomponentes") ||
    pathname.startsWith("/api/export-dxf") ||
    pathname === "/ar" ||
    pathname.startsWith("/ar") ||
    pathname === "/access" ||
    pathname === "/api/access" ||
    pathname.startsWith("/api/shield-toggle");

  // 1.1 Si el blindaje está configurado en modo libre/desactivado (3bf_shield_mode === "disabled")
  const shieldModeCookie = request.cookies.get("3bf_shield_mode")?.value;
  if (shieldModeCookie === "disabled") {
    if (pathname === "/access") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  // 2. Comprobar si viene con la llave secreta en la URL (?key=... o ?auth=...)
  const queryKey =
    searchParams.get("key") ||
    searchParams.get("auth") ||
    searchParams.get("pass") ||
    searchParams.get("token");

  if (queryKey) {
    const authResult = verificarClaveAcceso(queryKey);

    if (authResult.valid && authResult.token && authResult.maxAge) {
      // ✅ Dispositivo autorizado por URL directa
      // Limpiamos los parámetros de la URL para que no quede rastro en la barra de navegación ni historial
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete("key");
      cleanUrl.searchParams.delete("auth");
      cleanUrl.searchParams.delete("pass");
      cleanUrl.searchParams.delete("token");

      if (cleanUrl.pathname === "/access") {
        cleanUrl.pathname = "/";
      }

      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set({
        name: SHIELD_COOKIE_NAME,
        value: authResult.token,
        maxAge: authResult.maxAge,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    } else {
      // Intento con clave inválida por URL -> Redirigir a /access mostrando aviso
      const accessUrl = request.nextUrl.clone();
      accessUrl.pathname = "/access";
      accessUrl.searchParams.delete("key");
      accessUrl.searchParams.delete("auth");
      accessUrl.searchParams.delete("pass");
      accessUrl.searchParams.delete("token");
      accessUrl.searchParams.set("error", "invalid_key");
      return NextResponse.redirect(accessUrl);
    }
  }

  // 3. Comprobar si el navegador ya posee la cookie de dispositivo autorizado
  const authCookie = request.cookies.get(SHIELD_COOKIE_NAME);
  const estaAutorizado = isTokenValido(authCookie?.value);

  if (estaAutorizado) {
    // Si ya está autorizado y visita /access, lo enviamos al configurador principal
    if (pathname === "/access") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  // 4. Si es una ruta técnica pública o la pantalla de login, permitir
  if (esRutaPublica) {
    return NextResponse.next();
  }

  // 5. Para llamadas de API sin autorización, responder 401 Unauthorized
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Acceso no autorizado a la plataforma 3dBimFab. Dispositivo no autenticado." },
      { status: 401 }
    );
  }

  // 6. Para cualquier navegación web de intrusos o desconocidos, redirigir a /access
  const accessUrl = request.nextUrl.clone();
  accessUrl.pathname = "/access";
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto archivos estáticos explícitos
     */
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest).*)",
  ],
};

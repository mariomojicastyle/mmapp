import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url))
  
  // Limpiar todas las cookies de sesión de Supabase y de Next.js
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    })
  }

  return response
}

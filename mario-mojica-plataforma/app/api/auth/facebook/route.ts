import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID || "1736322840851405"
  const redirectUri = "https://mariomojica.com/api/auth/facebook/callback"

  if (!appId || appId.trim() === "") {
    return NextResponse.redirect(
      new URL("/marketing?error=missing_credentials&provider=Meta", request.url)
    )
  }

  // En Apps de Negocios de Meta, no se envía parámetro 'scope' en la URL inicial
  // para usar la configuración nativa de casos de uso de la app.
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )
}

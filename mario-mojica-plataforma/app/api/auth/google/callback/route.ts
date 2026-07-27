import { NextRequest, NextResponse } from "next/server"
import { saveMarketingCuenta } from "@/app/actions/marketing"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/marketing?error=google_auth_failed", request.url)
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://mariomojica.com/api/auth/google/callback"
      : "http://localhost:3003/api/auth/google/callback"

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Faltan credenciales de Google OAuth en .env.local" },
      { status: 500 }
    )
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Error al obtener tokens de Google:", tokens)
      return NextResponse.redirect(
        new URL("/marketing?error=token_exchange_failed", request.url)
      )
    }

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )

    const userInfo = await userResponse.json()

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    await saveMarketingCuenta({
      plataforma: "google_drive",
      cuenta_id_externo: userInfo.id || "google_account",
      nombre_cuenta: userInfo.name || userInfo.email || "Google Account",
      avatar_url: userInfo.picture || null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
      metadatos: { email: userInfo.email, scope: tokens.scope },
    })

    return NextResponse.redirect(
      new URL("/marketing?success=google_connected", request.url)
    )
  } catch (err) {
    console.error("Error en Google OAuth Callback:", err)
    return NextResponse.redirect(
      new URL("/marketing?error=internal_server_error", request.url)
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { saveMarketingCuenta } from "@/app/actions/marketing"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/marketing?error=linkedin_auth_failed", request.url)
    )
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://mariomojica.com/api/auth/linkedin/callback"
      : "http://localhost:3003/api/auth/linkedin/callback"

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Faltan credenciales de LinkedIn en .env.local" },
      { status: 500 }
    )
  }

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error("Error al intercambiar token LinkedIn:", tokens)
      return NextResponse.redirect(
        new URL("/marketing?error=linkedin_token_failed", request.url)
      )
    }

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const profile = await profileRes.json()

    await saveMarketingCuenta({
      plataforma: "linkedin",
      cuenta_id_externo: profile.sub || "linkedin_user",
      nombre_cuenta: profile.name || "LinkedIn Account",
      avatar_url: profile.picture || null,
      access_token: tokens.access_token,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      metadatos: { email: profile.email },
    })

    return NextResponse.redirect(
      new URL("/marketing?success=linkedin_connected", request.url)
    )
  } catch (err) {
    console.error("Error en LinkedIn OAuth Callback:", err)
    return NextResponse.redirect(
      new URL("/marketing?error=internal_server_error", request.url)
    )
  }
}

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://mariomojica.com/api/auth/facebook/callback"
      : "http://localhost:3003/api/auth/facebook/callback"

  if (!appId || appId.trim() === "") {
    return NextResponse.redirect(
      new URL("/marketing?error=missing_credentials&provider=Meta", request.url)
    )
  }

  // Scope estándar compatible para evitar la alerta "Invalid Scopes" en Meta OAuth
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "public_profile",
    response_type: "code",
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )
}

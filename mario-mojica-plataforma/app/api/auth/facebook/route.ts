import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Usamos el App ID principal que ya tiene el flujo de login validado en Meta
  const appId = process.env.FACEBOOK_APP_ID || "1010974468469260"
  const redirectUri = "https://mariomojica.com/api/auth/facebook/callback"

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

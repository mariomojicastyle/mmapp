import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Usamos el App ID 1736322840851405 que está publicado y tiene el Redirect URI guardado
  const appId = process.env.FACEBOOK_APP_ID || "1736322840851405"
  const redirectUri = "https://app.mariomojica.com/api/auth/facebook/callback"

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )
}

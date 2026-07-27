import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID || "1736322840851405"
  const redirectUri = "https://mariomojica.com/api/auth/facebook/callback"

  if (!appId || appId.trim() === "") {
    return NextResponse.redirect(
      new URL("/marketing?error=missing_credentials&provider=Meta", request.url)
    )
  }

  // Scopes oficiales habilitados en la App de Negocios de Meta (Mario Mojica Marketing)
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    response_type: "code",
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )
}

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://mariomojica.com/api/auth/linkedin/callback"
      : "http://localhost:3003/api/auth/linkedin/callback"

  if (!clientId || clientId.trim() === "") {
    return NextResponse.redirect(
      new URL("/marketing?error=missing_credentials&provider=LinkedIn", request.url)
    )
  }

  const scopes = ["openid", "profile", "email", "w_member_social"].join(" ")

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: "linkedin_auth_state",
    scope: scopes,
  })

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  )
}

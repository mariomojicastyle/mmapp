import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://mariomojica.com/api/auth/google/callback"
      : "http://localhost:3003/api/auth/google/callback"

  if (!clientId || clientId.trim() === "") {
    return NextResponse.redirect(
      new URL("/marketing?error=missing_credentials&provider=Google", request.url)
    )
  }

  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "openid",
    "email",
    "profile",
  ].join(" ")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}

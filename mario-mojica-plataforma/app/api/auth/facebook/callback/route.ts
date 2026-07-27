import { NextRequest, NextResponse } from "next/server"
import { saveMarketingCuenta } from "@/app/actions/marketing"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/marketing?error=facebook_auth_failed", request.url)
    )
  }

  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://mariomojica.com/api/auth/facebook/callback"
      : "http://localhost:3003/api/auth/facebook/callback"

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: "Faltan credenciales de Facebook en .env.local" },
      { status: 500 }
    )
  }

  try {
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${code}`
    const tokenRes = await fetch(tokenUrl)
    const tokens = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error("Error al intercambiar token FB:", tokens)
      return NextResponse.redirect(
        new URL("/marketing?error=fb_token_failed", request.url)
      )
    }

    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${tokens.access_token}`
    )
    const meData = await meRes.json()

    // Intentar obtener páginas asociadas y tokens de página
    let pageMetadatos: Record<string, unknown> = { scope: tokens.scope }
    let pageAccessToken = tokens.access_token
    let externalAccountId = meData.id || "fb_user"
    let accountName = meData.name || "Facebook Account"

    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture,instagram_business_account&access_token=${tokens.access_token}`
      )
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        if (pagesData.data && pagesData.data.length > 0) {
          pageMetadatos.paginas = pagesData.data
          const firstPage = pagesData.data[0]
          if (firstPage.access_token) pageAccessToken = firstPage.access_token
          if (firstPage.id) externalAccountId = firstPage.id
          if (firstPage.name) accountName = firstPage.name
        }
      }
    } catch (pageErr) {
      console.warn("No se pudieron obtener páginas en callback FB:", pageErr)
    }

    await saveMarketingCuenta({
      plataforma: "facebook",
      cuenta_id_externo: externalAccountId,
      nombre_cuenta: accountName,
      avatar_url: meData.picture?.data?.url || null,
      access_token: pageAccessToken,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      metadatos: pageMetadatos,
    })

    return NextResponse.redirect(
      new URL("/marketing?success=facebook_connected", request.url)
    )
  } catch (err) {
    console.error("Error en FB OAuth Callback:", err)
    return NextResponse.redirect(
      new URL("/marketing?error=internal_server_error", request.url)
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dezaisaunoumhqpssols.supabase.co"
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_t2GY5165gsl0IAureM6-eQ_eXQxHibt"

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const nowIso = new Date().toISOString()

    // 1. Obtener publicaciones programadas cuya fecha sea menor o igual a AHORA
    const { data: posts, error: postsErr } = await supabase
      .from("marketing_posts")
      .select("*")
      .eq("estado", "programado")
      .lte("fecha_programada", nowIso)

    if (postsErr) throw postsErr

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay publicaciones pendientes por publicar en este minuto.",
        processed: 0,
      })
    }

    // 2. Obtener cuentas conectadas
    const { data: cuentas } = await supabase.from("marketing_cuentas").select("*")
    const cuentasMap = new Map<string, any>()
    if (cuentas) {
      for (const c of cuentas) {
        cuentasMap.set(c.plataforma, c)
      }
    }

    const resultados = []

    // 3. Procesar cada publicación
    for (const post of posts) {
      let errores: string[] = []

      // Marcar como 'publicando' para evitar ejecuciones duplicadas
      await supabase
        .from("marketing_posts")
        .update({ estado: "publicando" })
        .eq("id", post.id)

      const destinos = post.plataformas_destino || []

      // A. Publicar en Facebook Page
      if (destinos.includes("facebook")) {
        const fbCuenta = cuentasMap.get("facebook")
        if (fbCuenta && fbCuenta.access_token) {
          try {
            const pagesRes = await fetch(
              `https://graph.facebook.com/v19.0/me/accounts?access_token=${fbCuenta.access_token}`
            )
            let targetToken = fbCuenta.access_token
            let targetId = fbCuenta.cuenta_id_externo

            if (pagesRes.ok) {
              const pagesData = await pagesRes.json()
              if (pagesData.data && pagesData.data.length > 0) {
                targetToken = pagesData.data[0].access_token || fbCuenta.access_token
                targetId = pagesData.data[0].id || fbCuenta.cuenta_id_externo
              }
            }

            const postFbRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: post.contenido_base,
                access_token: targetToken,
              }),
            })

            const postFbData = await postFbRes.json()
            if (!postFbRes.ok) {
              errores.push(`Facebook: ${postFbData.error?.message || "Error al publicar en Feed"}`)
            }
          } catch (fbErr: any) {
            errores.push(`Facebook Exception: ${fbErr.message}`)
          }
        } else {
          errores.push("Facebook: No hay cuenta conectada")
        }
      }

      // B. Publicar en Instagram Business
      if (destinos.includes("instagram")) {
        const igCuenta = cuentasMap.get("instagram") || cuentasMap.get("facebook")
        const igId = igCuenta?.metadatos?.instagram_business_account?.id

        if (igCuenta && igCuenta.access_token && igId) {
          try {
            const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                caption: post.contenido_base,
                access_token: igCuenta.access_token,
              }),
            })

            const mediaData = await mediaRes.json()
            if (mediaRes.ok && mediaData.id) {
              const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  creation_id: mediaData.id,
                  access_token: igCuenta.access_token,
                }),
              })
              const publishData = await publishRes.json()
              if (!publishRes.ok) {
                errores.push(`Instagram Publish: ${publishData.error?.message || "Error al publicar en Instagram"}`)
              }
            } else {
              errores.push(`Instagram Media: ${mediaData.error?.message || "Error al crear media container en Instagram"}`)
            }
          } catch (igErr: any) {
            errores.push(`Instagram Exception: ${igErr.message}`)
          }
        } else {
          errores.push("Instagram: Falta cuenta conectada o vinculación Business con la página de Facebook")
        }
      }

      // C. Publicar en LinkedIn
      if (destinos.includes("linkedin")) {
        const liCuenta = cuentasMap.get("linkedin")
        if (liCuenta && liCuenta.access_token) {
          try {
            const authorUrn = `urn:li:person:${liCuenta.cuenta_id_externo}`
            const liRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${liCuenta.access_token}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
              },
              body: JSON.stringify({
                author: authorUrn,
                lifecycleState: "PUBLISHED",
                specificContent: {
                  "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                      text: post.contenido_base,
                    },
                    shareMediaCategory: "NONE",
                  },
                },
                visibility: {
                  "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
                },
              }),
            })

            const liData = await liRes.json()
            if (!liRes.ok) {
              errores.push(`LinkedIn: ${liData.message || "Error al publicar en LinkedIn"}`)
            }
          } catch (liErr: any) {
            errores.push(`LinkedIn Exception: ${liErr.message}`)
          }
        } else {
          errores.push("LinkedIn: No hay cuenta conectada")
        }
      }

      // Actualizar estado final del post en Supabase estrictamente
      if (errores.length === 0) {
        await supabase
          .from("marketing_posts")
          .update({
            estado: "publicado",
            publicado_at: new Date().toISOString(),
            error_mensaje: null,
          })
          .eq("id", post.id)

        resultados.push({ id: post.id, titulo: post.titulo, estado: "publicado", errores: [] })
      } else {
        await supabase
          .from("marketing_posts")
          .update({
            estado: "fallido",
            error_mensaje: errores.join(" | "),
          })
          .eq("id", post.id)

        resultados.push({ id: post.id, titulo: post.titulo, estado: "fallido", errores })
      }
    }

    return NextResponse.json({
      success: true,
      processed: posts.length,
      resultados,
    })
  } catch (err: any) {
    console.error("Error en API /api/marketing/publish:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

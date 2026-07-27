import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Falta configuración de Supabase URL o Service Role Key")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Convierte DataURL o Base64 a una URL pública HTTPS alojada en Supabase Storage
async function ensurePublicImageUrl(supabase: any, imageStr: string): Promise<string | null> {
  if (!imageStr || typeof imageStr !== "string") return null
  const trimmed = imageStr.trim()

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  if (trimmed.startsWith("data:image/")) {
    try {
      const matches = trimmed.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
      if (!matches) return null
      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, "base64")
      const ext = mimeType.split("/")[1] || "jpeg"
      const fileName = `post_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("marketing-media")
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadErr) {
        console.error("Error al subir imagen a Supabase Storage:", uploadErr)
        return null
      }

      const { data: publicUrlData } = supabase.storage
        .from("marketing-media")
        .getPublicUrl(fileName)

      return publicUrlData?.publicUrl || null
    } catch (err) {
      console.error("Excepción en ensurePublicImageUrl:", err)
      return null
    }
  }

  return null
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

      // Extraer imágenes asociadas al post
      let rawImages: string[] = []
      if (Array.isArray(post.drive_file_ids) && post.drive_file_ids.length > 0) {
        rawImages = post.drive_file_ids.filter((u: string) => typeof u === "string" && u.trim().length > 0)
      }
      if (rawImages.length === 0 && Array.isArray(post.overrides_redes?.archivos_detalles)) {
        rawImages = post.overrides_redes.archivos_detalles
          .map((f: any) => f.thumbnailUrl || f.webContentLink)
          .filter(Boolean)
      }

      // Convertir todas las imágenes Base64 / DataURL a URLs públicas HTTPS en Supabase Storage
      const publicImageUrls: string[] = []
      for (const rawImg of rawImages) {
        const pUrl = await ensurePublicImageUrl(supabase, rawImg)
        if (pUrl) publicImageUrls.push(pUrl)
      }

      // A. Publicar en Facebook Page
      if (destinos.includes("facebook")) {
        const fbCuenta = cuentasMap.get("facebook")
        if (fbCuenta && fbCuenta.access_token) {
          try {
            let targetToken = fbCuenta.access_token
            let targetId = "1219474691249252"

            // Intentar obtener Token de Página dinámico si el token almacenado es de Usuario
            const pageRes = await fetch(
              `https://graph.facebook.com/v19.0/1219474691249252?fields=access_token,name,id,instagram_business_account&access_token=${fbCuenta.access_token}`
            )
            if (pageRes.ok) {
              const pageData = await pageRes.json()
              if (pageData.access_token) {
                targetToken = pageData.access_token
              }
              if (pageData.id) {
                targetId = pageData.id
              }
            }

            if (publicImageUrls.length === 0) {
              // Publicación de solo texto
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
            } else if (publicImageUrls.length === 1) {
              // Publicación con 1 foto
              const postFbRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: publicImageUrls[0],
                  caption: post.contenido_base,
                  access_token: targetToken,
                }),
              })
              const postFbData = await postFbRes.json()
              if (!postFbRes.ok) {
                errores.push(`Facebook Photos: ${postFbData.error?.message || "Error al publicar foto"}`)
              }
            } else {
              // Publicación de carrusel (Múltiples fotos)
              const photoIds: string[] = []
              for (const imgUrl of publicImageUrls) {
                const uploadPhotoRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/photos`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: imgUrl,
                    published: false,
                    access_token: targetToken,
                  }),
                })
                const photoData = await uploadPhotoRes.json()
                if (uploadPhotoRes.ok && photoData.id) {
                  photoIds.push(photoData.id)
                }
              }

              if (photoIds.length > 0) {
                const attachedMedia = photoIds.map((id) => ({ media_fbid: id }))
                const postFbRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/feed`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message: post.contenido_base,
                    attached_media: attachedMedia,
                    access_token: targetToken,
                  }),
                })
                const postFbData = await postFbRes.json()
                if (!postFbRes.ok) {
                  errores.push(`Facebook Multi-photo: ${postFbData.error?.message || "Error al publicar carrusel"}`)
                }
              } else {
                errores.push("Facebook: No se pudieron procesar las imágenes del carrusel")
              }
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

        if (igCuenta && igCuenta.access_token) {
          try {
            let targetIgId = igCuenta?.metadatos?.instagram_business_account?.id

            // Si no estaba en metadatos, consultar a la Graph API por el id de la cuenta conectada
            if (!targetIgId) {
              const pageIgRes = await fetch(
                `https://graph.facebook.com/v19.0/1219474691249252?fields=instagram_business_account&access_token=${igCuenta.access_token}`
              )
              if (pageIgRes.ok) {
                const pageIgData = await pageIgRes.json()
                if (pageIgData.instagram_business_account?.id) {
                  targetIgId = pageIgData.instagram_business_account.id
                }
              }
            }

            if (publicImageUrls.length > 0 && targetIgId) {
              // Instagram requiere una imagen/video público
              const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${targetIgId}/media`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image_url: publicImageUrls[0],
                  caption: post.contenido_base,
                  access_token: igCuenta.access_token,
                }),
              })

              const mediaData = await mediaRes.json()
              if (mediaRes.ok && mediaData.id) {
                // Esperar 3.5 segundos a que Instagram procese el contenedor de imagen en CDN
                await new Promise((resolve) => setTimeout(resolve, 3500))

                const publishRes = await fetch(`https://graph.facebook.com/v19.0/${targetIgId}/media_publish`, {
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
            } else if (!targetIgId) {
              errores.push("Instagram: La página de Facebook no tiene vinculada una cuenta de Instagram Business")
            }
          } catch (igErr: any) {
            errores.push(`Instagram Exception: ${igErr.message}`)
          }
        } else {
          errores.push("Instagram: Falta cuenta conectada")
        }
      }

      // C. Publicar en LinkedIn
      if (destinos.includes("linkedin")) {
        const liCuenta = cuentasMap.get("linkedin")
        if (liCuenta && liCuenta.access_token) {
          try {
            const authorUrn = `urn:li:person:${liCuenta.cuenta_id_externo}`

            const shareContentObj: any = {
              shareCommentary: {
                text: post.contenido_base,
              },
              shareMediaCategory: publicImageUrls.length > 0 ? "ARTICLE" : "NONE",
            }

            if (publicImageUrls.length > 0) {
              shareContentObj.media = [
                {
                  status: "READY",
                  originalUrl: publicImageUrls[0],
                  title: {
                    text: post.titulo || "Mario Mojica - Smart Assembly 3D",
                  },
                },
              ]
            }

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
                  "com.linkedin.ugc.ShareContent": shareContentObj,
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

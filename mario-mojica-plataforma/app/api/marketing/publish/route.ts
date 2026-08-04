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

// Sube un archivo directamente como un activo nativo a la API de LinkedIn (v2 Assets & UGC)
async function uploadLinkedInMediaAsset(accessToken: string, authorUrn: string, mediaStr: string, isVideo: boolean): Promise<string | null> {
  try {
    let buffer: Buffer | null = null
    let contentType = isVideo ? "video/mp4" : "image/jpeg"

    if (mediaStr.startsWith("data:")) {
      const matches = mediaStr.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        contentType = matches[1]
        buffer = Buffer.from(matches[2], "base64")
      }
    } else if (mediaStr.startsWith("http://") || mediaStr.startsWith("https://")) {
      const res = await fetch(mediaStr)
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer()
        buffer = Buffer.from(arrayBuf)
        const cType = res.headers.get("content-type")
        if (cType) contentType = cType
      }
    }

    if (!buffer) return null

    const recipe = isVideo ? "urn:li:digitalmediaRecipe:feedshare-video" : "urn:li:digitalmediaRecipe:feedshare-image"

    // Step 1: Register Upload
    const regRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: [recipe],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    })

    const regData = await regRes.json()
    if (!regRes.ok) {
      console.error("Error en LinkedIn registerUpload:", regData)
      return null
    }

    const uploadUrl = regData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl
    const assetUrn = regData.value?.asset

    if (!uploadUrl || !assetUrn) return null

    // Step 2: Upload Binary Payload
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
      },
      body: new Uint8Array(buffer),
    })

    if (uploadRes.ok) {
      return assetUrn
    } else {
      console.error("Error al subir binario a LinkedIn uploadUrl:", uploadRes.statusText)
      return null
    }
  } catch (err) {
    console.error("Excepción en uploadLinkedInMediaAsset:", err)
    return null
  }
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

      // Evaluar si es video
      const isVideo = Array.isArray(post.overrides_redes?.archivos_detalles) &&
        post.overrides_redes.archivos_detalles.some((f: any) => f.mimeType?.startsWith("video/") || f.name?.endsWith(".mp4"))

      // Convertir todas las imágenes/videos Base64 / DataURL a URLs públicas HTTPS en Supabase Storage
      const publicImageUrls: string[] = []
      for (const rawImg of rawImages) {
        const pUrl = await ensurePublicImageUrl(supabase, rawImg)
        if (pUrl) publicImageUrls.push(pUrl)
      }

      const overrides = post.overrides_redes || {}
      const publicadasExitosamente = Array.isArray(overrides.publicado_plataformas)
        ? (overrides.publicado_plataformas as string[])
        : []

      // A. Publicar en Facebook Page
      if (destinos.includes("facebook") && !publicadasExitosamente.includes("facebook")) {
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

            const primerComentario = post.overrides_redes?.primer_comentario

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
              } else if (primerComentario && postFbData.id) {
                // Publicar Primer Comentario Automático en Facebook
                await fetch(`https://graph.facebook.com/v19.0/${postFbData.id}/comments`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message: primerComentario, access_token: targetToken }),
                }).catch(() => {})
              }
            } else if (isVideo) {
              // Publicación de video en Facebook
              const postFbRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/videos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  file_url: publicImageUrls[0],
                  description: post.contenido_base,
                  access_token: targetToken,
                }),
              })
              const postFbData = await postFbRes.json()
              if (!postFbRes.ok) {
                errores.push(`Facebook Video: ${postFbData.error?.message || "Error al publicar video"}`)
              } else if (primerComentario && postFbData.id) {
                await fetch(`https://graph.facebook.com/v19.0/${postFbData.id}/comments`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message: primerComentario, access_token: targetToken }),
                }).catch(() => {})
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
              } else if (primerComentario && (postFbData.post_id || postFbData.id)) {
                // Publicar Primer Comentario Automático en la foto de Facebook
                const targetPostId = postFbData.post_id || postFbData.id
                await fetch(`https://graph.facebook.com/v19.0/${targetPostId}/comments`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message: primerComentario, access_token: targetToken }),
                }).catch(() => {})
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
                } else if (primerComentario && postFbData.id) {
                  await fetch(`https://graph.facebook.com/v19.0/${postFbData.id}/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: primerComentario, access_token: targetToken }),
                  }).catch(() => {})
                }
              } else {
                errores.push("Facebook: No se pudieron procesar las imágenes del carrusel")
              }
            }

            // Si se publicó con éxito sin errores, guardar estado
            if (errores.filter(e => e.startsWith("Facebook")).length === 0) {
              publicadasExitosamente.push("facebook")
              await supabase
                .from("marketing_posts")
                .update({
                  overrides_redes: {
                    ...overrides,
                    publicado_plataformas: publicadasExitosamente
                  }
                })
                .eq("id", post.id)
            }
          } catch (fbErr: any) {
            errores.push(`Facebook Exception: ${fbErr.message}`)
          }
        } else {
          errores.push("Facebook: No hay cuenta conectada")
        }
      }

      // B. Publicar en Instagram Business
      if (destinos.includes("instagram") && !publicadasExitosamente.includes("instagram")) {
        const igCuenta = cuentasMap.get("instagram") || cuentasMap.get("facebook")
        const primerComentario = post.overrides_redes?.primer_comentario

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
              let mediaId = ""
              let createErr = ""

              if (isVideo) {
                // Crear contenedor para Reel/Video
                const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${targetIgId}/media`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    media_type: "REELS",
                    video_url: publicImageUrls[0],
                    caption: post.contenido_base,
                    access_token: igCuenta.access_token,
                  }),
                })
                const mediaData = await mediaRes.json()
                if (mediaRes.ok && mediaData.id) {
                  mediaId = mediaData.id
                } else {
                  createErr = mediaData.error?.message || "Error al crear contenedor de video en Instagram"
                }
              } else {
                // Crear contenedor para foto
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
                  mediaId = mediaData.id
                } else {
                  createErr = mediaData.error?.message || "Error al crear contenedor de imagen en Instagram"
                }
              }

              if (mediaId) {
                // Polling de procesamiento de video para Instagram
                let status = "IN_PROGRESS"
                let attempts = 0
                const maxAttempts = 10

                while (status === "IN_PROGRESS" && attempts < maxAttempts && isVideo) {
                  await new Promise((resolve) => setTimeout(resolve, 5000)) // Esperar 5s
                  attempts++
                  try {
                    const statusRes = await fetch(
                      `https://graph.facebook.com/v19.0/${mediaId}?fields=status_code&access_token=${igCuenta.access_token}`
                    )
                    if (statusRes.ok) {
                      const statusData = await statusRes.json()
                      status = statusData.status_code || "IN_PROGRESS"
                    }
                  } catch (e) {
                    console.error("Error al consultar estado de procesamiento en Instagram:", e)
                  }
                }

                if (!isVideo) {
                  // Pequeño delay de cortesía para fotos
                  await new Promise((resolve) => setTimeout(resolve, 3500))
                  status = "FINISHED"
                }

                if (status === "FINISHED" || status === "READY") {
                  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${targetIgId}/media_publish`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      creation_id: mediaId,
                      access_token: igCuenta.access_token,
                    }),
                  })
                  const publishData = await publishRes.json()
                  if (!publishRes.ok) {
                    errores.push(`Instagram Publish: ${publishData.error?.message || "Error al publicar en Instagram"}`)
                  } else if (primerComentario && publishData.id) {
                    // Publicar Primer Comentario Automático en Instagram Business
                    await fetch(`https://graph.facebook.com/v19.0/${publishData.id}/comments`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ message: primerComentario, access_token: igCuenta.access_token }),
                    }).catch(() => {})
                  }
                } else {
                  errores.push(`Instagram: El procesamiento del video expiró o falló con estado ${status}`)
                }
              } else {
                errores.push(`Instagram Media: ${createErr}`)
              }
            } else if (!targetIgId) {
              errores.push("Instagram: La página de Facebook no tiene vinculada una cuenta de Instagram Business")
            }

            // Si se publicó con éxito sin errores, guardar estado
            if (errores.filter(e => e.startsWith("Instagram")).length === 0) {
              publicadasExitosamente.push("instagram")
              await supabase
                .from("marketing_posts")
                .update({
                  overrides_redes: {
                    ...overrides,
                    publicado_plataformas: publicadasExitosamente
                  }
                })
                .eq("id", post.id)
            }
          } catch (igErr: any) {
            errores.push(`Instagram Exception: ${igErr.message}`)
          }
        } else {
          errores.push("Instagram: Falta cuenta conectada")
        }
      }

      // C. Publicar en LinkedIn
      if (destinos.includes("linkedin") && !publicadasExitosamente.includes("linkedin")) {
        const liCuenta = cuentasMap.get("linkedin")
        const primerComentario = post.overrides_redes?.primer_comentario

        if (liCuenta && liCuenta.access_token) {
          try {
            const authorUrn = `urn:li:person:${liCuenta.cuenta_id_externo}`
            const linkedInAssetUrns: string[] = []

            // Subir imágenes/videos nativos directamente a los servidores de LinkedIn
            if (rawImages.length > 0) {
              for (const rawImg of rawImages) {
                const assetUrn = await uploadLinkedInMediaAsset(liCuenta.access_token, authorUrn, rawImg, isVideo)
                if (assetUrn) linkedInAssetUrns.push(assetUrn)
              }
            }

            const shareContentObj: any = {
              shareCommentary: {
                text: post.contenido_base,
              },
              shareMediaCategory: linkedInAssetUrns.length > 0 ? (isVideo ? "VIDEO" : "IMAGE") : "NONE",
            }

            if (linkedInAssetUrns.length > 0) {
              shareContentObj.media = linkedInAssetUrns.map((urn) => ({
                status: "READY",
                media: urn,
                title: {
                  text: post.titulo || "Mario Mojica - Smart Assembly 3D",
                },
              }))
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
            } else {
              // Publicar Primer Comentario Automático si está configurado
              const shareUrn = liRes.headers.get("x-restli-id") || liData.id
              if (primerComentario && shareUrn) {
                try {
                  await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(shareUrn)}/comments`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${liCuenta.access_token}`,
                      "Content-Type": "application/json",
                      "X-Restli-Protocol-Version": "2.0.0",
                    },
                    body: JSON.stringify({
                      actor: authorUrn,
                      message: { text: primerComentario },
                    }),
                  })
                } catch (cErr) {
                  console.error("Error al publicar primer comentario en LinkedIn:", cErr)
                }
              }
            }

            // Si se publicó con éxito sin errores, guardar estado
            if (errores.filter(e => e.startsWith("LinkedIn")).length === 0) {
              publicadasExitosamente.push("linkedin")
              await supabase
                .from("marketing_posts")
                .update({
                  overrides_redes: {
                    ...overrides,
                    publicado_plataformas: publicadasExitosamente
                  }
                })
                .eq("id", post.id)
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

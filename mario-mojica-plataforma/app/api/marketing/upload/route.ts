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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const contentType = request.headers.get("content-type") || ""

    let buffer: Buffer
    let mimeType = "image/jpeg"
    let ext = "jpg"

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
      }
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      mimeType = file.type || "image/jpeg"
      ext = mimeType.split("/")[1] || "jpg"
    } else {
      const json = await request.json()
      const dataUrl = json.dataUrl
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        return NextResponse.json({ error: "Formato de imagen inválido" }, { status: 400 })
      }
      const matches = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json({ error: "DataURL malformado" }, { status: 400 })
      }
      mimeType = matches[1]
      buffer = Buffer.from(matches[2], "base64")
      ext = mimeType.split("/")[1] || "jpg"
    }

    const fileName = `post_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from("marketing-media")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadErr) {
      console.error("Error al subir archivo a Supabase Storage:", uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from("marketing-media")
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData?.publicUrl || null
    if (!publicUrl) {
      return NextResponse.json({ error: "No se pudo obtener la URL pública" }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err: any) {
    console.error("Excepción en API /api/marketing/upload:", err)
    return NextResponse.json({ error: err.message || "Error al procesar la subida" }, { status: 500 })
  }
}

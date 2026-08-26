import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      imageBase64,
      motor = "fal_nano_banana_pro",
      aspectRatio = "1:1",
      apiKey: clientApiKey,
      falApiKey: clientFalKey,
      muebleNombre = "Mueble 3DBimFab",
    } = body;

    const falKey =
      body.falKey ||
      body.falApiKey ||
      body.clientFalKey ||
      body.fal_key ||
      process.env.FAL_KEY ||
      process.env.FAL_API_KEY ||
      "";

    const geminiKey =
      body.apiKey ||
      body.geminiKey ||
      body.geminiApiKey ||
      body.clientApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      "";

    const byteplusKey =
      body.byteplusKey ||
      body.byteplusApiKey ||
      body.arkApiKey ||
      process.env.BYTEPLUS_API_KEY ||
      process.env.ARK_API_KEY ||
      "";

    const byteplusModel =
      body.byteplusModel ||
      process.env.BYTEPLUS_MODEL ||
      "seedream-4-5-251128";

    let finalImageUrl = "";
    let motorEfectivo = motor;
    let errorDetalle = "";

    // Limpiar prompt de cualquier texto basura residual
    let cleanPrompt = typeof prompt === "string"
      ? prompt.trim()
          .replace(/^make a photo of the man driving the car down the california coastlin/i, "")
          .replace(/^make a photo of/i, "")
          .trim()
      : "";

    // Normalizar aspect ratio
    let falRatio = "1:1";
    if (aspectRatio === "16:9") falRatio = "16:9";
    else if (aspectRatio === "9:16") falRatio = "9:16";
    else if (aspectRatio === "4:3") falRatio = "4:3";

    // =========================================================================
    // 0. ACCIÓN: MEJORAR IMAGEN CON PHOTA ENHANCE (fal-ai/phota/enhance)
    // =========================================================================
    if (body.action === "enhance" || motor === "fal_phota_enhance") {
      const sourceImage = body.imageUrl || imageBase64;
      if (!sourceImage) {
        return NextResponse.json(
          { error: "Se requiere la imagen que deseas mejorar con Phota." },
          { status: 400 }
        );
      }
      if (!falKey) {
        return NextResponse.json(
          { error: "Se requiere la API Key de fal.ai para mejorar con Phota Enhance." },
          { status: 400 }
        );
      }

      try {
        const enhanceRes = await fetch("https://fal.run/fal-ai/phota/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${falKey}`,
          },
          body: JSON.stringify({
            image_url: sourceImage,
          }),
        });

        if (enhanceRes.ok) {
          const enhData = await enhanceRes.json();
          const remoteUrl = enhData?.images?.[0]?.url || enhData?.image?.url;
          if (remoteUrl) {
            const imgFetch = await fetch(remoteUrl);
            if (imgFetch.ok) {
              const buf = await imgFetch.arrayBuffer();
              finalImageUrl = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
            } else {
              finalImageUrl = remoteUrl;
            }
            return NextResponse.json({
              success: true,
              imageUrl: finalImageUrl,
              motorUsado: "fal_phota_enhance",
              aspectRatio,
              promptUsado: body.prompt || cleanPrompt || "Phota 4K Image Enhancement",
            });
          }
        } else {
          const errText = await enhanceRes.text();
          throw new Error(`Error Phota Enhance (${enhanceRes.status}): ${errText}`);
        }
      } catch (enhErr: any) {
        console.error("[3BF Phota Enhance Error]:", enhErr);
        return NextResponse.json(
          { error: `Error mejorando imagen con Phota: ${enhErr.message || "Fallo en el servicio."}` },
          { status: 500 }
        );
      }
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "El prompt es obligatorio para generar el render." },
        { status: 400 }
      );
    }

    // =========================================================================
    // 1. MOTOR BYTEPLUS SEEDREAM 5.0 (ByteDance ModelArk - 2K Ultra HD)
    // =========================================================================
    if ((motor === "byteplus_seedream" || motor === "byteplus" || (!finalImageUrl && byteplusKey && motor !== "google_gemini_imagen3")) && byteplusKey) {
      try {
        let sizeFormatted = "2K";
        if (aspectRatio === "16:9") sizeFormatted = "2K";
        else if (aspectRatio === "9:16") sizeFormatted = "2K";
        else sizeFormatted = "2K";

        const esFondoBlanco = /fondo blanco|white background|cyclorama|aislado|estudio blanco|catalogo blanco|isolated on pure white/i.test(cleanPrompt);
        
        let promptByteplus = "";
        if (esFondoBlanco) {
          promptByteplus = `Commercial high-end product catalog photography of the exact 3D furniture piece provided in the reference image (image_urls[0]), isolated and perfectly centered on a seamless pure white studio cyclorama background (#FFFFFF). STRICT REQUIREMENT: Maintain 100% of the exact geometry, shape, proportions, parts, cushions, drawers, handles, and material tone from the input reference image without adding, deleting or altering any furniture parts. Refined tactile physical materials, realistic softbox studio lighting with soft diffuse natural contact shadows under the base and legs. 8k Herman Miller / Vitra catalog photograph. Instructions: ${cleanPrompt}`;
        } else {
          promptByteplus = `Editorial architectural photography shot on 35mm lens, f/2.8 aperture. High-end catalog photograph of the attached custom furniture piece from the reference image (image_urls[0]), preserving 100% of its exact geometry, proportion, drawer structure, handles, and material finish. Place it seamlessly in: ${cleanPrompt}. Soft natural daylight from a side window, subtle atmospheric reflections, tangible tactile matte wood/paint texture, soft natural floor contact shadows, Architectural Digest quality, perfectly realistic.`;
        }

        const bpPayload: any = {
          model: byteplusModel,
          prompt: promptByteplus,
          response_format: "url",
          size: sizeFormatted,
          stream: false,
          watermark: false
        };

        if (imageBase64 && typeof imageBase64 === "string" && imageBase64.startsWith("data:image")) {
          bpPayload.image_urls = [imageBase64];
        }

        const bpRes = await fetch("https://ark.ap-southeast.bytepluses.com/api/v3/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${byteplusKey}`
          },
          body: JSON.stringify(bpPayload)
        });

        if (bpRes.ok) {
          const bpData = await bpRes.json();
          const remoteUrl = bpData?.data?.[0]?.url || bpData?.data?.[0]?.image_url || bpData?.data?.[0]?.b64_json;
          if (remoteUrl) {
            finalImageUrl = remoteUrl.startsWith("http") ? remoteUrl : `data:image/jpeg;base64,${remoteUrl}`;
            motorEfectivo = "byteplus_seedream";
            console.log("[3BF Render IA] BytePlus URL generada con éxito:", remoteUrl.substring(0, 100));
          } else {
            errorDetalle = "BytePlus no devolvió una URL válida de imagen.";
          }
        } else {
          const bpErrText = await bpRes.text();
          console.warn("[3BF Render IA BytePlus Error]:", bpErrText);
          errorDetalle = `BytePlus ModelArk (${bpRes.status}): ${bpErrText}`;
        }
      } catch (bpErr: any) {
        console.error("[3BF Render IA BytePlus Exception]:", bpErr);
        errorDetalle = bpErr?.message || "Fallo en BytePlus ModelArk";
      }
    }

    // =========================================================================
    // 2. MOTOR GOOGLE GEMINI 1.5 PRO / FLASH + IMAGEN 3 (Google AI Studio Nativo)
    // =========================================================================
    if (!finalImageUrl && (motor === "google_gemini_imagen3" || motor === "google_gemini" || (!falKey && geminiKey)) && geminiKey) {
      try {
        // Formato para Imagen 3 en Google AI Studio (1:1, 16:9, 4:3, 9:16)
        let imagen3Ratio = "1:1";
        if (aspectRatio === "16:9") imagen3Ratio = "16:9";
        else if (aspectRatio === "9:16") imagen3Ratio = "9:16";
        else if (aspectRatio === "4:3") imagen3Ratio = "4:3";

        // Paso A: Análisis Multimodal con Gemini 1.5 Flash para extraer detalles del mueble
        let promptEnriquecido = cleanPrompt;
        if (imageBase64 && typeof imageBase64 === "string" && imageBase64.includes("base64,")) {
          const rawBase64 = imageBase64.split("base64,")[1];
          const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/png";

          try {
            const geminiAnalisisRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: `You are an expert architectural and commercial furniture photographer. Analyze the 3D furniture piece in this reference image (exact geometric shape, wood species/color, drawer layout, handles, proportions). Create a concise, hyper-realistic, high-end photography prompt in English for Imagen 3 that places EXACTLY this custom furniture piece in the scene: "${cleanPrompt}". STRICT REQUIREMENT: Maintain 100% of the furniture's exact geometry and materials, photorealistic studio/ambient lighting, soft contact shadows on the floor, 8k resolution, Architectural Digest aesthetic.`
                        },
                        {
                          inline_data: {
                            mime_type: mimeType,
                            data: rawBase64
                          }
                        }
                      ]
                    }
                  ],
                  generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 300
                  }
                })
              }
            );

            if (geminiAnalisisRes.ok) {
              const gData = await geminiAnalisisRes.json();
              const visionPrompt = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (visionPrompt && visionPrompt.length > 20) {
                promptEnriquecido = visionPrompt.trim();
              }
            }
          } catch (gErr) {
            console.warn("[3BF Render IA] Advertencia en visión Gemini:", gErr);
          }
        }

        // Paso B: Generación Fotorrealista con Google Imagen 3 (imagen-3.0-generate-002)
        const imagen3Res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [
                {
                  prompt: promptEnriquecido
                }
              ],
              parameters: {
                sampleCount: 1,
                aspectRatio: imagen3Ratio,
                personGeneration: "ALLOW_ADULT",
                safetySetting: "BLOCK_MEDIUM_AND_ABOVE"
              }
            })
          }
        );

        if (imagen3Res.ok) {
          const img3Data = await imagen3Res.json();
          const b64Pred = img3Data?.predictions?.[0]?.bytesBase64Encoded;
          const mimeTypeOut = img3Data?.predictions?.[0]?.mimeType || "image/jpeg";
          if (b64Pred) {
            finalImageUrl = `data:${mimeTypeOut};base64,${b64Pred}`;
            motorEfectivo = "google_gemini_imagen3";
          }
        } else {
          const img3ErrText = await imagen3Res.text();
          console.warn("[3BF Render IA] Imagen 3 error, intentando respaldo con Fal/Pollinations:", img3ErrText);
          errorDetalle = `Google Imagen 3: ${img3ErrText}`;
        }
      } catch (geminiMainErr: any) {
        console.error("[3BF Render IA Gemini Exception]:", geminiMainErr);
        errorDetalle = geminiMainErr?.message || "Fallo en Google Gemini / Imagen 3";
      }
    }

    // =========================================================================
    // 2. MOTOR NANO BANANA PRO & NANO BANANA EDIT (fal.ai FLUX / Nano Banana)
    // =========================================================================
    if (!finalImageUrl && (motor.startsWith("fal_nano_banana") || motor.startsWith("fal_")) && falKey) {
      if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image")) {
        return NextResponse.json(
          { error: "Se requiere la captura 3D del mueble para ubicarlo en la escena." },
          { status: 400 }
        );
      }

      try {
        const isPro = motor === "fal_nano_banana_pro";
        const nanoEndpoint = isPro
          ? "https://fal.run/fal-ai/nano-banana-pro/edit"
          : "https://fal.run/fal-ai/nano-banana/edit";

        // Detección de intención: ¿Fondo Blanco de Estudio o Ambientación en Habitación?
        const esFondoBlanco = /fondo blanco|white background|cyclorama|aislado|estudio blanco|catalogo blanco|isolated on pure white/i.test(cleanPrompt);

        let promptNano = "";
        if (esFondoBlanco) {
          promptNano = `Commercial high-end product catalog photography of the attached 3D furniture piece, isolated and perfectly centered on a seamless pure white studio cyclorama background (#FFFFFF). STRICT 1:1 GEOMETRY AND MATERIAL FIDELITY: Preserve 100% of the exact shape, proportions, parts, cushions/drawers, and wood color tone from the reference image without adding, removing, or altering any geometry. Realistic tactile physical materials (matte satin natural wood grain, refined fabric upholstery with clean piping, subtle PBR reflections). Professional three-point studio softbox lighting with soft, diffuse, natural contact shadows on the floor under the legs and base. Razor-sharp 8k catalog shot, Herman Miller / IKEA catalog quality, no harsh digital noise. User instructions: ${cleanPrompt}`;
        } else {
          promptNano = `Editorial architectural photography shot on 35mm lens, f/2.8 aperture. High-end catalog photograph of the attached custom furniture piece, preserving 100% of its exact geometry, proportion, drawer structure, and wood tone from the reference image. Place it seamlessly in: ${cleanPrompt}. Soft natural daylight from a side window, subtle atmospheric reflections, tangible tactile matte wood grain texture, soft natural floor contact shadows, Architectural Digest quality, perfectly realistic.`;
        }

        const nanoRes = await fetch(nanoEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: promptNano,
            image_urls: [imageBase64],
            aspect_ratio: falRatio,
            num_images: 1,
          }),
        });

        if (nanoRes.ok) {
          const nanoData = await nanoRes.json();
          const remoteUrl = nanoData?.images?.[0]?.url;
          if (remoteUrl) {
            const imgFetch = await fetch(remoteUrl);
            if (imgFetch.ok) {
              const buf = await imgFetch.arrayBuffer();
              finalImageUrl = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
            } else {
              finalImageUrl = remoteUrl;
            }
            motorEfectivo = isPro ? "fal_nano_banana_pro" : "fal_nano_banana";
          }
        } else {
          const nanoErr = await nanoRes.text();
          console.warn("[3BF Render IA] Error en endpoint fal.ai:", nanoErr);
          errorDetalle = `Nano Banana error: ${nanoErr}`;
        }
      } catch (nErr: any) {
        errorDetalle = nErr?.message || "Fallo en fal.ai Nano Banana Edit";
      }
    }

    // =========================================================================
    // 2. MOTOR FLUX.1 LIBRE (Gratuito de Respaldo)
    // =========================================================================
    if (!finalImageUrl && motor === "flux_schnell_free") {
      try {
        let width = 1024;
        let height = 1024;
        if (aspectRatio === "16:9") { width = 1280; height = 720; }
        else if (aspectRatio === "9:16") { width = 720; height = 1280; }

        const seed = Math.floor(Math.random() * 100000000);
        const encodedPrompt = encodeURIComponent(`${cleanPrompt}, pure white background, 8k product photography`);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true&enhance=true`;

        const imgRes = await fetch(pollinationsUrl, { cache: "no-store" });
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          finalImageUrl = `data:${mime};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
          motorEfectivo = "flux_schnell_free";
        }
      } catch (pollinationErr) {
        console.error("[3BF Render IA] Error fallback:", pollinationErr);
      }
    }

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: `No fue posible generar la imagen: ${errorDetalle || "Verifica la conexión con el motor de IA o intenta nuevamente."}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      motorUsado: motorEfectivo,
      aspectRatio,
      promptUsado: cleanPrompt,
    });
  } catch (error: any) {
    console.error("[3BF Render IA Exception]:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno procesando render IA." },
      { status: 500 }
    );
  }
}

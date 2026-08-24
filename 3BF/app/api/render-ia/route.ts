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
    // 1. MOTOR NANO BANANA PRO & NANO BANANA EDIT (Google Gemini Pro Image en fal.ai)
    // =========================================================================
    if ((motor.startsWith("fal_nano_banana") || motor.startsWith("fal_")) && falKey) {
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
          console.warn("[3BF Render IA] Error en endpoint principal, intentando fallback:", nanoErr);
          
          if (isPro) {
            const fallbackRes = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
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
            if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              const fbUrl = fbData?.images?.[0]?.url;
              if (fbUrl) {
                const imgFetch = await fetch(fbUrl);
                if (imgFetch.ok) {
                  const buf = await imgFetch.arrayBuffer();
                  finalImageUrl = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
                } else {
                  finalImageUrl = fbUrl;
                }
                motorEfectivo = "fal_nano_banana";
              }
            }
          }
          if (!finalImageUrl) errorDetalle = `Nano Banana error: ${nanoErr}`;
        }
      } catch (nErr: any) {
        errorDetalle = nErr?.message || "Fallo en Nano Banana Edit";
      }

      if (!finalImageUrl && motor.startsWith("fal_")) {
        return NextResponse.json(
          { error: `Error en fal.ai: ${errorDetalle || "No se pudo generar el render."}` },
          { status: 400 }
        );
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
        { error: `No fue posible generar la imagen: ${errorDetalle || "Verifica las credenciales de fal.ai."}` },
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

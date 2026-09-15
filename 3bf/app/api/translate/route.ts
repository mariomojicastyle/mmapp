import { NextRequest, NextResponse } from "next/server";

interface PausePlaceholder {
  placeholder: string;
  tag: string;
}

// Reemplaza etiquetas [pausa: N] por marcadores únicos __PAU_N__ inmunes a la traducción
function replacePausesWithPlaceholders(text: string): { processedText: string; pauseMap: PausePlaceholder[] } {
  const pauseRegex = /\[(?:pausa|pause):\s*(\d+)\]/gi;
  const pauseMap: PausePlaceholder[] = [];
  let idx = 0;

  const processedText = text.replace(pauseRegex, (_match, p1) => {
    const placeholder = `__PAU_${idx}__`;
    pauseMap.push({ placeholder, tag: `[pausa: ${p1}]` });
    idx++;
    return placeholder;
  });

  return { processedText, pauseMap };
}

// Restaura los marcadores __PAU_N__ a sus respectivas etiquetas [pausa: N]
function restorePausesFromPlaceholders(translatedText: string, pauseMap: PausePlaceholder[]): string {
  let result = translatedText;

  if (pauseMap.length > 0) {
    for (const item of pauseMap) {
      const regex = new RegExp(item.placeholder, "gi");
      if (regex.test(result)) {
        result = result.replace(regex, item.tag);
      } else {
        // Fallback seguro: si el marcador se perdió en la traducción, se añade al final
        result = result.trim() + " " + item.tag;
      }
    }
  }

  // Eliminar cualquier marcador residual no correspondiente
  result = result.replace(/__PAU_[^_\s]+__/gi, "").replace(/\s{2,}/g, " ").trim();
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = "pt" } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: "Texto vacío" }, { status: 400 });
    }

    const target = targetLang.toLowerCase().includes("pt") ? "pt" : "en";
    const targetName = target === "pt" ? "portugués de Brasil" : "inglés";

    // 1. Reemplazar pausas por marcadores en el texto original antes de traducir
    const { processedText, pauseMap } = replacePausesWithPlaceholders(text);
    const textToTranslate = processedText.trim();

    if (!textToTranslate) {
      return NextResponse.json({ success: true, translation: text, targetLang: target });
    }

    // Intentar con Google Translate (rápido y con placeholders intactos)
    try {
      const response = await fetch(
        `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=es&tl=${target}&q=${encodeURIComponent(
          textToTranslate
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        let translation = Array.isArray(data) ? data.join("") : String(data || "");
        if (translation.trim()) {
          // Restaurar pausas intactas
          translation = restorePausesFromPlaceholders(translation, pauseMap);
          return NextResponse.json({
            success: true,
            translation: translation.trim(),
            targetLang: target,
          });
        }
      }
    } catch (gErr) {
      console.warn("[translate API] Fallback Google Translate falló:", gErr);
    }

    // Si hay Gemini API key disponible en entorno
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (geminiKey) {
      try {
        const pauseInstruction = pauseMap.length > 0
          ? `\nREGLA CRÍTICA DE PAUSAS: El texto contiene marcadores de pausa (${pauseMap.map(p => p.placeholder).join(", ")}). Debes conservar cada marcador intacto exactamente en su posición relativa correspondiente. No los elimines ni los traduzcas.\n`
          : "";

        const prompt = `Traduce el siguiente texto de manual de armado de muebles del español al ${targetName}.
La traducción debe ser concisa, natural y profesional para un armador nativo.${pauseInstruction}
Responde SOLO con el texto traducido, sin explicaciones, sin introducciones ni comillas adicionales:
"${textToTranslate}"`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
          }
        );
        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          let candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            candidateText = restorePausesFromPlaceholders(candidateText.trim().replace(/^"|"$/g, ""), pauseMap);
            return NextResponse.json({
              success: true,
              translation: candidateText,
              targetLang: target,
            });
          }
        }
      } catch (gemErr) {
        console.warn("[translate API] Gemini falló:", gemErr);
      }
    }

    return NextResponse.json({
      success: false,
      error: "No se pudo traducir",
      translation: text,
    }, { status: 500 });
  } catch (error: any) {
    console.error("[translate API] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

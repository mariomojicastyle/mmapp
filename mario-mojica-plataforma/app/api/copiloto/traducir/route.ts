import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
  };

  try {
    const { text, fromLang = "auto", toLang = "es" } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Texto requerido" }, { status: 400, headers: corsHeaders });
    }

    const cleanText = text.trim();
    const sourceLang = fromLang === "auto" ? (toLang === "es" ? "pt" : "es") : fromLang;

    // 1. Intento con Google Translate de ultra baja latencia (<150ms)
    try {
      const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${toLang}&q=${encodeURIComponent(cleanText)}`;
      const gRes = await fetch(gUrl, { cache: "no-store" });
      
      if (gRes.ok) {
        const gData = await gRes.json();
        let translated = Array.isArray(gData) ? gData.join("") : String(gData || "");
        
        if (translated) {
          return NextResponse.json({
            translation: translated,
            fromLang: sourceLang,
            toLang,
            engine: "fast-stream",
            timestamp: Date.now()
          }, { headers: corsHeaders });
        }
      }
    } catch (gErr) {
      console.warn("[copiloto/traducir] Fast engine fallback:", gErr);
    }

    // 2. Fallback a Gemini si está disponible
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const targetLangName = toLang === "pt" ? "Português do Brasil" : toLang === "en" ? "English" : "Español";
      const prompt = `Traducción conversacional ultra rápida para videollamada B2B del sector de manufactura de muebles RTA.
Traduce el siguiente texto de forma natural, directa y precisa al ${targetLangName}.
Retorna ÚNICAMENTE la traducción sin comillas ni explicaciones adicionales.

Texto: "${cleanText}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiText) {
          return NextResponse.json({
            translation: geminiText,
            fromLang: sourceLang,
            toLang,
            engine: "gemini-flash",
            timestamp: Date.now()
          }, { headers: corsHeaders });
        }
      }
    }

    // 3. Fallback de emergencia
    return NextResponse.json({
      translation: cleanText,
      fromLang: sourceLang,
      toLang,
      engine: "passthrough",
      timestamp: Date.now()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Error en /api/copiloto/traducir:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500, headers: corsHeaders }
    );
  }
}

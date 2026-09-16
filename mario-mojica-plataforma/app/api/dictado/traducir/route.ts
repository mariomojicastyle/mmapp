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
    const { text, fromLang = "es", toLang = "en" } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Texto requerido" }, { status: 400, headers: corsHeaders });
    }

    const cleanText = text.trim();
    const sourceLang = fromLang;

    // 1. Intento con Google Translate Fast Stream (<120ms)
    try {
      const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${toLang}&q=${encodeURIComponent(cleanText)}`;
      const gRes = await fetch(gUrl, { cache: "no-store" });
      
      if (gRes.ok) {
        const gData = await gRes.json();
        const translated = Array.isArray(gData) ? gData.join("") : String(gData || "");
        
        if (translated && translated.trim()) {
          return NextResponse.json({
            translation: translated.trim(),
            fromLang: sourceLang,
            toLang,
            engine: "fast-stream",
            timestamp: Date.now()
          }, { headers: corsHeaders });
        }
      }
    } catch (gErr) {
      console.warn("[dictado/traducir] Fast engine fallback:", gErr);
    }

    // 2. Fallback a Gemini si está configurado
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const targetLangName = toLang === "pt" ? "Português do Brasil" : toLang === "en" ? "English" : "Español";
      const prompt = `Translate the following speech transcription into ${targetLangName} accurately and naturally.
Provide ONLY the translated text without quotes or explanations.

Text: "${cleanText}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
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

    // 3. Passthrough si no hubo motor disponible
    return NextResponse.json({
      translation: cleanText,
      fromLang: sourceLang,
      toLang,
      engine: "passthrough",
      timestamp: Date.now()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Error en API traducir:", error);
    return NextResponse.json(
      { error: "Error en el servicio de traducción" },
      { status: 500, headers: corsHeaders }
    );
  }
}

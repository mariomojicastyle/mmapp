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
    let cleanText = "";
    let sourceLang = "es";
    let toLang = "en";

    try {
      const raw = await request.text();
      try {
        const body = JSON.parse(raw);
        cleanText = (body.text || "").trim();
        if (body.fromLang) sourceLang = body.fromLang;
        if (body.toLang) toLang = body.toLang;
      } catch {
        // Intento de rescate si las comillas vienen con barras invertidas adicionales
        try {
          const sanitized = raw.replace(/\\"/g, '"').replace(/^"|"$/g, '');
          const body = JSON.parse(sanitized);
          cleanText = (body.text || "").trim();
          if (body.fromLang) sourceLang = body.fromLang;
          if (body.toLang) toLang = body.toLang;
        } catch (rescueErr) {
          console.warn("[dictado/traducir] Error irrecuperable parseando JSON:", rescueErr, "Raw recibido:", raw);
          return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: corsHeaders });
        }
      }
    } catch (parseErr) {
      console.warn("[dictado/traducir] Error al leer request body:", parseErr);
      return NextResponse.json({ error: "Error leyendo solicitud" }, { status: 400, headers: corsHeaders });
    }

    if (!cleanText) {
      return NextResponse.json({ error: "Texto requerido" }, { status: 400, headers: corsHeaders });
    }

    // Normalización lingüística para habla oral en Portugués de Brasil (WhatsApp, audios rápidos)
    let textToTranslate = cleanText;
    if (sourceLang.toLowerCase().startsWith("pt")) {
      textToTranslate = textToTranslate
        .replace(/\bpra\b/gi, "para a")
        .replace(/\bpro\b/gi, "para o")
        .replace(/\bpras\b/gi, "para as")
        .replace(/\bpros\b/gi, "para os")
        .replace(/\btá\b/gi, "está")
        .replace(/\btô\b/gi, "estou")
        .replace(/\btava\b/gi, "estava")
        .replace(/\bcê\b/gi, "você")
        .replace(/\bcês\b/gi, "vocês")
        .replace(/\bdá pra\b/gi, "é possível")
        .replace(/\btem como\b/gi, "é possível")
        .replace(/\baí tudo bem\b/gi, "aí tudo bem,")
        .trim();
    }

    const sl = sourceLang.split("-")[0].toLowerCase();
    const tl = toLang.split("-")[0].toLowerCase();

    // 1. Motor Neuronal de Google Translate (GTX NMT - Máxima precisión y contexto de párrafos)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const gtxRes = await fetch(gtxUrl, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

      if (gtxRes.ok) {
        const rawJson = await gtxRes.text();
        let translated = "";
        try {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
            translated = parsed[0]
              .map((chunk: any) => (Array.isArray(chunk) && chunk[0] ? chunk[0] : ""))
              .filter(Boolean)
              .join("");
          }
        } catch {
          // Extracción por regex en caso de fragmentos JSON no estándar
          const matches = rawJson.match(/\["([^"\\]*(?:\\.[^"\\]*)*)"/g);
          if (matches) {
            translated = matches.map((m) => m.replace(/^\["|\\"/g, '"').slice(1)).join("");
          }
        }

        if (translated && translated.trim()) {
          return NextResponse.json(
            {
              translation: translated.trim(),
              fromLang: sourceLang,
              toLang,
              engine: "google-gtx-neural",
              timestamp: Date.now(),
            },
            { headers: corsHeaders }
          );
        }
      }
    } catch (gtxErr) {
      console.warn("[dictado/traducir] GTX Neural fallback:", gtxErr);
    }

    // 2. Intento de respaldo con Google Translate Fast Stream
    try {
      const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&q=${encodeURIComponent(textToTranslate)}`;
      const gRes = await fetch(gUrl, { cache: "no-store" });
      
      if (gRes.ok) {
        const rawText = await gRes.text();
        let translated = "";
        try {
          const gData = JSON.parse(rawText);
          translated = Array.isArray(gData) ? gData.join("") : String(gData || "");
        } catch {
          translated = rawText.replace(/^\["|"]$/g, "").replace(/\\"/g, '"');
        }
        
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

    // 2. Fallback a MyMemory Translate API pública gratuita (alta estabilidad)
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${sourceLang}|${toLang}`;
      const mmRes = await fetch(myMemoryUrl, { cache: "no-store" });
      if (mmRes.ok) {
        const mmData = await mmRes.json();
        const mmText = mmData?.responseData?.translatedText;
        if (mmText && typeof mmText === "string" && mmText.trim() && !mmText.toUpperCase().includes("QUERY LENGTH LIMIT EXCEEDED")) {
          return NextResponse.json({
            translation: mmText.trim(),
            fromLang: sourceLang,
            toLang,
            engine: "mymemory",
            timestamp: Date.now()
          }, { headers: corsHeaders });
        }
      }
    } catch (mmErr) {
      console.warn("[dictado/traducir] MyMemory fallback:", mmErr);
    }

    // 3. Fallback a Gemini si está configurado
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
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
      } catch (gemErr) {
        console.warn("[dictado/traducir] Gemini fallback error:", gemErr);
      }
    }

    // 4. Passthrough silencioso si no hubo motor disponible
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
      { translation: "", error: "No se pudo completar la traducción" },
      { status: 200, headers: corsHeaders }
    );
  }
}

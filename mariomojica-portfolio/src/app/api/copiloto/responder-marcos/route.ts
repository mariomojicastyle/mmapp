import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { ultimoMensajeMario = "", turno = 0 } = await request.json();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && ultimoMensajeMario.trim()) {
      try {
        const prompt = `Eres Marcos Unnass, Coordenador de Engenharia e P&D de Móveis Henn (fábrica de móveis RTA em Santa Catarina, Brasil).
Estás en una reunión en vivo con Mario Mojica evaluando la propuesta de manuales 3D interactivos, software 3dBimFab y reducción de costos de P&D (30% de ahorro).

Mario acaba de decirte: "${ultimoMensajeMario}"

Responde en 1 o 2 oraciones breves, en Português do Brasil natural, profesional y técnico (mencionando temas como SketchUp da Cintia, ERP Datasul, 200 lançamentos por ano, custo por manual ou aprovação com a diretoria).
Retorna ÚNICAMENTE tu respuesta en portugués, sin comillas ni encabezados.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const respuestaPt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (respuestaPt) {
            // Traducir al español
            const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=pt&tl=es&q=${encodeURIComponent(respuestaPt)}`;
            const gRes = await fetch(gUrl);
            let traduccionEs = respuestaPt;
            if (gRes.ok) {
              const gData = await gRes.json();
              traduccionEs = Array.isArray(gData) ? gData.join("") : String(gData || "");
            }

            return NextResponse.json({
              pt: respuestaPt,
              es: traduccionEs,
              engine: "gemini-live"
            });
          }
        }
      } catch (e) {
        console.warn("Fallback de respuesta de Marcos:", e);
      }
    }

    const fallbacks = [
      {
        pt: "Olá Mario, bom dia! Como você propõe que a gente faça a integração dos manuais de montagem a partir do SketchUp da Cintia?",
        es: "Hola Mario, ¡buenos días! ¿Cómo propones que hagamos la integración de los manuales de armado a partir del SketchUp de Cintia?"
      },
      {
        pt: "Entendi perfeitamente. E em relação aos custos, nós fazemos cerca de 200 lançamentos por ano. Como fica a meta dos 30% de economia?",
        es: "Entendí perfectamente. Y en relación a los costos, nosotros hacemos cerca de 200 lanzamientos por año. ¿Cómo queda la meta del 30% de ahorro?"
      },
      {
        pt: "Com 200 manuais e o custo padrão em 546 reais com você, temos um argumento muito forte para a diretoria aprovar o piloto de 3 meses.",
        es: "Con 200 manuales y el costo estándar en 546 reales contigo, tenemos un argumento muy fuerte para que la directiva apruebe el piloto de 3 meses."
      },
      {
        pt: "Perfeito Mario! A Cintia vai disponibilizar os arquivos 3D dos primeiros móveis para iniciarmos os testes esta semana.",
        es: "¡Perfecto Mario! Cintia va a poner a disposición los archivos 3D de los primeros muebles para iniciar las pruebas esta semana."
      }
    ];

    const sel = fallbacks[turno % fallbacks.length];
    return NextResponse.json({
      pt: sel.pt,
      es: sel.es,
      engine: "fallback-preset"
    });

  } catch (err) {
    return NextResponse.json({ error: "Error en respuesta" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generarHtmlActa, ActaData, DialogoTurno, AcuerdoItem } from "@/lib/actaGenerator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const cliente = body.cliente || body.clienteNombre || "Cliente B2B";
    const asunto = body.asunto || "Reunión de Negocios y Fabricación 3D";
    const rawSegments = body.segments || body.segmentos || [];
    const participantes = body.participantes || ["Mario Mojica", cliente];
    const duracion = body.duracion || (body.duracionSegundos ? `${Math.floor(body.duracionSegundos / 60)} min` : "00:00");
    const modo = body.modo || "pt_to_es";

    if (!rawSegments || rawSegments.length === 0) {
      return NextResponse.json(
        { error: "No hay transcripciones para generar el acta" },
        { status: 400 }
      );
    }

    const segments = rawSegments.map((s: any) => ({
      originalText: s.originalText || s.text || "",
      translatedText: s.translatedText || s.translation || "",
      timestamp: s.timestamp || Date.now(),
      speaker: s.speaker,
    }));

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const fechaIso = ahora.toISOString().split("T")[0];
    const hora = ahora.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const horaLimpia = ahora.toTimeString().split(" ")[0].replace(/:/g, "-");

    // 1. Cargar Logotipos Oficiales desde publicidad/
    let mmSvg = "";
    let bfSvg = "";
    try {
      const pubDir = path.resolve(process.cwd(), "..", "publicidad");
      const mmPath = path.join(pubDir, "Logo_MM_en.svg");
      const bfPath = path.join(pubDir, "Logo_3BF.svg");

      if (fs.existsSync(mmPath)) {
        mmSvg = fs.readFileSync(mmPath, "utf-8");
      }
      if (fs.existsSync(bfPath)) {
        bfSvg = fs.readFileSync(bfPath, "utf-8");
      }
    } catch (e) {
      console.warn("No se pudieron leer los SVG oficiales:", e);
    }

    // 2. Procesar Diarización y Resumen con Gemini (si está configurado)
    let resumenPuntos: string[] = [
      `Sesión de trabajo sostenida con ${cliente} enfocado en: ${asunto}.`,
      `Revisión técnica de procesos de fabricación digital y manuales 3D interactivos.`,
      `Alineación de cronograma de pruebas y validaciones comerciales.`,
    ];

    let acuerdos: AcuerdoItem[] = [
      {
        tarea: "Revisar y validar el flujo técnico en la planta / centro de mecanizado.",
        responsable: participantes[1] || cliente,
        plazo: "Esta semana",
      },
      {
        tarea: "Enviar especificaciones actualizadas de los modelos paramétricos 3D.",
        responsable: "Mario Mojica",
        plazo: "Próximas 24 horas",
      },
    ];

    let dialogos: DialogoTurno[] = segments.map((seg: any) => {
      // Fallback: si el modo es pt_to_es, el emisor principal es el cliente
      const isClientSpeaking = modo === "pt_to_es";
      const hablante = isClientSpeaking
        ? participantes[1] || cliente
        : "Mario Mojica";

      return {
        hablante,
        rol: isClientSpeaking ? "Cliente / Fabricante" : "Mario Mojica • 3dBimFab",
        originalText: seg.originalText,
        translatedText: seg.translatedText || "",
        timestamp: new Date(seg.timestamp || Date.now()).toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
    });

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && segments.length > 0) {
      try {
        const transcripcionTexto = segments
          .map((s: any, i: number) => `[Bloque ${i + 1}]: "${s.originalText}"`)
          .join("\n");

        const prompt = `Actúa como un Secretario Ejecutivo B2B experto en manufactura de muebles e ingeniería de software para Mario Mojica y su tecnología 3dBimFab.
Analiza la siguiente reunión:
- Empresa/Cliente: ${cliente}
- Asunto: ${asunto}
- Participantes registrados: ${JSON.stringify(participantes)}

Transcripción de las intervenciones:
${transcripcionTexto}

Tu objetivo es estructurar el acta en JSON con:
1. "resumenPuntos": Array de 3 a 5 puntos ejecutivos concisos y claros tratados en la llamada.
2. "acuerdos": Array de tareas pactadas [{ "tarea": "...", "responsable": "...", "plazo": "..." }].
3. "hablantesAsignados": Array de strings con el nombre del participante que más probablemente dijo cada Bloque (en el mismo orden de los bloques: de Bloque 1 a Bloque ${segments.length}). Elige exclusivamente de la lista de participantes: ${JSON.stringify(participantes)}.

Responde ÚNICAMENTE con el objeto JSON válido, sin bloques de código markdown ni explicaciones adicionales.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (Array.isArray(parsed.resumenPuntos) && parsed.resumenPuntos.length > 0) {
              resumenPuntos = parsed.resumenPuntos;
            }
            if (Array.isArray(parsed.acuerdos) && parsed.acuerdos.length > 0) {
              acuerdos = parsed.acuerdos;
            }
            if (Array.isArray(parsed.hablantesAsignados)) {
              dialogos = dialogos.map((d, i) => {
                const h = parsed.hablantesAsignados[i] || d.hablante;
                const isMario = h.toLowerCase().includes("mario");
                return {
                  ...d,
                  hablante: h,
                  rol: isMario ? "Mario Mojica • 3dBimFab" : "Cliente / Fabricante",
                };
              });
            }
          }
        }
      } catch (geminiError) {
        console.warn("Fallo análisis de Gemini para el acta, usando fallback:", geminiError);
      }
    }

    // 3. Generar HTML del Acta Ejecutiva
    const actaData: ActaData = {
      cliente,
      asunto,
      fecha,
      hora,
      duracion,
      participantes,
      resumenPuntos,
      acuerdos,
      dialogos,
    };

    const htmlContent = generarHtmlActa(actaData, { mmSvg, bfSvg });

    // 4. Guardar en Google Drive (G:\Mi unidad\Reuniones_B2B\)
    const sanitizeName = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, "_");
    const clienteSanitizado = sanitizeName(cliente);
    const fileNameHtml = `Acta_${clienteSanitizado}_${fechaIso}_${horaLimpia}.html`;
    const fileNameDoc = `Acta_${clienteSanitizado}_${fechaIso}_${horaLimpia}.doc`;

    let targetDir = "G:\\Mi unidad\\Reuniones_B2B";
    let driveDisponible = true;

    if (!fs.existsSync("G:\\Mi unidad")) {
      driveDisponible = false;
      targetDir = path.resolve(process.cwd(), "..", "data", "reuniones_actas");
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } else if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePathHtml = path.join(targetDir, fileNameHtml);

    fs.writeFileSync(filePathHtml, htmlContent, "utf-8");

    return NextResponse.json({
      success: true,
      cliente,
      asunto,
      fecha,
      duracion,
      driveDisponible,
      targetDir,
      filePathHtml,
      fileNameHtml,
      htmlContent,
      resumenPuntos,
      acuerdos,
      dialogos,
    });
  } catch (error: any) {
    console.error("Error al generar acta:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el acta de reunión" },
      { status: 500 }
    );
  }
}

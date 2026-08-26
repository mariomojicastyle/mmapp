import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Almacén en memoria volátil de salas activas para sincronización bilateral en tiempo real
const memoryRooms: Record<string, {
  messages: Array<{
    id: string;
    speaker: "mario" | "cliente" | "sistema";
    originalText: string;
    translatedText: string;
    fromLang: string;
    toLang: string;
    timestamp: number;
  }>;
  costParams: {
    manualesAno: number;
    personasPed: number;
    salarioCltMes: number;
    licenciaSketchUpAno: number;
    licenciaAdobeAno: number;
    licenciaOtrosAno: number;
    ahorroPct: number;
    horasPequeno: number;
    horasMediano: number;
    horasGrande: number;
    horasSacMes: number;
  };
  activePdf?: {
    url: string;
    nombre: string;
  };
  lastUpdated: number;
}> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sala = searchParams.get("sala") || "henn";
  const since = parseInt(searchParams.get("since") || "0", 10);

  if (!memoryRooms[sala]) {
    memoryRooms[sala] = {
      messages: [],
      costParams: {
        manualesAno: 200,
        personasPed: 2.0,
        salarioCltMes: 6000,
        licenciaSketchUpAno: 2400,
        licenciaAdobeAno: 3600,
        licenciaOtrosAno: 0,
        ahorroPct: 30,
        horasPequeno: 8,
        horasMediano: 12,
        horasGrande: 16,
        horasSacMes: 20
      },
      lastUpdated: Date.now()
    };
  }

  const room = memoryRooms[sala];
  const newMessages = since > 0 ? room.messages.filter(m => m.timestamp > since) : room.messages;

  return NextResponse.json({
    sala,
    messages: newMessages,
    allMessages: room.messages,
    costParams: room.costParams,
    activePdf: room.activePdf,
    totalCount: room.messages.length,
    lastUpdated: room.lastUpdated
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sala = "henn", message, costParams, activePdf, cliente = "Henn" } = body;

    if (!memoryRooms[sala]) {
      memoryRooms[sala] = {
        messages: [],
        costParams: {
          manualesAno: 200,
          personasPed: 2.0,
          salarioCltMes: 6000,
          licenciaSketchUpAno: 2400,
          licenciaAdobeAno: 3600,
          licenciaOtrosAno: 0,
          ahorroPct: 30,
          horasPequeno: 8,
          horasMediano: 12,
          horasGrande: 16,
          horasSacMes: 20
        },
        lastUpdated: Date.now()
      };
    }

    // 1. Agregar nuevo mensaje hablado
    if (action === "add_message" && message) {
      const msgItem = {
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        speaker: message.speaker || "mario",
        originalText: message.originalText,
        translatedText: message.translatedText,
        fromLang: message.fromLang || "es",
        toLang: message.toLang || "pt",
        timestamp: Date.now()
      };

      memoryRooms[sala].messages.push(msgItem);
      memoryRooms[sala].lastUpdated = Date.now();

      return NextResponse.json({ success: true, message: msgItem });
    }

    // 2. Sincronizar parámetros de costos en tiempo real
    if (action === "update_cost_params" && costParams) {
      memoryRooms[sala].costParams = {
        ...memoryRooms[sala].costParams,
        ...costParams
      };
      memoryRooms[sala].lastUpdated = Date.now();
      return NextResponse.json({ success: true, costParams: memoryRooms[sala].costParams });
    }

    // 3. Sincronizar documento PDF
    if (action === "update_pdf" && activePdf) {
      memoryRooms[sala].activePdf = activePdf;
      memoryRooms[sala].lastUpdated = Date.now();
      return NextResponse.json({ success: true, activePdf: memoryRooms[sala].activePdf });
    }

    // 4. Guardar acta en disco
    if (action === "save_session") {
      const room = memoryRooms[sala];
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const filename = `reunion_${sala}_${dateStr}_${timeStr}.json`;

      const targetDir = path.resolve(process.cwd(), "Clientes", cliente, "reuniones");
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(room, null, 2), "utf8");

      return NextResponse.json({
        success: true,
        savedFile: filename,
        totalMessages: room.messages.length
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

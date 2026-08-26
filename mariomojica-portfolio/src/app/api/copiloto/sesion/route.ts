import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Almacén en memoria volátil de salas activas para sync bilateral
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
  lastUpdated: number;
}> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sala = searchParams.get("sala") || "henn";
  const since = parseInt(searchParams.get("since") || "0", 10);

  const room = memoryRooms[sala] || { messages: [], lastUpdated: Date.now() };
  const newMessages = room.messages.filter(m => m.timestamp > since);

  return NextResponse.json({
    sala,
    messages: newMessages,
    totalCount: room.messages.length,
    lastUpdated: room.lastUpdated
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sala = "henn", message, cliente = "Henn" } = body;

    if (!memoryRooms[sala]) {
      memoryRooms[sala] = { messages: [], lastUpdated: Date.now() };
    }

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

    if (action === "save_session") {
      const room = memoryRooms[sala];
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0];

      // Formatear Markdown
      const mdLines = [
        `# 🎙️ Registro de Sesión en Vivo: ${cliente.toUpperCase()} (${dateStr})`,
        ``,
        `> **Fecha:** ${dateStr} ${timeStr} | **Sala:** ${sala}`,
        `> **Total de Mensajes Transcritos:** ${room?.messages.length || 0}`,
        ``,
        `---`,
        ``,
        `## 📝 Transcripción Bilingüe en Cascada`,
        ``
      ];

      if (room && room.messages.length > 0) {
        room.messages.forEach(m => {
          const speakerName = m.speaker === "mario" ? "Mario (Español)" : `${cliente} (Português/Inglés)`;
          const timeFormatted = new Date(m.timestamp).toLocaleTimeString();
          mdLines.push(`* **[${timeFormatted}] ${speakerName}:**`);
          mdLines.push(`  * *Original (${m.fromLang.toUpperCase()}):* "${m.originalText}"`);
          mdLines.push(`  * *Traducción (${m.toLang.toUpperCase()}):* "${m.translatedText}"`);
          mdLines.push(``);
        });
      } else {
        mdLines.push(`*No se registraron mensajes durante esta sesión.*`);
      }

      // Guardar archivo físico en Clientes/Henn/reuniones/
      const reuniFolder = path.resolve('c:/Desarrollo/mmapp/Clientes/Henn/reuniones');
      if (!fs.existsSync(reuniFolder)) {
        fs.mkdirSync(reuniFolder, { recursive: true });
      }

      const fileName = `${dateStr}_Reunion_EnVivo_${sala}_${Date.now().toString().slice(-4)}.md`;
      const fullFilePath = path.join(reuniFolder, fileName);
      fs.writeFileSync(fullFilePath, mdLines.join("\n"), "utf8");

      return NextResponse.json({
        success: true,
        savedFile: fileName,
        path: fullFilePath,
        messageCount: room?.messages.length || 0
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en /api/copiloto/sesion:", err);
    return NextResponse.json({ error: "Error procesando sesión" }, { status: 500 });
  }
}

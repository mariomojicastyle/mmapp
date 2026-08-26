import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dezaisaunoumhqpssols.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_HyhWSanS2mhByF476p_EzA_6oq2bQOT";

const supabase = createClient(supabaseUrl, serviceKey);

// Fallback en memoria volátil
const memoryRooms: Record<string, any> = {};

async function getRoomFromSupabase(sala: string) {
  try {
    const { data, error } = await supabase
      .from("ventas_interacciones")
      .select("resumen_es, created_at")
      .eq("id", `sala_viva_${sala}`)
      .single();

    if (data && data.resumen_es) {
      const parsed = JSON.parse(data.resumen_es);
      return parsed;
    }
  } catch (err) {
    // Silencioso
  }
  return null;
}

async function saveRoomToSupabase(sala: string, roomData: any) {
  try {
    await supabase.from("ventas_interacciones").upsert({
      id: `sala_viva_${sala}`,
      prospecto_id: `p-${sala}`,
      canal: "Mesa_Bilingue",
      tipo_entrada: "sesion_viva",
      resumen_es: JSON.stringify(roomData),
      mensaje_final_enviado: `Mesa de trabajo bilingüe: ${roomData.empresa || sala}`,
      created_at: new Date().toISOString()
    }, { onConflict: "id" });
  } catch (err) {
    console.error("Error guardando sala en Supabase:", err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sala = searchParams.get("sala") || "henn";
  const since = parseInt(searchParams.get("since") || "0", 10);

  // Intentar leer de Supabase primero
  let room = await getRoomFromSupabase(sala);

  if (!room) {
    room = memoryRooms[sala] || {
      sala,
      empresa: sala === "henn" ? "Móveis Henn" : "Cliente B2B",
      titulo: `Mesa de Trabajo Bilingüe (${sala === "henn" ? "Móveis Henn" : "Cliente B2B"})`,
      idioma1: "es",
      idioma2: "pt",
      participantes1: ["Mario Mojica"],
      participantes2: ["Marcos Unnass"],
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

  memoryRooms[sala] = room;
  const newMessages = since > 0 ? (room.messages || []).filter((m: any) => m.timestamp > since) : (room.messages || []);

  return NextResponse.json({
    sala,
    empresa: room.empresa,
    titulo: room.titulo,
    idioma1: room.idioma1 || "es",
    idioma2: room.idioma2 || "pt",
    participantes1: room.participantes1 || ["Mario Mojica"],
    participantes2: room.participantes2 || ["Marcos Unnass"],
    messages: newMessages,
    allMessages: room.messages || [],
    costParams: room.costParams,
    activePdf: room.activePdf,
    totalCount: (room.messages || []).length,
    lastUpdated: room.lastUpdated || Date.now()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      sala = "henn",
      message,
      costParams,
      activePdf,
      roomConfig,
      cliente = "Henn"
    } = body;

    let room = await getRoomFromSupabase(sala) || memoryRooms[sala] || {
      sala,
      empresa: sala === "henn" ? "Móveis Henn" : "Cliente B2B",
      titulo: `Mesa de Trabajo Bilingüe (${sala === "henn" ? "Móveis Henn" : "Cliente B2B"})`,
      idioma1: "es",
      idioma2: "pt",
      participantes1: ["Mario Mojica"],
      participantes2: ["Marcos Unnass"],
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

    // 1. Configurar Sala Inicial (Modal de Creación)
    if (action === "configure_room" && roomConfig) {
      room = {
        ...room,
        ...roomConfig,
        lastUpdated: Date.now()
      };
      memoryRooms[sala] = room;
      await saveRoomToSupabase(sala, room);
      return NextResponse.json({ success: true, room });
    }

    // 2. Agregar Mensaje de Voz
    if (action === "add_message" && message) {
      const msgItem = {
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        speaker: message.speaker || "mario",
        speakerName: message.speakerName || (message.speaker === "mario" ? "Mario Mojica" : "Marcos Unnass"),
        originalText: message.originalText,
        translatedText: message.translatedText,
        fromLang: message.fromLang || "es",
        toLang: message.toLang || "pt",
        timestamp: Date.now()
      };

      if (!room.messages) room.messages = [];
      room.messages.push(msgItem);
      room.lastUpdated = Date.now();

      memoryRooms[sala] = room;
      await saveRoomToSupabase(sala, room);

      return NextResponse.json({ success: true, message: msgItem });
    }

    // 3. Sincronizar Cotizador de Costos
    if (action === "update_cost_params" && costParams) {
      room.costParams = {
        ...room.costParams,
        ...costParams
      };
      room.lastUpdated = Date.now();
      memoryRooms[sala] = room;
      await saveRoomToSupabase(sala, room);
      return NextResponse.json({ success: true, costParams: room.costParams });
    }

    // 4. Sincronizar Documento PDF Proyectado
    if (action === "update_pdf" && activePdf) {
      room.activePdf = activePdf;
      room.lastUpdated = Date.now();
      memoryRooms[sala] = room;
      await saveRoomToSupabase(sala, room);
      return NextResponse.json({ success: true, activePdf: room.activePdf });
    }

    // 5. Guardar Acta de la Reunión en Disco y Supabase
    if (action === "save_session") {
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

      // Guardar registro histórico en Supabase
      await supabase.from("ventas_interacciones").insert({
        id: `acta_${sala}_${Date.now()}`,
        prospecto_id: `p-${sala}`,
        canal: "Mesa_Bilingue",
        tipo_entrada: "acta_guardada",
        resumen_es: JSON.stringify({
          filename,
          savedAt: now.toISOString(),
          totalMessages: (room.messages || []).length,
          empresa: room.empresa,
          titulo: room.titulo,
          costParams: room.costParams
        }),
        mensaje_final_enviado: `Acta guardada: ${filename}`,
        created_at: now.toISOString()
      });

      return NextResponse.json({
        success: true,
        savedFile: filename,
        storagePath: `Clientes/${cliente}/reuniones/${filename}`,
        totalMessages: (room.messages || []).length
      });
    }

    // 6. Listar Historial de Actas Guardadas
    if (action === "list_saved_sessions") {
      const { data: actas } = await supabase
        .from("ventas_interacciones")
        .select("*")
        .eq("tipo_entrada", "acta_guardada")
        .order("created_at", { ascending: false })
        .limit(20);

      return NextResponse.json({
        success: true,
        actas: actas || []
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dezaisaunoumhqpssols.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_HyhWSanS2mhByF476p_EzA_6oq2bQOT";

const supabase = createClient(supabaseUrl, serviceKey);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sala = searchParams.get("sala") || "henn";

  try {
    // 1. Obtener mensajes y configuraciones
    const { data: rows, error } = await supabase
      .from("ventas_interacciones")
      .select("*")
      .eq("canal", "Mesa_Bilingue")
      .eq("prospecto_id", `p-${sala}`)
      .order("created_at", { ascending: true })
      .limit(200);

    const messages: any[] = [];
    let roomConfig: any = null;
    let costParams: any = {
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
    };
    let activePdf: any = {
      nombre: "Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf",
      url: "/Clientes/Henn/Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf"
    };

    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (row.tipo_entrada === "mensaje_voz") {
          messages.push({
            id: row.id,
            speaker: row.termometro === "cliente" ? "cliente" : "mario",
            speakerName: row.borrador_pt || (row.termometro === "cliente" ? "Marcos Unnass" : "Mario Mojica"),
            originalText: row.resumen_es || "",
            translatedText: row.traduccion_es || "",
            fromLang: row.intencion_detectada === "pt" ? "pt" : "es",
            toLang: row.intencion_detectada === "pt" ? "es" : "pt",
            timestamp: new Date(row.created_at).getTime()
          });
        } else if (row.tipo_entrada === "config_sala" && row.resumen_es) {
          try {
            roomConfig = JSON.parse(row.resumen_es);
          } catch (e) {}
        } else if (row.tipo_entrada === "cost_params" && row.resumen_es) {
          try {
            costParams = JSON.parse(row.resumen_es);
          } catch (e) {}
        } else if (row.tipo_entrada === "active_pdf" && row.resumen_es) {
          try {
            activePdf = JSON.parse(row.resumen_es);
          } catch (e) {}
        }
      }
    }

    return NextResponse.json({
      sala,
      empresa: roomConfig?.empresa || (sala === "henn" ? "Móveis Henn" : "Cliente B2B"),
      titulo: roomConfig?.titulo || `Mesa de Trabajo Bilingüe (${sala === "henn" ? "Móveis Henn" : "Cliente B2B"})`,
      participantes1: roomConfig?.participantes1 || ["Mario Mojica"],
      participantes2: roomConfig?.participantes2 || ["Marcos Unnass"],
      allMessages: messages,
      messages: messages,
      costParams,
      activePdf,
      lastUpdated: Date.now()
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, messages: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sala = "henn", message, costParams, activePdf, roomConfig, cliente = "Henn" } = body;

    // 1. Agregar Mensaje de Voz
    if (action === "add_message" && message) {
      const msgId = message.id || `msg_${sala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      
      const { error: insErr } = await supabase.from("ventas_interacciones").insert({
        id: msgId,
        prospecto_id: `p-${sala}`,
        canal: "Mesa_Bilingue",
        tipo_entrada: "mensaje_voz",
        resumen_es: message.originalText || "",
        traduccion_es: message.translatedText || "",
        borrador_pt: message.speakerName || (message.speaker === "mario" ? "Mario Mojica" : "Marcos Unnass"),
        termometro: message.speaker === "cliente" ? "cliente" : "mario",
        intencion_detectada: message.fromLang || "es",
        mensaje_final_enviado: `[${message.speakerName || message.speaker}]: ${message.originalText}`,
        created_at: new Date().toISOString()
      });

      if (insErr) throw insErr;
      return NextResponse.json({ success: true, id: msgId });
    }

    // 2. Sincronizar Cotizador de Costos (Elimina el previo e inserta el nuevo para lectura instantánea)
    if (action === "update_cost_params" && costParams) {
      // Eliminar registros anteriores de costos para esta sala
      await supabase
        .from("ventas_interacciones")
        .delete()
        .eq("canal", "Mesa_Bilingue")
        .eq("prospecto_id", `p-${sala}`)
        .eq("tipo_entrada", "cost_params");

      const { error: insErr } = await supabase.from("ventas_interacciones").insert({
        id: `cost_${sala}_${Date.now()}`,
        prospecto_id: `p-${sala}`,
        canal: "Mesa_Bilingue",
        tipo_entrada: "cost_params",
        resumen_es: JSON.stringify(costParams),
        mensaje_final_enviado: "Actualización de costos sincronizada",
        created_at: new Date().toISOString()
      });

      if (insErr) throw insErr;
      return NextResponse.json({ success: true, costParams });
    }

    // 3. Sincronizar PDF
    if (action === "update_pdf" && activePdf) {
      await supabase
        .from("ventas_interacciones")
        .delete()
        .eq("canal", "Mesa_Bilingue")
        .eq("prospecto_id", `p-${sala}`)
        .eq("tipo_entrada", "active_pdf");

      await supabase.from("ventas_interacciones").insert({
        id: `pdf_${sala}_${Date.now()}`,
        prospecto_id: `p-${sala}`,
        canal: "Mesa_Bilingue",
        tipo_entrada: "active_pdf",
        resumen_es: JSON.stringify(activePdf),
        mensaje_final_enviado: `PDF activo: ${activePdf.nombre}`,
        created_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }

    // 4. Configurar Sala
    if (action === "configure_room" && roomConfig) {
      await supabase
        .from("ventas_interacciones")
        .delete()
        .eq("canal", "Mesa_Bilingue")
        .eq("prospecto_id", `p-${sala}`)
        .eq("tipo_entrada", "config_sala");

      await supabase.from("ventas_interacciones").insert({
        id: `config_${sala}_${Date.now()}`,
        prospecto_id: `p-${sala}`,
        canal: "Mesa_Bilingue",
        tipo_entrada: "config_sala",
        resumen_es: JSON.stringify(roomConfig),
        mensaje_final_enviado: `Configuración sala: ${roomConfig.empresa}`,
        created_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }

    // 5. Guardar Acta en Disco y Supabase
    if (action === "save_session") {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const filename = `reunion_${sala}_${dateStr}_${timeStr}.json`;

      const targetDir = path.resolve(process.cwd(), "Clientes", cliente, "reuniones");
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const filePath = path.join(targetDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf8");

      await supabase.from("ventas_interacciones").insert({
        id: `acta_${sala}_${Date.now()}`,
        prospecto_id: `p-${sala}`,
        canal: "Mesa_Bilingue",
        tipo_entrada: "acta_guardada",
        resumen_es: JSON.stringify({
          filename,
          empresa: cliente,
          savedAt: now.toISOString()
        }),
        mensaje_final_enviado: `Acta guardada: ${filename}`,
        created_at: now.toISOString()
      });

      return NextResponse.json({
        success: true,
        savedFile: filename,
        storagePath: `Clientes/${cliente}/reuniones/${filename}`
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dezaisaunoumhqpssols.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_HyhWSanS2mhByF476p_EzA_6oq2bQOT";

const supabase = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSala = searchParams.get("sala") || "henn";
  const sala = rawSala.toLowerCase().trim();

  try {
    const { data: rows, error } = await supabase
      .from("ventas_interacciones")
      .select("*")
      .eq("canal", "Mesa_Bilingue")
      .eq("prospecto_id", `p-${sala}`)
      .order("created_at", { ascending: true })
      .limit(300);

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
      rows.forEach(row => {
        if (row.tipo_entrada === "mensaje_voz" && row.metadatos?.mensaje) {
          messages.push(row.metadatos.mensaje);
        } else if (row.tipo_entrada === "config_sala" && row.metadatos?.roomConfig) {
          roomConfig = row.metadatos.roomConfig;
        } else if (row.tipo_entrada === "cost_params" && row.metadatos?.costParams) {
          costParams = row.metadatos.costParams;
        } else if (row.tipo_entrada === "active_pdf" && row.metadatos?.activePdf) {
          activePdf = row.metadatos.activePdf;
        }
      });
    }

    const defaultNames: Record<string, string> = {
      henn: "Móveis Henn",
      politorno: "Politorno",
      kappesberg: "Kappesberg",
      multimoveis: "Multimóveis",
      demobile: "Demóbile",
      madesa: "Madesa"
    };

    return NextResponse.json({
      sala,
      empresa: roomConfig?.empresa || defaultNames[sala] || "Cliente B2B",
      titulo: roomConfig?.titulo || `Mesa de Trabajo Bilingüe (${defaultNames[sala] || "Cliente B2B"})`,
      participantes1: roomConfig?.participantes1 || ["Mario Mojica"],
      participantes2: roomConfig?.participantes2 || ["Marcos Unnass"],
      allMessages: messages,
      costParams,
      activePdf
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({
      sala,
      empresa: "Móveis Henn",
      titulo: "Mesa de Trabajo Bilingüe (Móveis Henn)",
      participantes1: ["Mario Mojica"],
      participantes2: ["Marcos Unnass"],
      allMessages: [],
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
      activePdf: {
        nombre: "Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf",
        url: "/Clientes/Henn/Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf"
      }
    }, { headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sala = "henn" } = body;
    const cleanSala = String(sala).toLowerCase().trim();

    if (action === "list_configured_rooms") {
      const { data: rows } = await supabase
        .from("ventas_interacciones")
        .select("*")
        .eq("canal", "Mesa_Bilingue")
        .eq("tipo_entrada", "config_sala")
        .order("created_at", { ascending: false });

      const configuredRooms: any[] = [];
      const seenSalas = new Set<string>();

      if (rows && rows.length > 0) {
        rows.forEach(r => {
          const roomSlug = (r.prospecto_id || "").replace(/^p-/, "");
          if (roomSlug && !seenSalas.has(roomSlug) && r.metadatos?.roomConfig) {
            seenSalas.add(roomSlug);
            configuredRooms.push({
              slug: roomSlug,
              ...r.metadatos.roomConfig,
              updatedAt: r.created_at
            });
          }
        });
      }

      return NextResponse.json({ configuredRooms }, { headers: corsHeaders });
    }

    if (action === "configure_room") {
      const { roomConfig } = body;
      await supabase.from("ventas_interacciones").insert({
        prospecto_id: `p-${cleanSala}`,
        contacto_nombre: roomConfig.participantes2?.[0] || "Marcos Unnass",
        canal: "Mesa_Bilingue",
        tipo_entrada: "config_sala",
        contenido: `Configuración de sala ${cleanSala}: ${roomConfig.empresa} - ${roomConfig.titulo}`,
        metadatos: { roomConfig }
      });

      return NextResponse.json({ success: true, roomConfig }, { headers: corsHeaders });
    }

    if (action === "delete_room_data") {
      await supabase
        .from("ventas_interacciones")
        .delete()
        .eq("canal", "Mesa_Bilingue")
        .eq("prospecto_id", `p-${cleanSala}`)
        .eq("tipo_entrada", "mensaje_voz");

      return NextResponse.json({ success: true, message: `Diálogo de sala ${cleanSala} reiniciado` }, { headers: corsHeaders });
    }

    if (action === "add_message") {
      const { message } = body;
      await supabase.from("ventas_interacciones").insert({
        prospecto_id: `p-${cleanSala}`,
        contacto_nombre: message.speakerName || (message.speaker === "mario" ? "Mario Mojica" : "Marcos Unnass"),
        canal: "Mesa_Bilingue",
        tipo_entrada: "mensaje_voz",
        contenido: `[${message.speakerName || message.speaker}] ${message.originalText} --> ${message.translatedText}`,
        metadatos: { mensaje: message }
      });

      return NextResponse.json({ success: true, message }, { headers: corsHeaders });
    }

    if (action === "update_cost_params") {
      const { costParams } = body;
      await supabase.from("ventas_interacciones").insert({
        prospecto_id: `p-${cleanSala}`,
        contacto_nombre: "Mario Mojica",
        canal: "Mesa_Bilingue",
        tipo_entrada: "cost_params",
        contenido: `Parámetros de costos actualizados para ${cleanSala}`,
        metadatos: { costParams }
      });

      return NextResponse.json({ success: true, costParams }, { headers: corsHeaders });
    }

    if (action === "update_pdf") {
      const { activePdf } = body;
      await supabase.from("ventas_interacciones").insert({
        prospecto_id: `p-${cleanSala}`,
        contacto_nombre: "Mario Mojica",
        canal: "Mesa_Bilingue",
        tipo_entrada: "active_pdf",
        contenido: `PDF proyectado: ${activePdf.nombre}`,
        metadatos: { activePdf }
      });

      return NextResponse.json({ success: true, activePdf }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error guardando sesión" },
      { status: 500, headers: corsHeaders }
    );
  }
}

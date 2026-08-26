"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessagesSquare,
  Plus,
  ArrowRight,
  FolderOpen,
  Calendar,
  Clock,
  Building2,
  Users,
  FileText,
  Calculator,
  Download,
  Radio,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Trash2,
  RotateCcw
} from "lucide-react";
import { ModalConfiguracionSala, RoomConfigData } from "@/components/copiloto/ModalConfiguracionSala";

export default function MesaBilingueHubPage() {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [savedRooms, setSavedRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Salas de Negociación
  const [rooms, setRooms] = useState([
    {
      slug: "henn",
      empresa: "Móveis Henn",
      titulo: "Mesa de Trabajo Bilingüe Móveis Henn",
      participantes1: ["Mario Mojica"],
      participantes2: ["Marcos Unnass", "Alexia", "Jonas"],
      estado: "activa",
      volumen: "200 manuales/año",
      ahorro: "+R$ 49.254/año",
      doc: "Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf"
    },
    {
      slug: "politorno",
      empresa: "Politorno Móveis",
      titulo: "Mesa de Trabajo Bilingüe Politorno",
      participantes1: ["Mario Mojica"],
      participantes2: ["Everton", "Equipo P&D"],
      estado: "preparada",
      volumen: "150 manuales/año",
      ahorro: "+R$ 38.000/año",
      doc: "Manuales_Interativos_3D_B2B.pdf"
    },
    {
      slug: "kappesberg",
      empresa: "Kappesberg Móveis",
      titulo: "Mesa de Trabajo Bilingüe Kappesberg",
      participantes1: ["Mario Mojica"],
      participantes2: ["Dirección de Ingeniería"],
      estado: "preparada",
      volumen: "300 manuales/año",
      ahorro: "+R$ 72.000/año",
      doc: "Propuesta_Comercial_3dBimFab.pdf"
    }
  ]);

  const loadSavedActas = () => {
    fetch("/api/copiloto/sesion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list_saved_sessions" })
    })
      .then(res => res.json())
      .then(data => {
        setSavedRooms(data.actas || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSavedActas();
  }, []);

  const handleLaunchNewRoom = (config: RoomConfigData) => {
    const slug = config.empresa.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "sala-nueva";
    
    fetch("/api/copiloto/sesion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "configure_room",
        sala: slug,
        roomConfig: config
      })
    }).then(() => {
      window.location.href = `/traductor-vivo/${slug}`;
    });
  };

  // Borrar Acta del Histórico
  const handleDeleteActa = async (actaId: string, empresa: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el acta de "${empresa}"?`)) return;

    try {
      const res = await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_saved_session",
          id: actaId
        })
      });

      if (res.ok) {
        setSavedRooms(prev => prev.filter(a => a.id !== actaId));
        setActionNotice("Acta eliminada del historial con éxito.");
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (e) {
      alert("Error al eliminar acta");
    }
  };

  // Limpiar / Reiniciar Mensajes de una Sala
  const handleClearRoomMessages = async (slug: string, empresa: string) => {
    if (!confirm(`¿Deseas reiniciar la sala "${empresa}" y borrar todos sus mensajes previos de prueba?`)) return;

    try {
      const res = await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear_room_data",
          sala: slug
        })
      });

      if (res.ok) {
        setActionNotice(`Sala "${empresa}" reiniciada y limpia con éxito.`);
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (e) {
      alert("Error al reiniciar sala");
    }
  };

  // Eliminar Tarjeta de Sala del Directorio
  const handleDeleteRoomCard = (slug: string, empresa: string) => {
    if (!confirm(`¿Deseas eliminar la tarjeta de la sala "${empresa}" del directorio?`)) return;
    setRooms(prev => prev.filter(r => r.slug !== slug));
    handleClearRoomMessages(slug, empresa);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Modal de Configuración Inicial */}
      <ModalConfiguracionSala
        isOpen={isConfigModalOpen}
        initialData={{
          empresa: "",
          titulo: "Mesa de Trabajo Bilingüe B2B",
          idioma1: "es",
          idioma2: "pt",
          participantes1: ["Mario Mojica"],
          participantes2: ["Interlocutor"]
        }}
        onSave={handleLaunchNewRoom}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* 1. Header Principal del Módulo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-cyan-600/20">
            <MessagesSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                Mesa de Trabajo Bilingüe B2B
              </h1>
              <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>Nube Supabase Conectada</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Copiloto de negociación y calibración técnica en tiempo real (Português ⟷ Español) con transcripción simultánea, cotizador colaborativo y actas ejecutivas.
            </p>
          </div>
        </div>

        {/* Botón Nueva Sala */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-cyan-900/10 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Configurar Nueva Sala</span>
        </button>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. Sección: Salas Activas y de Negociación */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-600" />
            <span>Salas de Negociación en Vivo (Directorio de Fábricas RTA)</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{rooms.length} salas configuradas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.slug}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 hover:border-cyan-500 transition group"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                  <span className="font-extrabold text-sm text-slate-900 group-hover:text-cyan-800 transition">
                    {room.empresa}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      room.estado === "activa"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {room.estado === "activa" ? "🟢 En Vivo" : "⚪ Preparada"}
                    </span>
                    {/* Botón Borrar Sala */}
                    <button
                      onClick={() => handleDeleteRoomCard(room.slug, room.empresa)}
                      className="text-slate-300 hover:text-red-500 p-1 rounded transition"
                      title="Eliminar sala"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-700 leading-snug mb-2">
                  {room.titulo}
                </p>

                <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                    <span className="truncate"><strong>ES:</strong> {room.participantes1.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate"><strong>PT:</strong> {room.participantes2.join(", ")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Volumen: {room.volumen}</span>
                    <span className="font-bold text-emerald-700">{room.ahorro}</span>
                  </div>
                </div>
              </div>

              {/* Acciones de la Sala */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/traductor-vivo/${room.slug}`}
                  className="flex-1 bg-slate-900 hover:bg-cyan-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <span>Ir a la Sala</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleClearRoomMessages(room.slug, room.empresa)}
                  className="bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 text-slate-500 p-2 rounded-xl transition"
                  title="Reiniciar y limpiar mensajes de esta sala"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sección: Historial de Actas y Sesiones Guardadas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-600" />
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Historial de Actas y Notas Guardadas
              </h2>
              <p className="text-xs text-slate-500">
                Almacén persistente en <code className="text-cyan-700 font-mono bg-cyan-50 px-1 py-0.2 rounded">Clientes/[Empresa]/reuniones/</code> y Supabase PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {loading && <div className="py-6 text-center text-slate-400">Cargando actas registradas...</div>}

          {!loading && savedRooms.length === 0 && (
            <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No hay actas archivadas aún.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Al terminar una reunión y pulsar "Guardar" o "Descargar Notas", se generará automáticamente el registro histórico aquí.
              </p>
            </div>
          )}

          {savedRooms.map((acta) => {
            let info: any = {};
            try {
              info = JSON.parse(acta.resumen_es || "{}");
            } catch (e) {}

            const empresaTitle = info.titulo || info.empresa || "Mesa de Trabajo";
            const salaSlug = info.empresa?.toLowerCase().includes("henn") ? "henn" : "henn";

            return (
              <div key={acta.id} className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 transition">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      {empresaTitle}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                      Archivada
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(acta.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(acta.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {info.filename || "reunion.json"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/traductor-vivo/${salaSlug}`}
                    className="bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3 text-cyan-600" />
                    <span>Ver Sala</span>
                  </Link>
                  {/* Botón Borrar Acta */}
                  <button
                    onClick={() => handleDeleteActa(acta.id, empresaTitle)}
                    className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-300 p-1.5 rounded-lg transition"
                    title="Eliminar acta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

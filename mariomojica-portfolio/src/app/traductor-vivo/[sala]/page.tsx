"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useLiveTranslator } from "@/hooks/useLiveTranslator";
import { HennOperationCostEngine, CostParameters } from "@/components/copiloto/HennOperationCostEngine";
import { SplitBilingualFeed } from "@/components/copiloto/SplitBilingualFeed";
import { ModalConfiguracionSala, RoomConfigData } from "@/components/copiloto/ModalConfiguracionSala";
import { ModalHistorialActas } from "@/components/copiloto/ModalHistorialActas";
import {
  Save,
  Check,
  GripVertical,
  Calculator,
  FileText,
  Settings,
  MessageSquare,
  FileUp,
  FolderOpen,
  Copy,
  Trash2
} from "lucide-react";

export default function SalaBilingueMasterPage() {
  const params = useParams();
  const sala = (params?.sala as string) || "henn";

  // Modales
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);

  // Selector de Idioma de Escucha: "es" (Mario en Español) | "pt" (Cliente/YouTube en Portugués)
  const [activeVoiceLang, setActiveVoiceLang] = useState<"es" | "pt">("es");
  const [uiLang, setUiLang] = useState<"es" | "pt">("es");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copyLinkStatus, setCopyLinkStatus] = useState(false);

  // Parámetros de la Sala
  const [clienteNombre, setClienteNombre] = useState(sala === "henn" ? "Móveis Henn" : "Cliente B2B");
  const [tituloReunion, setTituloReunion] = useState(`Mesa de Trabajo Bilingüe (${sala === "henn" ? "Móveis Henn" : "Cliente B2B"})`);
  const [participantes1, setParticipantes1] = useState<string[]>(["Mario Mojica"]);
  const [participantes2, setParticipantes2] = useState<string[]>(["Marcos Unnass"]);

  // Parámetros de Costos Colaborativos
  const [sharedCostParams, setSharedCostParams] = useState<CostParameters>({
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
  });

  // Vista activa en móvil
  const [mobileActiveView, setMobileActiveView] = useState<"subtitulos" | "cotizador" | "documento" | "config">("subtitulos");

  // Pestañas del Panel Derecho en Escritorio
  const [activeRightTab, setActiveRightTab] = useState<"cotizador" | "documento" | "config">("cotizador");

  // Documento PDF Proyectado
  const [pdfUrl, setPdfUrl] = useState<string | null>("/Clientes/Henn/Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf");
  const [pdfNombre, setPdfNombre] = useState("Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Divisor de ancho de paneles en escritorio
  const [leftWidthPct, setLeftWidthPct] = useState(48);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isMeetingActive,
    interimText,
    messages,
    isTranslating,
    toggleMeeting,
    clearMessages
  } = useLiveTranslator({
    sala,
    activeLang: activeVoiceLang,
    participanteCliente: participantes2[0] || "Marcos Unnass",
    participanteMario: participantes1[0] || "Mario Mojica"
  });

  const isPt = uiLang === "pt";

  // Polling a Supabase para Configuración y Costos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/copiloto/sesion?sala=${sala}`);
        if (res.ok) {
          const data = await res.json();
          if (data.empresa && data.empresa !== clienteNombre) setClienteNombre(data.empresa);
          if (data.titulo && data.titulo !== tituloReunion) setTituloReunion(data.titulo);
          if (data.participantes1) setParticipantes1(data.participantes1);
          if (data.participantes2) setParticipantes2(data.participantes2);

          if (data.costParams) {
            setSharedCostParams(prev => {
              const isDiff = JSON.stringify(prev) !== JSON.stringify(data.costParams);
              return isDiff ? data.costParams : prev;
            });
          }
          if (data.activePdf && data.activePdf.nombre !== pdfNombre) {
            setPdfNombre(data.activePdf.nombre);
            if (data.activePdf.url) setPdfUrl(data.activePdf.url);
          }
        }
      } catch (err) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [sala, clienteNombre, tituloReunion, pdfNombre]);

  // Guardar configuración desde el modal
  const handleSaveModalConfig = async (config: RoomConfigData) => {
    setClienteNombre(config.empresa);
    setTituloReunion(config.titulo);
    setParticipantes1(config.participantes1);
    setParticipantes2(config.participantes2);
    setIsConfigModalOpen(false);

    try {
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "configure_room",
          sala,
          roomConfig: config
        })
      });
    } catch (e) {
      console.error("Error guardando config en Supabase:", e);
    }
  };

  // Broadcast cambio de costos
  const handleCostParamChange = async (newParams: CostParameters) => {
    setSharedCostParams(newParams);
    try {
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_cost_params",
          sala,
          costParams: newParams
        })
      });
    } catch (e) {}
  };

  // Broadcast PDF cargado
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfNombre(file.name);

      try {
        await fetch("/api/copiloto/sesion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_pdf",
            sala,
            activePdf: { nombre: file.name, url }
          })
        });
      } catch (err) {}
    }
  };

  // Copiar Enlace Directo
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const fullUrl = `https://mariomojica.com/traductor-vivo/${sala}`;
      navigator.clipboard.writeText(fullUrl);
      setCopyLinkStatus(true);
      setTimeout(() => setCopyLinkStatus(false), 3000);
    }
  };

  // Limpiar Diálogo de la Sala
  const handleClearDialog = () => {
    if (confirm("¿Deseas limpiar todos los mensajes del diálogo de esta sala?")) {
      clearMessages();
      setSaveStatus("Diálogo limpiado con éxito.");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Divisor arrastrable (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftPct = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newLeftPct >= 25 && newLeftPct <= 75) {
      setLeftWidthPct(newLeftPct);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Descargas MD + PDF Mario
  const handleDownloadBothForMario = async () => {
    try {
      const resMd = await fetch("/api/copiloto/exportar-acta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: "es",
          cliente: clienteNombre,
          documentoAdjunto: pdfNombre,
          summaryData: {
            costoHennMes: summaryData?.costoTotalOperacionHennMes || 6272.72,
            propuestaMarioMes: summaryData?.propuestaMarioTotalMes || 4390.90,
            ahorroAnual: summaryData?.ahorroNetoTotalAno || 22581.82,
            costoEstandarManualHenn: summaryData?.costoEstandarManualHenn || 780,
            costoEstandarManualMario: summaryData?.costoEstandarManualMario || 546,
            items: [
              { categoria: "Mano de Obra P&D", descripcion: "Diseñadores Técnicos CLT", cantidad: summaryData?.personasPed || 2.0, unidad: "personas", costoUnitario: summaryData?.salarioCltMes || 6000 },
              { categoria: "Volumen Anual", descripcion: "Manuales procesados al año", cantidad: summaryData?.manualesAno || 200, unidad: "manuales/año", costoUnitario: summaryData?.costoEstandarManualHenn || 780 }
            ]
          },
          messages
        })
      });
      if (resMd.ok) {
        const blob = await resMd.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Notas_Reunion_${clienteNombre.replace(/\s+/g, '_')}_ES_${new Date().toISOString().split("T")[0]}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {}

    try {
      const resPdf = await fetch("/api/copiloto/exportar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: "es",
          cliente: clienteNombre,
          documentoAdjunto: pdfNombre,
          summaryData: {
            costoHennMes: summaryData?.costoTotalOperacionHennMes || 6272.72,
            propuestaMarioMes: summaryData?.propuestaMarioTotalMes || 4390.90,
            ahorroAnual: summaryData?.ahorroNetoTotalAno || 22581.82,
            costoEstandarManualHenn: summaryData?.costoEstandarManualHenn || 780,
            costoEstandarManualMario: summaryData?.costoEstandarManualMario || 546,
            items: [
              { categoria: "Mano de Obra P&D", descripcion: "Diseñadores Técnicos CLT", cantidad: summaryData?.personasPed || 2.0, unidad: "personas", costoUnitario: summaryData?.salarioCltMes || 6000 },
              { categoria: "Volumen Anual", descripcion: "Manuales procesados al año", cantidad: summaryData?.manualesAno || 200, unidad: "manuales/año", costoUnitario: summaryData?.costoEstandarManualHenn || 780 }
            ]
          },
          messages
        })
      });
      if (resPdf.ok) {
        const blob = await resPdf.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Notas_Reunion_${clienteNombre.replace(/\s+/g, '_')}_ES_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {}
  };

  // Descarga PDF Cliente
  const handleDownloadPdfForCliente = async () => {
    try {
      const resPdf = await fetch("/api/copiloto/exportar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: "pt",
          cliente: clienteNombre,
          documentoAdjunto: pdfNombre,
          summaryData: {
            costoHennMes: summaryData?.costoTotalOperacionHennMes || 6272.72,
            propuestaMarioMes: summaryData?.propuestaMarioTotalMes || 4390.90,
            ahorroAnual: summaryData?.ahorroNetoTotalAno || 22581.82,
            costoEstandarManualHenn: summaryData?.costoEstandarManualHenn || 780,
            costoEstandarManualMario: summaryData?.costoEstandarManualMario || 546,
            items: [
              { categoria: "Mano de Obra P&D", descripcion: "Diseñadores Técnicos CLT", cantidad: summaryData?.personasPed || 2.0, unidad: "personas", costoUnitario: summaryData?.salarioCltMes || 6000 },
              { categoria: "Volumen Anual", descripcion: "Manuales procesados al año", cantidad: summaryData?.manualesAno || 200, unidad: "manuales/año", costoUnitario: summaryData?.costoEstandarManualHenn || 780 }
            ]
          },
          messages
        })
      });
      if (resPdf.ok) {
        const blob = await resPdf.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Notas_Reuniao_${clienteNombre.replace(/\s+/g, '_')}_PT_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {}
  };

  const handleSaveToWorkspace = async () => {
    setSaveStatus(isPt ? "Salvando no histórico..." : "Guardando en histórico...");
    try {
      const res = await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_session",
          sala,
          cliente: clienteNombre
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus(`Guardado en ${data.storagePath}`);
        setTimeout(() => setSaveStatus(null), 5000);
      }
    } catch (e) {
      setSaveStatus("Error al guardar");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div
      style={{ height: "100dvh", maxHeight: "100dvh", minHeight: "100dvh" }}
      className="w-full bg-slate-100 text-slate-900 font-sans p-1 sm:p-2.5 flex flex-col justify-between gap-1 sm:gap-2 overflow-hidden fixed inset-0"
    >
      {/* Modales */}
      <ModalConfiguracionSala
        isOpen={isConfigModalOpen}
        initialData={{
          empresa: clienteNombre,
          titulo: tituloReunion,
          idioma1: "es",
          idioma2: "pt",
          participantes1,
          participantes2
        }}
        onSave={handleSaveModalConfig}
        onClose={() => setIsConfigModalOpen(false)}
      />

      <ModalHistorialActas
        isOpen={isHistorialModalOpen}
        sala={sala}
        onClose={() => setIsHistorialModalOpen(false)}
      />

      {/* 1. Header Compacto Fijo con Botones Alineados a la Marca */}
      <header className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 shadow-sm flex items-center justify-between gap-2 shrink-0 select-none w-full z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
            MM
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                {clienteNombre}
              </h1>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="text-[10px] text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-0.5 rounded font-bold transition shrink-0"
                title="Configurar empresa y participantes"
              >
                Configurar
              </button>
              <button
                onClick={handleCopyLink}
                className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 transition shrink-0"
                title="Copiar enlace directo"
              >
                {copyLinkStatus ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copyLinkStatus ? "Copiado!" : "Copiar Link"}</span>
              </button>
              {/* Botón Limpiar Diálogo */}
              <button
                onClick={handleClearDialog}
                className="text-[10px] text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 transition shrink-0"
                title="Limpiar diálogo de prueba"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Acciones de la Marca */}
        <div className="flex items-center gap-2 shrink-0">
          {/* SELECTOR RÁPIDO DE IDIOMA DE ESCUCHA (ES: Mario / PT: YouTube o Cliente) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300 text-[10px] sm:text-xs font-extrabold shadow-inner">
            <button
              onClick={() => { setActiveVoiceLang("es"); setUiLang("es"); }}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeVoiceLang === "es"
                  ? "bg-white text-cyan-800 shadow-sm border border-slate-200 font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Escuchar en Español (Mi voz) y traducir a Portugués"
            >
              ES
            </button>
            <button
              onClick={() => { setActiveVoiceLang("pt"); setUiLang("pt"); }}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeVoiceLang === "pt"
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200 font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Escuchar en Português (Cliente / YouTube) y traducir a Español"
            >
              PT
            </button>
          </div>

          {/* BOTÓN MAESTRO: INICIAR REUNIÓN (Estilo Marca Cyan-700 / Sin Icono) */}
          <button
            onClick={toggleMeeting}
            className={`px-4 py-1.5 rounded-xl font-extrabold text-xs transition shadow-sm ${
              isMeetingActive
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-cyan-700 hover:bg-cyan-800 text-white"
            }`}
            title={isMeetingActive ? "Finalizar captura de reunión" : "Iniciar captura continua de la reunión"}
          >
            <span>{isMeetingActive ? "Finalizar Reunión" : "Iniciar Reunión"}</span>
          </button>

          {/* BOTÓN ACTAS (Sin Icono) */}
          <button
            onClick={() => setIsHistorialModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 transition shadow-sm"
            title="Ver actas y notas guardadas"
          >
            <span>Actas</span>
          </button>

          {/* BOTÓN GUARDAR (Estilo Marca Cyan-700 + Único Icono) */}
          <button
            onClick={handleSaveToWorkspace}
            className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-sm"
            title="Guardar notas en el histórico"
          >
            <Save className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isPt ? "Salvar" : "Guardar"}</span>
          </button>
        </div>
      </header>

      {/* 2. Pestañas Móvil y Tablet */}
      <div className="flex lg:hidden bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm justify-between text-[11px] font-bold shrink-0 select-none w-full z-20">
        <button
          onClick={() => setMobileActiveView("subtitulos")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition ${
            mobileActiveView === "subtitulos" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <MessageSquare className="w-3 h-3 text-cyan-600" />
          <span>Subtítulos</span>
        </button>

        <button
          onClick={() => setMobileActiveView("cotizador")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition ${
            mobileActiveView === "cotizador" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <Calculator className="w-3 h-3 text-cyan-600" />
          <span>Costos</span>
        </button>

        <button
          onClick={() => setMobileActiveView("documento")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition ${
            mobileActiveView === "documento" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <FileText className="w-3 h-3 text-slate-600" />
          <span>Doc</span>
        </button>

        <button
          onClick={() => setMobileActiveView("config")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition ${
            mobileActiveView === "config" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <Settings className="w-3 h-3 text-slate-600" />
          <span>Sala</span>
        </button>
      </div>

      {saveStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0 select-none w-full">
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="truncate">{saveStatus}</span>
        </div>
      )}

      {/* 3. CONTENEDOR PRINCIPAL */}
      <main
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row items-stretch gap-0 relative overflow-hidden min-h-0 w-full"
      >
        {/* PANEL IZQUIERDO: Subtítulos Bilingües */}
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftWidthPct}%` : "100%" }}
          className={`flex flex-col h-full overflow-hidden select-text w-full lg:w-auto min-h-0 ${
            mobileActiveView === "subtitulos" ? "flex" : "hidden lg:flex"
          }`}
        >
          <SplitBilingualFeed
            messages={messages}
            interimText={interimText}
            isTranslating={isTranslating}
            clienteNombre={clienteNombre}
            participanteCliente={participantes2.join(", ")}
            participanteMario={participantes1.join(", ")}
            uiLang={uiLang}
            onDownloadBoth={handleDownloadBothForMario}
            onDownloadPtPdf={handleDownloadPdfForCliente}
          />
        </div>

        {/* BARRA DIVISORA ARRASTRABLE (Solo en Desktop) */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden lg:flex w-3 hover:w-3.5 items-center justify-center cursor-col-resize hover:bg-cyan-500/20 transition-all z-10 group select-none"
          title={isPt ? "Arraste para redimensionar" : "Arrastra para redimensionar"}
        >
          <div className="w-1 h-12 rounded-full bg-slate-300 group-hover:bg-cyan-600 transition flex items-center justify-center">
            <GripVertical className="w-2.5 h-2.5 text-slate-500 group-hover:text-white" />
          </div>
        </div>

        {/* PANEL DERECHO: Pestañas Intercambiables */}
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftWidthPct}%` : "100%" }}
          className={`flex flex-col h-full overflow-hidden bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm w-full lg:w-auto min-h-0 ${
            mobileActiveView !== "subtitulos" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Barra de Pestañas en Desktop */}
          <div className="hidden lg:flex items-center justify-between border-b border-slate-200 px-3 py-1.5 bg-slate-50 shrink-0 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveRightTab("cotizador")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeRightTab === "cotizador"
                    ? "bg-white text-cyan-800 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-600" />
                <span>{isPt ? "Cotizador de Custos" : "Cotizador de Costos"}</span>
              </button>

              <button
                onClick={() => setActiveRightTab("documento")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeRightTab === "documento"
                    ? "bg-white text-cyan-800 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>{isPt ? "Apresentação / PDF" : "Presentación / PDF"}</span>
              </button>

              <button
                onClick={() => setActiveRightTab("config")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeRightTab === "config"
                    ? "bg-white text-cyan-800 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span>{isPt ? "Configuração da Sala" : "Configurar Sala"}</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
              {isPt ? "Painel B2B" : "Panel B2B"}
            </span>
          </div>

          {/* CONTENIDO SEGÚN LA PESTAÑA */}
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-2.5 min-h-0">
            {/* 1. COTIZADOR DE COSTOS ESTABLE */}
            {(activeRightTab === "cotizador" || mobileActiveView === "cotizador") && (
              <div className={`h-full ${mobileActiveView === "cotizador" ? "block" : "hidden lg:block"}`}>
                <HennOperationCostEngine
                  uiLang={uiLang}
                  initialParams={sharedCostParams}
                  onParamChange={handleCostParamChange}
                  onSummaryChange={setSummaryData}
                />
              </div>
            )}

            {/* 2. PRESENTACIÓN / VISOR DE PDF NATIVO */}
            {(activeRightTab === "documento" || mobileActiveView === "documento") && (
              <div className={`h-full flex flex-col gap-2 ${mobileActiveView === "documento" ? "flex" : "hidden lg:flex"}`}>
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-1 bg-cyan-100 text-cyan-800 rounded-lg shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 block truncate">
                        {pdfNombre}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {isPt ? "Documento sincronizado na reunião" : "Documento sincronizado en la reunión"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePdfUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                    >
                      <FileUp className="w-3 h-3" />
                      <span>{isPt ? "Carregar PDF" : "Cargar PDF"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-200 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center min-h-[220px]">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-lg bg-white"
                      title="Visor PDF Oficial"
                    />
                  ) : (
                    <div className="text-center text-slate-500 p-6">
                      <FileUp className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                      <p className="font-bold text-xs text-slate-700">Ningún documento cargado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CONFIGURACIÓN DE SALA */}
            {(activeRightTab === "config" || mobileActiveView === "config") && (
              <div className={`p-2.5 sm:p-3 space-y-3 text-xs pb-20 ${mobileActiveView === "config" ? "block" : "hidden lg:block"}`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    {isPt ? "Configuração da Sala de Reunião B2B" : "Configuración de la Sala de Reunión B2B"}
                  </h3>
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Editar en Modal</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-600 block text-[10px]">Empresa / Cliente:</span>
                    <span className="font-extrabold text-sm text-slate-900">{clienteNombre}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-600 block text-[10px]">Título de la Sesión:</span>
                    <span className="font-extrabold text-xs text-slate-900 truncate block">{tituloReunion}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-cyan-800 block text-[10px]">Participantes (Español):</span>
                    <span className="font-semibold text-xs text-slate-800">{participantes1.join(", ")}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-emerald-800 block text-[10px]">Participantes (Português):</span>
                    <span className="font-semibold text-xs text-slate-800">{participantes2.join(", ")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

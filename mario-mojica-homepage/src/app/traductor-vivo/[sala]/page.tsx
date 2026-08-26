"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useLiveTranslator } from "@/hooks/useLiveTranslator";
import { HennOperationCostEngine } from "@/components/copiloto/HennOperationCostEngine";
import { SplitBilingualFeed } from "@/components/copiloto/SplitBilingualFeed";
import {
  Mic,
  MicOff,
  Save,
  Check,
  GripVertical,
  Calculator,
  FileText,
  Settings,
  Radio,
  MessageSquare,
  Upload,
  FileUp,
  X,
  ExternalLink
} from "lucide-react";

export default function SalaBilingueMasterPage() {
  const params = useParams();
  const sala = (params?.sala as string) || "henn";

  const [uiLang, setUiLang] = useState<"es" | "pt">("es");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Parámetros Dinámicos de la Sala
  const [clienteNombre, setClienteNombre] = useState(sala === "henn" ? "Móveis Henn" : "Cliente B2B");
  const [participanteCliente, setParticipanteCliente] = useState(sala === "henn" ? "Marcos Unnass" : "Interlocutor");
  const [participanteMario, setParticipanteMario] = useState("Mario Mojica");

  // Vista activa en móvil: "subtitulos" | "cotizador" | "documento" | "config"
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
    isListening,
    interimText,
    messages,
    toggleListening
  } = useLiveTranslator({
    sala,
    role: "mario",
    myLang: "es",
    targetLang: "pt"
  });

  const isPt = uiLang === "pt";

  // Manejador para cargar archivo PDF local
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfNombre(file.name);
    }
  };

  // Manejo del divisor arrastrable (Escritorio)
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

  // Descarga simultánea de MD + PDF en español para Mario
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
    } catch (e) {
      console.error("Error descargando MD:", e);
    }

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
    } catch (e) {
      console.error("Error descargando PDF:", e);
    }
  };

  // Descarga en PDF para el cliente en portugués
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
    } catch (e) {
      console.error("Error descargando PDF PT:", e);
    }
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
        setSaveStatus(`Guardado en Clientes/${sala}/reuniones/${data.savedFile}`);
        setTimeout(() => setSaveStatus(null), 5000);
      }
    } catch (e) {
      setSaveStatus("Error al guardar");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-100 text-slate-900 font-sans p-2 sm:p-3 flex flex-col justify-between gap-2 overflow-hidden">
      {/* Header Adaptativo */}
      <header className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 shadow-sm flex items-center justify-between gap-2 shrink-0 select-none w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-extrabold text-xs sm:text-sm shadow-sm shrink-0">
            MM
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                {clienteNombre}
              </h1>
              <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-200 items-center gap-1">
                <Radio className="w-2 h-2 text-emerald-600 animate-pulse" />
                <span>{isPt ? "Ao Vivo" : "En Vivo"}</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              {participanteMario} & {participanteCliente}
            </p>
          </div>
        </div>

        {/* Controles de Cabecera */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Selector de Idioma */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => setUiLang("es")}
              className={`px-2 py-0.5 rounded transition ${
                !isPt ? "bg-white text-cyan-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setUiLang("pt")}
              className={`px-2 py-0.5 rounded transition ${
                isPt ? "bg-white text-cyan-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              PT
            </button>
          </div>

          {/* Botón Micrófono */}
          <button
            onClick={toggleListening}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition shadow-sm ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }`}
            title={isListening ? "Pausar micrófono" : "Activar micrófono"}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isListening ? (isPt ? "Gravando" : "Grabando") : (isPt ? "Áudio" : "Audio")}</span>
          </button>

          {/* Botón Guardar */}
          <button
            onClick={handleSaveToWorkspace}
            className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center gap-1 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isPt ? "Salvar" : "Guardar"}</span>
          </button>
        </div>
      </header>

      {/* Pestañas de Navegación Móvil y Tablet (100% Ancho) */}
      <div className="flex lg:hidden bg-white border border-slate-200 rounded-xl p-1 shadow-sm justify-between text-xs font-bold shrink-0 select-none w-full">
        <button
          onClick={() => setMobileActiveView("subtitulos")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition ${
            mobileActiveView === "subtitulos" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
          <span>Subtítulos</span>
        </button>

        <button
          onClick={() => setMobileActiveView("cotizador")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition ${
            mobileActiveView === "cotizador" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-600" />
          <span>Costos</span>
        </button>

        <button
          onClick={() => setMobileActiveView("documento")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition ${
            mobileActiveView === "documento" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Doc</span>
        </button>

        <button
          onClick={() => setMobileActiveView("config")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition ${
            mobileActiveView === "config" ? "bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm" : "text-slate-600"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-600" />
          <span>Sala</span>
        </button>
      </div>

      {saveStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 select-none w-full">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <main
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row items-stretch gap-0 relative overflow-hidden min-h-0 w-full"
      >
        {/* PANEL IZQUIERDO: Subtítulos Bilingües (100% en móvil, % configurable en desktop) */}
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftWidthPct}%` : "100%" }}
          className={`flex flex-col h-full overflow-hidden select-text w-full lg:w-auto ${
            mobileActiveView === "subtitulos" ? "flex" : "hidden lg:flex"
          }`}
        >
          <SplitBilingualFeed
            messages={messages}
            interimText={interimText}
            clienteNombre={clienteNombre}
            participanteCliente={participanteCliente}
            participanteMario={participanteMario}
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

        {/* PANEL DERECHO: Pestañas Intercambiables (100% en móvil cuando no es subtítulos) */}
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftWidthPct}%` : "100%" }}
          className={`flex flex-col h-full overflow-hidden bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm w-full lg:w-auto ${
            mobileActiveView !== "subtitulos" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Barra de Pestañas en Desktop */}
          <div className="hidden lg:flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-50 shrink-0 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveRightTab("cotizador")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 min-h-0">
            {/* 1. COTIZADOR DE COSTOS */}
            {(activeRightTab === "cotizador" || mobileActiveView === "cotizador") && (
              <div className={`h-full ${mobileActiveView === "cotizador" ? "block" : "hidden lg:block"}`}>
                <HennOperationCostEngine uiLang={uiLang} onSummaryChange={setSummaryData} />
              </div>
            )}

            {/* 2. PRESENTACIÓN / VISOR DE PDF NATIVO */}
            {(activeRightTab === "documento" || mobileActiveView === "documento") && (
              <div className={`h-full flex flex-col gap-2.5 ${mobileActiveView === "documento" ? "flex" : "hidden lg:flex"}`}>
                {/* Cabecera del Visor de PDF y Botón de Subida */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs text-slate-900 block truncate">
                        {pdfNombre}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isPt ? "Documento em exibição sincronizada para a reunião" : "Documento en proyección sincronizada para la reunión"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePdfUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>{isPt ? "Carregar PDF" : "Cargar PDF"}</span>
                    </button>
                  </div>
                </div>

                {/* Lienzo del PDF */}
                <div className="flex-1 bg-slate-200 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center min-h-[300px]">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-lg bg-white"
                      title="Visor PDF Oficial"
                    />
                  ) : (
                    <div className="text-center text-slate-500 p-8">
                      <FileUp className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                      <p className="font-bold text-sm text-slate-700">Ningún documento PDF cargado</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Haz clic en "Cargar PDF" para proyectar una propuesta comercial, catálogo técnico o plano para la reunión.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CONFIGURACIÓN DE SALA */}
            {(activeRightTab === "config" || mobileActiveView === "config") && (
              <div className={`p-3 sm:p-4 space-y-3 text-xs ${mobileActiveView === "config" ? "block" : "hidden lg:block"}`}>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 border-b border-slate-100 pb-2">
                  {isPt ? "Configuração da Sala de Reunião B2B" : "Configuración de la Sala de Reunión B2B"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Nombre de la Empresa / Cliente:</label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Nombre del Interlocutor (Cliente):</label>
                    <input
                      type="text"
                      value={participanteCliente}
                      onChange={e => setParticipanteCliente(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Tu Nombre / Empresa:</label>
                    <input
                      type="text"
                      value={participanteMario}
                      onChange={e => setParticipanteMario(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Identificador de Sala (URL):</label>
                    <input
                      type="text"
                      disabled
                      value={sala}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-500"
                    />
                  </div>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 text-slate-700 text-[11px] sm:text-xs">
                  <p className="font-bold text-cyan-900 mb-1">💡 Enlaces de Acceso:</p>
                  <p className="mb-0.5">
                    • <strong>Local (PC):</strong> <code className="bg-white px-1 py-0.2 rounded text-cyan-800 font-mono font-bold">http://localhost:3003/traductor-vivo/{sala}</code>
                  </p>
                  <p>
                    • <strong>Web Oficial:</strong> <code className="bg-white px-1 py-0.2 rounded text-cyan-800 font-mono font-bold">https://mariomojica.com/traductor-vivo/{sala}</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

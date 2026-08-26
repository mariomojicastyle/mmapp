"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useLiveTranslator } from "@/hooks/useLiveTranslator";
import { HennOperationCostEngine } from "@/components/copiloto/HennOperationCostEngine";
import { SplitBilingualFeed } from "@/components/copiloto/SplitBilingualFeed";
import { Mic, MicOff, Save, Check, GripVertical, Calculator, FileText, Settings, Radio, MessageSquare } from "lucide-react";

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
  const [documentoUrl, setDocumentoUrl] = useState("/docs/MANIFIESTO_NEGOCIO.md");

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

  // Manejo del divisor arrastrable
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
    <div className="h-screen bg-slate-100 text-slate-900 font-sans p-2 sm:p-3 flex flex-col justify-between gap-2 overflow-hidden">
      {/* Header Adaptativo Móvil & Escritorio */}
      <header className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 shadow-sm flex items-center justify-between gap-2 shrink-0 select-none">
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

      {/* Pestañas de Navegación Exclusivas para Móvil (Ocultas en Desktop) */}
      <div className="flex lg:hidden bg-white border border-slate-200 rounded-xl p-1 shadow-sm justify-around text-xs font-bold shrink-0 select-none">
        <button
          onClick={() => setMobileActiveView("subtitulos")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
            mobileActiveView === "subtitulos" ? "bg-cyan-50 text-cyan-800 border border-cyan-200" : "text-slate-600"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
          <span>Subtítulos</span>
        </button>

        <button
          onClick={() => setMobileActiveView("cotizador")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
            mobileActiveView === "cotizador" ? "bg-cyan-50 text-cyan-800 border border-cyan-200" : "text-slate-600"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-600" />
          <span>Costos</span>
        </button>

        <button
          onClick={() => setMobileActiveView("documento")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
            mobileActiveView === "documento" ? "bg-cyan-50 text-cyan-800 border border-cyan-200" : "text-slate-600"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Doc</span>
        </button>

        <button
          onClick={() => setMobileActiveView("config")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
            mobileActiveView === "config" ? "bg-cyan-50 text-cyan-800 border border-cyan-200" : "text-slate-600"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-600" />
          <span>Sala</span>
        </button>
      </div>

      {saveStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 select-none">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <main
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row items-stretch gap-0 relative overflow-hidden min-h-0"
      >
        {/* PANEL IZQUIERDO: Subtítulos Bilingües */}
        <div
          style={{ width: `${leftWidthPct}%` }}
          className={`flex flex-col h-full min-w-0 lg:min-w-[320px] overflow-hidden select-text ${
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

        {/* PANEL DERECHO: Pestañas Intercambiables */}
        <div
          style={{ width: `${100 - leftWidthPct}%` }}
          className={`flex flex-col h-full min-w-0 lg:min-w-[360px] overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm ${
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
          <div className="flex-1 overflow-y-auto p-1 sm:p-2">
            {((activeRightTab === "cotizador" && typeof window !== "undefined" && window.innerWidth >= 1024) || mobileActiveView === "cotizador") && (
              <HennOperationCostEngine uiLang={uiLang} onSummaryChange={setSummaryData} />
            )}

            {((activeRightTab === "documento" && typeof window !== "undefined" && window.innerWidth >= 1024) || mobileActiveView === "documento") && (
              <div className="h-full flex flex-col p-2 sm:p-3 gap-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-xs text-slate-800">Proyección de Documento / PDF</span>
                  <input
                    type="text"
                    value={documentoUrl}
                    onChange={e => setDocumentoUrl(e.target.value)}
                    placeholder="URL del PDF..."
                    className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-40 sm:w-64 outline-none"
                  />
                </div>
                <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                  <iframe
                    src={documentoUrl}
                    className="w-full h-full rounded-lg border border-slate-300 shadow-sm bg-white"
                    title="Visor de Documento"
                  />
                </div>
              </div>
            )}

            {((activeRightTab === "config" && typeof window !== "undefined" && window.innerWidth >= 1024) || mobileActiveView === "config") && (
              <div className="p-3 sm:p-4 space-y-3 text-xs">
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useLiveTranslator } from "@/hooks/useLiveTranslator";
import { HennOperationCostEngine } from "@/components/copiloto/HennOperationCostEngine";
import { SplitBilingualFeed } from "@/components/copiloto/SplitBilingualFeed";
import { Mic, MicOff, Save, Check, GripVertical, Calculator, FileText, Settings, Radio } from "lucide-react";

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

  // Pestañas del Panel Derecho
  const [activeRightTab, setActiveRightTab] = useState<"cotizador" | "documento" | "config">("cotizador");
  const [documentoUrl, setDocumentoUrl] = useState("/docs/MANIFIESTO_NEGOCIO.md");

  // Divisor de ancho de paneles
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
    <div className="h-screen bg-slate-100 text-slate-900 font-sans p-3 flex flex-col justify-between gap-2.5 overflow-hidden">
      {/* Header de Producción de la Suite */}
      <header className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            MM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm text-slate-900 leading-tight">
                {isPt ? `Mesa de Trabalho Bilíngue (${clienteNombre})` : `Mesa de Trabajo Bilingüe (${clienteNombre})`}
              </h1>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>{isPt ? "Sessão Ativa" : "Sesión en Vivo"}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {participanteMario} & {participanteCliente} | {isPt ? "Copilot para Google Meet" : "Copilot para Google Meet"}
            </p>
          </div>
        </div>

        {/* Barra de Acciones de Operación Real */}
        <div className="flex items-center gap-2">
          {/* Selector Global de Idioma */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setUiLang("es")}
              className={`px-2.5 py-1 rounded transition ${
                !isPt ? "bg-white text-cyan-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setUiLang("pt")}
              className={`px-2.5 py-1 rounded transition ${
                isPt ? "bg-white text-cyan-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              PT
            </button>
          </div>

          {/* Botón Principal de Captura de Audio */}
          <button
            onClick={toggleListening}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }`}
            title={isListening ? "Pausar captura de micrófono" : "Activar micrófono para subtítulos en vivo"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? (isPt ? "Microfone Ativo" : "Micrófono Activo") : (isPt ? "Ativar Áudio" : "Activar Micrófono")}</span>
          </button>

          {/* Guardar en Histórico */}
          <button
            onClick={handleSaveToWorkspace}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isPt ? "Salvar" : "Guardar"}</span>
          </button>
        </div>
      </header>

      {saveStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm shrink-0 select-none">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <main
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row items-stretch gap-0 relative overflow-hidden h-[calc(100vh-85px)]"
      >
        {/* PANEL IZQUIERDO: Subtítulos Bilingües en Dos Franjas Fluidas y Altas */}
        <div
          style={{ width: `${leftWidthPct}%` }}
          className="flex flex-col h-full min-w-[320px] overflow-hidden select-text"
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

        {/* BARRA DIVISORA ARRASTRABLE */}
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
          className="flex flex-col h-full min-w-[360px] overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm"
        >
          {/* Barra de Pestañas */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-50 shrink-0 select-none">
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

          {/* CONTENIDO DE LA PESTAÑA */}
          <div className="flex-1 overflow-y-auto p-1">
            {activeRightTab === "cotizador" && (
              <HennOperationCostEngine uiLang={uiLang} onSummaryChange={setSummaryData} />
            )}

            {activeRightTab === "documento" && (
              <div className="h-full flex flex-col p-3 gap-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">Proyección de Documento / PDF</span>
                    <span className="text-[10px] text-slate-400">Scroll sincronizado para Google Meet</span>
                  </div>
                  <input
                    type="text"
                    value={documentoUrl}
                    onChange={e => setDocumentoUrl(e.target.value)}
                    placeholder="URL del PDF o documento..."
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-64 outline-none"
                  />
                </div>
                <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-4">
                  <iframe
                    src={documentoUrl}
                    className="w-full h-full rounded-lg border border-slate-300 shadow-sm bg-white"
                    title="Visor de Documento"
                  />
                </div>
              </div>
            )}

            {activeRightTab === "config" && (
              <div className="p-4 space-y-4 text-xs">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  {isPt ? "Configuração da Sala de Reunião B2B" : "Configuración de la Sala de Reunión B2B"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-slate-700 text-xs">
                  <p className="font-bold text-cyan-900 mb-1">💡 Enlaces de Acceso y Modo de Operación:</p>
                  <p className="mb-1">
                    • <strong>En tu computador (Presentador):</strong> <code className="bg-white px-1.5 py-0.5 rounded text-cyan-800 font-mono font-bold">http://localhost:3003/traductor-vivo/{sala}</code>
                  </p>
                  <p>
                    • <strong>Enlace Web Público Permanente:</strong> <code className="bg-white px-1.5 py-0.5 rounded text-cyan-800 font-mono font-bold">https://mariomojica.com/traductor-vivo/{sala}</code>
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

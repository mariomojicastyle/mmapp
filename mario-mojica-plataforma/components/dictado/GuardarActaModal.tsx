"use client";

import React, { useState } from "react";
import { 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X, 
  HardDrive, 
  Printer, 
  ExternalLink,
  Sparkles,
  Building2,
  FolderCheck,
  Copy,
  Check
} from "lucide-react";
import { SpeechSegment } from "@/hooks/useSpeechDictation";

interface GuardarActaModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: SpeechSegment[];
  durationSeconds: number;
  idioma: string;
}

export function GuardarActaModal({
  isOpen,
  onClose,
  segments,
  durationSeconds,
  idioma,
}: GuardarActaModalProps) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [asunto, setAsunto] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    fileNameHtml: string;
    filePathHtml: string;
    driveDisponible: boolean;
    htmlContent: string;
    resumenPuntos?: string[];
    acuerdos?: { tarea: string; responsable: string; plazo: string }[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGuardarActa = async () => {
    if (segments.length === 0) {
      setErrorMsg("No hay texto capturado en la pizarra para generar el acta.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/dictado/guardar-acta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre: clienteNombre.trim() || "Cliente B2B",
          asunto: asunto.trim() || "Reunión de Coordinación Técnica",
          duracionSegundos: durationSeconds,
          idioma: idioma,
          segmentos: segments.map((s) => ({
            text: s.originalText,
            translation: s.translatedText,
            timestamp: s.timestamp,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un error al generar el acta.");
      }

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión al generar el acta.";
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar resumen y acuerdos formateados para pegar directamente en Google Docs o email
  const handleCopiarResumen = () => {
    if (!result) return;
    const puntos = (result.resumenPuntos || [])
      .map((p) => `• ${p}`)
      .join("\n");

    const acuerdosTexto = (result.acuerdos || [])
      .map((a) => `- ${a.tarea} (Responsable: ${a.responsable}, Plazo: ${a.plazo})`)
      .join("\n");

    const textoCompleto = `ACTA DE REUNIÓN B2B - ${clienteNombre || "Cliente"}\n` +
      `Asunto: ${asunto || "Coordinación Técnica"}\n\n` +
      `PUNTOS CLAVE TRATADOS:\n${puntos}\n\n` +
      `ACUERDOS Y COMPROMISOS:\n${acuerdosTexto}`;

    navigator.clipboard.writeText(textoCompleto).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  // Abrir vista previa HTML en nueva pestaña de Chrome para lectura o guardar PDF
  const handleOpenPreview = () => {
    if (!result) return;
    const blob = new Blob([result.htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-blue-500/10 dark:bg-[#1368AA]/20 text-[#1368AA] dark:text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Guardar Acta Ejecutiva B2B
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google Drive: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">G:\Mi unidad\Reuniones_B2B\</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 space-y-4">
          {!result ? (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Cliente / Empresa
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Ej. Politorno Móveis - Marcelo"
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1368AA] dark:focus:ring-[#1368AA] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asunto u Objetivo de la Reunión
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Ej. Revisión Técnica 3D y Automatización de Manuales"
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1368AA] dark:focus:ring-[#1368AA] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Resumen del Contenido a Procesar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Segmentos transcritos: <strong className="text-slate-900 dark:text-white">{segments.length}</strong></span>
                <span>Duración estimada: <strong className="text-slate-900 dark:text-white font-mono">{Math.floor(durationSeconds / 60)} min</strong></span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Diarización IA activa
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Botón de Acción Principal */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleGuardarActa}
                  disabled={isGenerating || segments.length === 0}
                  className="rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1368AA] hover:bg-[#1368AA]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini procesando diarización y acta...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar y Guardar en Drive</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Pantalla de Confirmación de Éxito */
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Acta Guardada Exitosamente!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  El acta ejecutiva con diagramación oficial, logos de Mario Mojica y 3dBimFab, diarización y acuerdos To-Do ha quedado lista.
                </p>
              </div>

              {/* Caja de Ruta Guardada en Google Drive */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-left space-y-2">
                <div className="flex items-start gap-2.5 text-xs">
                  <FolderCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Documento HTML en Google Drive:
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 break-all select-all block mt-0.5">
                      {result.filePathHtml}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                      💡 Doble clic para leer al instante en Google Chrome o abrir desde la web de Google Drive / Google Docs.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción Inmediata (Cápsulas) */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="rounded-full px-4 py-2 text-xs font-semibold bg-[#1368AA] text-white hover:bg-[#1368AA]/90 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir en Google Chrome</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="rounded-full px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Guardar como PDF / Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopiarResumen}
                  className={`rounded-full px-4 py-2 text-xs font-semibold border flex items-center gap-1.5 transition-all active:scale-95 ${
                    copiedSuccess
                      ? "bg-emerald-600 text-white border-transparent shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                  }`}
                  title="Copiar puntos clave y acuerdos para pegar directamente en un Google Doc o correo"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar para Google Docs</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    onClose();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                >
                  Cerrar y volver a la pizarra
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

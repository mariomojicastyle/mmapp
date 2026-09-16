"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function TranscriptFeed({
  segments,
  interimText,
  sourceLangName = "Español",
  targetLangName,
  autoTranslate = true,
  onClear,
}: {
  segments: { id: string; originalText: string; translatedText: string; timestamp: number }[];
  interimText: string;
  sourceLangName?: string;
  targetLangName: string;
  autoTranslate?: boolean;
  onClear?: () => void;
}) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  // Copiar todo el texto original
  const handleCopyOriginal = () => {
    const fullText = segments.map((s) => s.originalText).join("\n\n");
    if (!fullText.trim()) return;
    navigator.clipboard.writeText(fullText);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  // Copiar toda la traducción
  const handleCopyTranslation = () => {
    const fullText = segments.map((s) => s.translatedText).join("\n\n");
    if (!fullText.trim()) return;
    navigator.clipboard.writeText(fullText);
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 2000);
  };

  return (
    <div
      className={`grid gap-3 sm:gap-4 flex-1 min-h-[550px] transition-all ${
        autoTranslate ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      }`}
    >
      {/* COLUMNA 1: VOZ ORIGINAL (TIEMPO REAL) */}
      <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-sm overflow-hidden w-full">
        {/* Cabecera de Columna */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0B0F17]/50 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1368AA] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {sourceLangName} (Dictado en Vivo)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onClear && (
              <button
                onClick={onClear}
                disabled={segments.length === 0 && !interimText}
                className="rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300"
                title="Limpiar pizarra y borrar texto"
              >
                Limpiar Pizarra
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo del Texto - Flujo Continuo compacto, tipografía natural y selección fluida */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] space-y-2 select-text cursor-text min-h-[380px]">
          {segments.length === 0 && !interimText && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-16 px-4 select-none">
              <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
                Tu dictado aparecerá aquí en tiempo real
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Pulsa el botón &quot;Comenzar Dictado&quot; y empieza a hablar con naturalidad.
              </p>
            </div>
          )}

          {/* Bloques Consolidados Compactos */}
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/40 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all select-text"
            >
              <p className="whitespace-pre-wrap select-text leading-relaxed">{segment.originalText}</p>
            </div>
          ))}

          {/* Texto en Proceso (Voz activa instantánea) */}
          {interimText && (
            <div className="px-3.5 py-2.5 rounded-xl bg-blue-50/40 dark:bg-[#1368AA]/15 border border-dashed border-blue-400/80 dark:border-[#1368AA]/60 select-text">
              <p className="text-blue-950 dark:text-cyan-200 font-medium select-text leading-relaxed">
                {interimText}
                <span className="inline-block w-2 h-4 ml-1 bg-[#1368AA] animate-pulse align-middle" />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* COLUMNA 2: TRADUCCIÓN PARALELA (INGLÉS / PORTUGUÉS / ESPAÑOL) */}
      {autoTranslate && (
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-sm overflow-hidden">
          {/* Cabecera de Columna */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0B0F17]/50 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {targetLangName} (Traducción Simultánea)
              </h2>
            </div>

            <button
              onClick={handleCopyTranslation}
              disabled={segments.length === 0}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-[#1368AA] text-slate-700 dark:text-slate-200"
              title="Copiar toda la traducción"
            >
              {copiedTranslation ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-cyan-600 dark:text-cyan-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Traducción</span>
                </>
              )}
            </button>
          </div>

          {/* Cuerpo de Traducción - Flujo Continuo compacto */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] space-y-2 select-text cursor-text min-h-[380px]">
            {segments.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-16 px-4 select-none">
                <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
                  Traducción automática en paralelo
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                  Conforme hables y se organicen tus párrafos, se traducirán automáticamente aquí.
                </p>
              </div>
            )}

            {/* Bloques de Traducción Compactos */}
            {segments.map((segment) => (
              <div
                key={`trans-${segment.id}`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/40 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all select-text"
              >
                <p className="whitespace-pre-wrap select-text leading-relaxed">{segment.translatedText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

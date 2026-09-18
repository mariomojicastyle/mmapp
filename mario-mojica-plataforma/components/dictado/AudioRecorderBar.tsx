"use client";

import React, { useState } from "react";
import { Mic, Square, Trash2, Globe2, FileText, ArrowRightLeft, FolderDown, Copy, Check } from "lucide-react";

export type ConversationMode = "es_to_pt" | "pt_to_es" | "es_to_en" | "en_to_es";
export type SingleDictationLang = "es-CO" | "pt-BR" | "en-US";

export function AudioRecorderBar({
  isRecording,
  durationSeconds,
  wordCount,
  charCount = 0,
  autoTranslate,
  conversationMode,
  singleDictationLang,
  onToggleRecording,
  onToggleAutoTranslate,
  onChangeConversationMode,
  onChangeSingleDictationLang,
  onClearAll,
  onOpenGuardarActa,
  onCopyText,
  hasSegments,
  isSupported,
}: {
  isRecording: boolean;
  durationSeconds: number;
  wordCount: number;
  charCount?: number;
  autoTranslate: boolean;
  conversationMode: ConversationMode;
  singleDictationLang: SingleDictationLang;
  onToggleRecording: () => void;
  onToggleAutoTranslate: (enabled: boolean) => void;
  onChangeConversationMode: (mode: ConversationMode) => void;
  onChangeSingleDictationLang: (lang: SingleDictationLang) => void;
  onClearAll: () => void;
  onOpenGuardarActa?: () => void;
  onCopyText?: () => void;
  hasSegments?: boolean;
  isSupported: boolean;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyText = () => {
    if (onCopyText) {
      onCopyText();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-3.5 sm:p-4 shadow-sm flex flex-col gap-3">
      {/* FILA SUPERIOR: Mandos Principales & Modos */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* 1. Botón Principal de Grabación & Métricas */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <button
            onClick={onToggleRecording}
            disabled={!isSupported}
            className={`rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                : "bg-[#1368AA] hover:bg-[#1368AA]/90 text-white"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Detener Grabación</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Comenzar Dictado</span>
              </>
            )}
          </button>

          {/* Indicador de Estado y Tiempo */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">En vivo</span>
                  </>
                ) : (
                  <span>Listo</span>
                )}
              </div>
              <span className="text-sm sm:text-base font-mono font-bold text-slate-800 dark:text-slate-100">
                {formatTime(durationSeconds)}
              </span>
            </div>

            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

            {/* Contador de Palabras */}
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Palabras</span>
              <span className="text-sm sm:text-base font-mono font-bold text-slate-800 dark:text-slate-100">
                {wordCount}
              </span>
            </div>

            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

            {/* Contador de Caracteres (Estándar Web) */}
            <div className="flex flex-col" title="Caracteres totales (estándar web con espacios)">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Caracteres</span>
              <span className="text-sm sm:text-base font-mono font-bold text-slate-800 dark:text-slate-100">
                {charCount}
              </span>
            </div>
          </div>
        </div>

        {/* 2. ZONA CENTRAL: Botón "Copiar Texto" Ergonómico (Azul Uniforme Permanente) */}
        {onCopyText && (
          <div className="flex items-center justify-center my-0.5 lg:my-0">
            <button
              onClick={handleCopyText}
              className="rounded-full px-5 py-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 select-none bg-[#1368AA] hover:bg-[#1368AA]/90 text-white border-transparent"
              title="Copiar texto de la pizarra al portapapeles"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 3. Switch Modo: Traducción vs Solo Dictado & Limpiar Pizarra */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {/* Conmutador de Cápsula: Con Traducción vs Solo Dictado */}
          <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800/80 text-xs">
            <button
              onClick={() => onToggleAutoTranslate(true)}
              className={`rounded-full px-3 py-1.5 font-semibold flex items-center gap-1.5 transition-colors ${
                autoTranslate
                  ? "bg-white dark:bg-[#1368AA] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Con Traducción</span>
            </button>
            <button
              onClick={() => onToggleAutoTranslate(false)}
              className={`rounded-full px-3 py-1.5 font-semibold flex items-center gap-1.5 transition-colors ${
                !autoTranslate
                  ? "bg-white dark:bg-[#1368AA] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Solo Dictado (Lienzo 100%)</span>
            </button>
          </div>

          {/* Botón Guardar Acta en Drive (Cápsula) */}
          {onOpenGuardarActa && (
            <button
              onClick={onOpenGuardarActa}
              disabled={!hasSegments}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#1368AA] dark:hover:bg-[#1368AA]/90"
              title={hasSegments ? "Guardar acta ejecutiva en Google Drive (HTML y Word .doc)" : "Captura algo de voz para guardar el acta"}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Guardar Acta</span>
            </button>
          )}

          {/* Botón Limpiar Todo */}
          <button
            onClick={onClearAll}
            className="rounded-full p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Borrar todo el texto de la pizarra"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILA INFERIOR: Selectores de Dirección / Idioma Contextuales */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 select-none">
        {autoTranslate ? (
          /* Sub-barra Modo Traducción: Dirección de Conversación */
          <div className="flex flex-wrap items-center gap-2 text-xs w-full">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-500" />
              <span>Escuchando:</span>
            </span>

            <button
              onClick={() => onChangeConversationMode("pt_to_es")}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                conversationMode === "pt_to_es"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="Para reuniones con Brasil o videos de YouTube: escucha en portugués y te entrega todo traducido a español"
            >
              🇧🇷 Escuchar a Brasil
            </button>

            <button
              onClick={() => onChangeConversationMode("es_to_pt")}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                conversationMode === "es_to_pt"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="Para cuando tú hablas en español y quieres obtener la traducción en portugués para copiar y pegar al cliente"
            >
              🇪🇸 Mi Voz (Español)
            </button>

            <button
              onClick={() => onChangeConversationMode("en_to_es")}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                conversationMode === "en_to_es"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="Escuchar reuniones o videos en inglés y traducir a español"
            >
              🇺🇸 Escuchar Inglés
            </button>

            <button
              onClick={() => onChangeConversationMode("es_to_en")}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                conversationMode === "es_to_en"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="Tu voz en español traducida a inglés"
            >
              🇪🇸 Traducir a Inglés
            </button>
          </div>
        ) : (
          /* Sub-barra Modo Solo Dictado: Selección del idioma de voz */
          <div className="flex flex-wrap items-center gap-1.5 text-xs w-full">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
              <Mic className="w-3.5 h-3.5 text-[#1368AA] dark:text-cyan-400" />
              <span>Idioma de Escucha:</span>
            </span>

            <button
              onClick={() => onChangeSingleDictationLang("es-CO")}
              className={`rounded-full px-3 py-1 font-semibold transition-all border ${
                singleDictationLang === "es-CO"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              🇪🇸 Español
            </button>

            <button
              onClick={() => onChangeSingleDictationLang("pt-BR")}
              className={`rounded-full px-3 py-1 font-semibold transition-all border ${
                singleDictationLang === "pt-BR"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              🇧🇷 Português (Brasil)
            </button>

            <button
              onClick={() => onChangeSingleDictationLang("en-US")}
              className={`rounded-full px-3 py-1 font-semibold transition-all border ${
                singleDictationLang === "en-US"
                  ? "bg-[#1368AA] text-white border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              🇺🇸 English
            </button>

            <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto italic hidden sm:inline">
              Lienzo completo activado: sin panel de traducción
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

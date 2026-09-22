"use client";

import React, { useState, useMemo } from "react";
import {
  AudioRecorderBar,
  ConversationMode,
  SingleDictationLang,
} from "@/components/dictado/AudioRecorderBar";
import { TranscriptFeed } from "@/components/dictado/TranscriptFeed";
import { GuardarActaModal } from "@/components/dictado/GuardarActaModal";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";
import { Mic, AlertCircle, AlertTriangle, X, RefreshCw } from "lucide-react";

export default function DictadoYTraduccionPage() {
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>("es_to_pt");
  const [singleDictationLang, setSingleDictationLang] = useState<SingleDictationLang>("es-CO");
  const [isActaModalOpen, setIsActaModalOpen] = useState(false);

  // Configuración de idiomas según modo
  const config = useMemo(() => {
    if (!autoTranslate) {
      const name =
        singleDictationLang === "es-CO"
          ? "Español"
          : singleDictationLang === "pt-BR"
          ? "Português (Brasil)"
          : "English";
      return {
        sourceLang: singleDictationLang,
        targetLang: "es" as const,
        sourceLangName: name,
        targetLangName: "",
      };
    }

    switch (conversationMode) {
      case "es_to_pt":
        return {
          sourceLang: "es-CO",
          targetLang: "pt" as const,
          sourceLangName: "Español",
          targetLangName: "Português (Brasil)",
        };
      case "pt_to_es":
        return {
          sourceLang: "pt-BR",
          targetLang: "es" as const,
          sourceLangName: "Português (Brasil)",
          targetLangName: "Español",
        };
      case "es_to_en":
        return {
          sourceLang: "es-CO",
          targetLang: "en" as const,
          sourceLangName: "Español",
          targetLangName: "English",
        };
      case "en_to_es":
        return {
          sourceLang: "en-US",
          targetLang: "es" as const,
          sourceLangName: "English",
          targetLangName: "Español",
        };
    }
  }, [autoTranslate, conversationMode, singleDictationLang]);

  const {
    isRecording,
    interimText,
    segments,
    isSupported,
    durationSeconds,
    errorMessage,
    clearError,
    toggleRecording,
    clearAll,
    retranslateAll,
    updateSegmentText,
    updateTranslatedText,
    deleteSegment,
    deleteLastSegment,
  } = useSpeechDictation({
    sourceLang: config.sourceLang,
    targetLang: config.targetLang,
    autoTranslate,
  });

  // Conteo total de palabras y caracteres (estándar web universal con espacios y signos)
  const { wordCount, charCount } = useMemo(() => {
    const consolidatedText = segments.map((s) => s.originalText).join("\n\n");
    const fullText = interimText.trim()
      ? (consolidatedText ? `${consolidatedText} ${interimText.trim()}` : interimText.trim())
      : consolidatedText;

    const words = fullText.trim() ? fullText.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = fullText.length;

    return { wordCount: words, charCount: chars };
  }, [segments, interimText]);

  // Cambiar modo de conversación
  const handleChangeConversationMode = (mode: ConversationMode) => {
    setConversationMode(mode);
    let newSource = "es-CO";
    let newTarget: "en" | "pt" | "es" = "pt";

    if (mode === "es_to_pt") {
      newSource = "es-CO";
      newTarget = "pt";
    } else if (mode === "pt_to_es") {
      newSource = "pt-BR";
      newTarget = "es";
    } else if (mode === "es_to_en") {
      newSource = "es-CO";
      newTarget = "en";
    } else if (mode === "en_to_es") {
      newSource = "en-US";
      newTarget = "es";
    }

    retranslateAll(newTarget, newSource);
  };

  // Cambiar idioma en modo solo dictado
  const handleChangeSingleDictationLang = (lang: SingleDictationLang) => {
    setSingleDictationLang(lang);
  };

  // Copiar el texto de la pizarra al portapapeles desde el botón central
  const handleCopyBoardText = () => {
    if (segments.length === 0) return;
    let textToCopy = "";
    if (!autoTranslate) {
      // Modo solo dictado: copia todo el texto continuo
      textToCopy = segments.map((s) => s.originalText).join("\n\n");
    } else {
      // Modo traducción: copia la traducción resultante (o el original si estuviera vacío)
      textToCopy = segments.map((s) => s.translatedText || s.originalText).join("\n\n");
    }

    if (textToCopy.trim()) {
      navigator.clipboard.writeText(textToCopy);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden p-3 sm:p-4 w-full max-w-[98%] xl:max-w-[96%] mx-auto gap-2.5 sm:gap-3 font-sans">
      {/* ZONA SUPERIOR FIJA / ESTÁTICA (Cabecera, Alertas y Controles) */}
      <div className="shrink-0 space-y-2.5 select-none">
        {/* 1. Header Minimalista */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10 dark:bg-[#1368AA]/20 text-[#1368AA] dark:text-cyan-400">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Dictado y Traducción
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {autoTranslate
                  ? "Captura de voz bilingüe para reuniones B2B y traducción simultánea"
                  : "Captura de voz de alta fidelidad en lienzo completo"}
              </p>
            </div>
          </div>
        </div>

        {/* Alerta si el navegador no soporta Speech Recognition */}
        {!isSupported && (
          <div className="rounded-2xl p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Tu navegador actual no tiene habilitada la API nativa de reconocimiento de voz. Te recomendamos abrir esta sección en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> para disfrutar de la captura en vivo.
            </p>
          </div>
        )}

        {/* Alerta de Error de Captura de Audio o Micrófono con Diagnóstico Asistido */}
        {errorMessage && (
          <div className="rounded-2xl p-3 bg-rose-50 dark:bg-[#131B2E] border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300 text-xs sm:text-sm shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  clearError();
                  toggleRecording();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
              <button
                onClick={clearError}
                aria-label="Cerrar aviso"
                className="p-1 rounded-full hover:bg-rose-200/60 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Barra de Grabación y Control */}
        <AudioRecorderBar
          isRecording={isRecording}
          durationSeconds={durationSeconds}
          wordCount={wordCount}
          charCount={charCount}
          autoTranslate={autoTranslate}
          conversationMode={conversationMode}
          singleDictationLang={singleDictationLang}
          onToggleRecording={toggleRecording}
          onToggleAutoTranslate={setAutoTranslate}
          onChangeConversationMode={handleChangeConversationMode}
          onChangeSingleDictationLang={handleChangeSingleDictationLang}
          onClearAll={clearAll}
          onOpenGuardarActa={() => setIsActaModalOpen(true)}
          onCopyText={handleCopyBoardText}
          hasSegments={segments.length > 0}
          isSupported={isSupported}
        />
      </div>

      {/* ZONA INFERIOR SCROLLEABLE (Lienzo / Pizarra de Texto con Rueda del Ratón y Scroll) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <TranscriptFeed
          segments={segments}
          interimText={interimText}
          sourceLangName={config.sourceLangName}
          targetLangName={config.targetLangName}
          autoTranslate={autoTranslate}
          onClear={clearAll}
          onUpdateSegmentText={updateSegmentText}
          onUpdateTranslatedText={updateTranslatedText}
          onDeleteSegment={deleteSegment}
          onDeleteLastSegment={deleteLastSegment}
        />
      </div>

      {/* 4. Modal para Guardar Acta en Google Drive con Diarización y Resumen IA */}
      <GuardarActaModal
        isOpen={isActaModalOpen}
        onClose={() => setIsActaModalOpen(false)}
        segments={segments}
        durationSeconds={durationSeconds}
        idioma={config.sourceLangName}
      />
    </div>
  );
}



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
import { Mic, AlertCircle } from "lucide-react";

export default function DictadoYTraduccionPage() {
  const [autoTranslate, setAutoTranslate] = useState(true);
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
    toggleRecording,
    clearAll,
    retranslateAll,
  } = useSpeechDictation({
    sourceLang: config.sourceLang,
    targetLang: config.targetLang,
    autoTranslate,
  });

  // Conteo total de palabras
  const wordCount = useMemo(() => {
    const allWords = segments.reduce((acc, seg) => {
      const words = seg.originalText.trim().split(/\s+/).filter(Boolean);
      return acc + words.length;
    }, 0);

    const interimWords = interimText.trim().split(/\s+/).filter(Boolean).length;
    return allWords + interimWords;
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
    <div className="p-3 sm:p-5 w-full max-w-[98%] xl:max-w-[96%] mx-auto space-y-3 sm:space-y-4 font-sans">
      {/* 1. Header Minimalista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-blue-500/10 dark:bg-[#1368AA]/20 text-[#1368AA] dark:text-cyan-400">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dictado y Traducción
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {autoTranslate
                ? "Captura de voz bilingüe para reuniones B2B y traducción simultánea"
                : "Captura de voz de alta fidelidad en lienzo completo"}
            </p>
          </div>
        </div>
      </div>

      {/* Alerta si el navegador no soporta Speech Recognition */}
      {!isSupported && (
        <div className="rounded-2xl p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            Tu navegador actual no tiene habilitada la API nativa de reconocimiento de voz. Te recomendamos abrir esta sección en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> para disfrutar de la captura en vivo.
          </p>
        </div>
      )}

      {/* 2. Barra de Grabación y Control */}
      <AudioRecorderBar
        isRecording={isRecording}
        durationSeconds={durationSeconds}
        wordCount={wordCount}
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

      {/* 3. Panel de Transcripción (Dual o Pantalla Completa según autoTranslate) */}
      <TranscriptFeed
        segments={segments}
        interimText={interimText}
        sourceLangName={config.sourceLangName}
        targetLangName={config.targetLangName}
        autoTranslate={autoTranslate}
        onClear={clearAll}
      />

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


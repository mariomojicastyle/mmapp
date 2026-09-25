"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Copy, Check, Trash2, Undo2, Volume2, Square, Loader2, ChevronDown } from "lucide-react";

export interface NarradorVoz {
  id: string;
  nombre: string;
  genero: "Masculino" | "Femenino";
  desc: string;
  icon: string;
  lang: "pt" | "es" | "en";
}

export const VOCES_NARRADOR: NarradorVoz[] = [
  // Intérpretes en Português do Brasil (Microsoft Edge Neural Voices)
  { id: "pt-BR-AntonioNeural", nombre: "Antonio", genero: "Masculino", desc: "Corporativo y Ejecutivo", icon: "👨🏻", lang: "pt" },
  { id: "pt-BR-FranciscaNeural", nombre: "Francisca", genero: "Femenino", desc: "Cálido y Profesional", icon: "👩🏻", lang: "pt" },
  { id: "pt-BR-ThalitaNeural", nombre: "Thalita", genero: "Femenino", desc: "Conversacional y Ágil", icon: "👩🏼", lang: "pt" },
  { id: "pt-BR-NicolauNeural", nombre: "Nicolau", genero: "Masculino", desc: "Casual y Cercano", icon: "👨🏼", lang: "pt" },
  // Intérpretes en Español
  { id: "es-CO-GonzaloNeural", nombre: "Gonzalo", genero: "Masculino", desc: "Neutro y Claro", icon: "👨🏻", lang: "es" },
  { id: "es-CO-SalomeNeural", nombre: "Salomé", genero: "Femenino", desc: "Cálida y Amable", icon: "👩🏻", lang: "es" },
  // Intérpretes en Inglés
  { id: "en-US-GuyNeural", nombre: "Guy", genero: "Masculino", desc: "Ejecutivo", icon: "👨🏼", lang: "en" },
  { id: "en-US-JennyNeural", nombre: "Jenny", genero: "Femenino", desc: "Conversacional", icon: "👩🏼", lang: "en" },
];

/**
 * Tarjeta de Segmento Editable en Vivo con Narración en Audio
 * Permite al usuario hacer clic, borrar con Backspace/Supr o editar libremente con el teclado
 * y escuchar la frase narrada por el intérprete seleccionado.
 */
function EditableSegmentCard({
  text,
  onChange,
  onDelete,
  onSpeak,
  isSpeaking = false,
  placeholder = "Escribe o dicta aquí...",
  readOnly = false,
}: {
  text: string;
  onChange?: (val: string) => void;
  onDelete?: () => void;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState(text);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar texto cuando llega nuevo dictado desde el motor de voz
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Ajustar altura automáticamente al contenido sin saltos bruscos
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(26, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [localText, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalText(newVal);
    adjustHeight();

    if (onChange) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      // Debounce de 600ms para disparar re-traducción sólo tras una pausa de escritura
      debounceTimerRef.current = setTimeout(() => {
        onChange(newVal);
      }, 600);
    }
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (onChange && localText !== text) {
      onChange(localText);
    }
  };

  return (
    <div className="group relative px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/40 border border-slate-100 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all focus-within:border-[#1368AA]/50 focus-within:bg-white dark:focus-within:bg-[#0B0F17]/80 focus-within:shadow-sm">
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleChange}
        onBlur={handleBlur}
        rows={1}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full bg-transparent border-none outline-none resize-none font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] p-0 pr-14 focus:outline-none focus:ring-0 block select-text"
      />
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {onSpeak && (
          <button
            onClick={onSpeak}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all select-none ${
              isSpeaking
                ? "bg-[#1368AA] text-white animate-pulse opacity-100 shadow-sm"
                : "opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-[#1368AA] dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-[#1368AA]/20"
            }`}
            title={isSpeaking ? "Detener audio" : "Escuchar esta frase con el narrador"}
          >
            {isSpeaking ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all select-none"
            title="Eliminar esta frase"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TranscriptFeed({
  segments,
  interimText,
  interimTranslatedText = "",
  sourceLangName = "Español",
  targetLangName,
  autoTranslate = true,
  onClear,
  onUpdateSegmentText,
  onUpdateTranslatedText,
  onDeleteSegment,
  onDeleteLastSegment,
}: {
  segments: { id: string; originalText: string; translatedText: string; timestamp: number }[];
  interimText: string;
  interimTranslatedText?: string;
  sourceLangName?: string;
  targetLangName: string;
  autoTranslate?: boolean;
  onClear?: () => void;
  onUpdateSegmentText?: (segmentId: string, text: string) => void;
  onUpdateTranslatedText?: (segmentId: string, text: string) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onDeleteLastSegment?: () => void;
}) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  // Estados de Reproducción de Voz (TTS - Narrador Neuronal)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("pt-BR-AntonioNeural");
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Cargar voz preferida del almacenamiento local
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dictado_narrador_voz");
      if (saved && VOCES_NARRADOR.some((v) => v.id === saved)) {
        setSelectedVoice(saved);
      }
    } catch (e) {}
  }, []);

  // Filtrar voces disponibles según el idioma de destino (priorizando portugués de Brasil)
  const availableVoices = useMemo(() => {
    const isPt = targetLangName.toLowerCase().includes("portugu");
    const isEs = targetLangName.toLowerCase().includes("español");
    const isEn = targetLangName.toLowerCase().includes("english") || targetLangName.toLowerCase().includes("ingl");

    if (isPt) return VOCES_NARRADOR.filter((v) => v.lang === "pt");
    if (isEs) return VOCES_NARRADOR.filter((v) => v.lang === "es");
    if (isEn) return VOCES_NARRADOR.filter((v) => v.lang === "en");
    return VOCES_NARRADOR.filter((v) => v.lang === "pt");
  }, [targetLangName]);

  // Si la voz actual no pertenece a las disponibles del idioma, cambiar a la primera disponible
  useEffect(() => {
    if (availableVoices.length > 0 && !availableVoices.some((v) => v.id === selectedVoice)) {
      setSelectedVoice(availableVoices[0].id);
    }
  }, [availableVoices, selectedVoice]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlayingAll(false);
    setPlayingSegmentId(null);
    setIsAudioLoading(false);
  }, []);

  const handleChangeVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    try {
      localStorage.setItem("dictado_narrador_voz", voiceId);
    } catch (e) {}
    stopAudio();
  };

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Reproducir un texto con el motor TTS bajo demanda
  const playText = useCallback(
    async (textToPlay: string, segmentId?: string) => {
      const cleanText = textToPlay.trim();
      if (!cleanText) return;

      // Toggle: Si ya está reproduciendo este mismo bloque o todo, detenerlo
      if ((segmentId && playingSegmentId === segmentId) || (!segmentId && isPlayingAll)) {
        stopAudio();
        return;
      }

      stopAudio();

      try {
        setIsAudioLoading(true);
        if (segmentId) {
          setPlayingSegmentId(segmentId);
        } else {
          setIsPlayingAll(true);
        }

        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            voice: selectedVoice,
          }),
        });

        if (!res.ok) {
          throw new Error("Error en la síntesis de audio");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          stopAudio();
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          stopAudio();
          URL.revokeObjectURL(url);
        };

        await audio.play();
        setIsAudioLoading(false);
      } catch (err) {
        console.warn("[TTS Narrador] Error al reproducir audio:", err);
        stopAudio();
      }
    },
    [playingSegmentId, isPlayingAll, selectedVoice, stopAudio]
  );

  // Texto consolidado para reproducir toda la traducción
  const fullTranslatedText = useMemo(() => {
    const segs = segments.map((s) => s.translatedText).filter(Boolean).join(". ");
    return segs || interimTranslatedText;
  }, [segments, interimTranslatedText]);

  const handleTogglePlayAll = () => {
    if (isPlayingAll) {
      stopAudio();
    } else {
      playText(fullTranslatedText);
    }
  };

  const targetLangLabel = useMemo(() => {
    if (targetLangName.toLowerCase().includes("portugu")) return "Portugués";
    if (targetLangName.toLowerCase().includes("español")) return "Español";
    if (targetLangName.toLowerCase().includes("ingl") || targetLangName.toLowerCase().includes("english")) return "Inglés";
    return targetLangName;
  }, [targetLangName]);

  // Referencias para auto-scroll tipo teleprompter
  const originalScrollRef = useRef<HTMLDivElement>(null);
  const translatedScrollRef = useRef<HTMLDivElement>(null);

  // Mantener siempre visible la última línea que se está dictando o traduciendo
  const scrollToBottom = useCallback(() => {
    const activeEl = typeof document !== "undefined" ? document.activeElement : null;
    const isEditingPastOriginal =
      originalScrollRef.current &&
      activeEl &&
      originalScrollRef.current.contains(activeEl) &&
      activeEl.tagName === "TEXTAREA";

    const isEditingPastTranslated =
      translatedScrollRef.current &&
      activeEl &&
      translatedScrollRef.current.contains(activeEl) &&
      activeEl.tagName === "TEXTAREA";

    if (originalScrollRef.current && !isEditingPastOriginal) {
      originalScrollRef.current.scrollTop = originalScrollRef.current.scrollHeight;
    }
    if (translatedScrollRef.current && !isEditingPastTranslated) {
      translatedScrollRef.current.scrollTop = translatedScrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    // requestAnimationFrame asegura que el scroll se aplique inmediatamente tras el render del DOM
    const frameId = requestAnimationFrame(() => {
      scrollToBottom();
    });
    return () => cancelAnimationFrame(frameId);
  }, [segments, interimText, interimTranslatedText, scrollToBottom]);

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
      className={`grid gap-3 sm:gap-4 flex-1 h-full min-h-0 overflow-hidden transition-all ${
        autoTranslate ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      }`}
    >
      {/* COLUMNA 1: VOZ ORIGINAL (TIEMPO REAL CON EDICIÓN EN LÍNEA) */}
      <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-sm overflow-hidden w-full h-full min-h-0">
        {/* Cabecera de Columna */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0B0F17]/50 flex items-center justify-between gap-3 select-none shrink-0 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1368AA] animate-pulse" />
              <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {sourceLangName} (Dictado en Vivo)
              </h2>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              {onDeleteLastSegment && (
                <button
                  onClick={onDeleteLastSegment}
                  disabled={segments.length === 0}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="Deshacer o borrar la última frase dictada"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Deshacer Frase</span>
                </button>
              )}
              {onClear && (
                <button
                  onClick={onClear}
                  disabled={segments.length === 0 && !interimText}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300"
                  title="Limpiar pizarra y borrar todo"
                >
                  Limpiar Pizarra
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cuerpo del Texto - Flujo Continuo compacto, editable en vivo y scrolleable con auto-scroll teleprompter */}
        <div
          ref={originalScrollRef}
          className="flex-1 p-3.5 sm:p-4 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] space-y-2 select-text min-h-0"
        >
          {segments.length === 0 && !interimText && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-16 px-4 select-none">
              <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
                Tu dictado aparecerá aquí en tiempo real
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Pulsa &quot;Comenzar Dictado&quot; y empieza a hablar. Puedes hacer clic en cualquier frase para borrarla o editarla con el teclado mientras sigues hablando.
              </p>
            </div>
          )}

          {/* Bloques Consolidados Editables en Vivo */}
          {segments.map((segment) => (
            <EditableSegmentCard
              key={segment.id}
              text={segment.originalText}
              onChange={(newVal) => onUpdateSegmentText?.(segment.id, newVal)}
              onDelete={() => onDeleteSegment?.(segment.id)}
              placeholder="Frase original..."
            />
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

          {/* Espaciador terminal del 15% para que la línea activa dictada flote 15% más arriba del borde inferior */}
          <div className="h-[15vh] min-h-[90px] max-h-[140px] w-full shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* COLUMNA 2: TRADUCCIÓN PARALELA (INGLÉS / PORTUGUÉS / ESPAÑOL) */}
      {autoTranslate && (
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-sm overflow-hidden w-full h-full min-h-0">
          {/* Cabecera de Columna */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0B0F17]/50 flex items-center justify-between gap-3 select-none shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {targetLangName} (Traducción Simultánea)
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector de Intérprete / Voz en Cápsula */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedVoice}
                  onChange={(e) => handleChangeVoice(e.target.value)}
                  className="rounded-full pl-3 pr-7 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer transition-colors appearance-none shadow-2xs"
                  title="Seleccionar intérprete del narrador"
                >
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.id} className="dark:bg-[#131B2E] text-slate-800 dark:text-slate-200">
                      {v.icon} {v.nombre} ({v.desc})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 absolute right-2.5 pointer-events-none" />
              </div>

              {/* Botón Protagónico de Narración en Portugués / Idioma Destino */}
              <button
                onClick={handleTogglePlayAll}
                disabled={!fullTranslatedText.trim() || isAudioLoading}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed select-none ${
                  isPlayingAll
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : isAudioLoading
                    ? "bg-[#1368AA]/80 text-white cursor-wait"
                    : "bg-[#1368AA] hover:bg-[#1368AA]/90 text-white"
                }`}
                title="Generar y escuchar narración con la voz seleccionada"
              >
                {isPlayingAll ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Detener Narración</span>
                  </>
                ) : isAudioLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando Audio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Narrar en {targetLangLabel}</span>
                  </>
                )}
              </button>

              {/* Botón Copiar Traducción */}
              <button
                onClick={handleCopyTranslation}
                disabled={segments.length === 0}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
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
          </div>

          {/* Cuerpo de Traducción - Flujo Continuo editable y scrolleable con auto-scroll teleprompter */}
          <div
            ref={translatedScrollRef}
            className="flex-1 p-3.5 sm:p-4 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] space-y-2 select-text min-h-0"
          >
            {segments.length === 0 && !interimTranslatedText && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-16 px-4 select-none">
                <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
                  Traducción automática en paralelo
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                  Conforme hables y corrijas tus frases, se traducirán automáticamente aquí en tiempo real.
                </p>
              </div>
            )}

            {/* Bloques de Traducción Editables con Narrador por Frase */}
            {segments.map((segment) => (
              <EditableSegmentCard
                key={`trans-${segment.id}`}
                text={segment.translatedText}
                onChange={(newVal) => onUpdateTranslatedText?.(segment.id, newVal)}
                onDelete={() => onDeleteSegment?.(segment.id)}
                onSpeak={() => playText(segment.translatedText, segment.id)}
                isSpeaking={playingSegmentId === segment.id}
                placeholder="Traducción..."
              />
            ))}

            {/* Texto en Proceso de Traducción en Tiempo Real */}
            {interimTranslatedText && (
              <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-[#1368AA]/15 border border-cyan-200/60 dark:border-[#1368AA]/30 animate-pulse">
                <p className="text-cyan-950 dark:text-cyan-200 font-medium select-text leading-relaxed">
                  {interimTranslatedText}
                  <span className="inline-block w-2 h-4 ml-1 bg-cyan-500 dark:bg-[#1368AA] animate-pulse align-middle" />
                </p>
              </div>
            )}

            {/* Espaciador terminal del 15% para que la línea activa traducida flote 15% más arriba del borde inferior */}
            <div className="h-[15vh] min-h-[90px] max-h-[140px] w-full shrink-0 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}



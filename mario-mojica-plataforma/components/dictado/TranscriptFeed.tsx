"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Check, Trash2, Undo2 } from "lucide-react";

/**
 * Tarjeta de Segmento Editable en Vivo
 * Permite al usuario hacer clic, borrar con Backspace/Supr o editar libremente con el teclado
 * mientras el micrófono sigue activo en segundo plano.
 */
function EditableSegmentCard({
  text,
  onChange,
  onDelete,
  placeholder = "Escribe o dicta aquí...",
  readOnly = false,
}: {
  text: string;
  onChange?: (val: string) => void;
  onDelete?: () => void;
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
        className="w-full bg-transparent border-none outline-none resize-none font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] p-0 pr-7 focus:outline-none focus:ring-0 block select-text"
      />
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
          title="Eliminar esta frase"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function TranscriptFeed({
  segments,
  interimText,
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

        {/* Cuerpo del Texto - Flujo Continuo compacto, editable en vivo y scrolleable */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] space-y-2 select-text min-h-0 scroll-smooth">
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
        </div>
      </div>

      {/* COLUMNA 2: TRADUCCIÓN PARALELA (INGLÉS / PORTUGUÉS / ESPAÑOL) */}
      {autoTranslate && (
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-sm overflow-hidden w-full h-full min-h-0">
          {/* Cabecera de Columna */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0B0F17]/50 flex items-center justify-between gap-3 select-none shrink-0">
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

          {/* Cuerpo de Traducción - Flujo Continuo editable y scrolleable */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] space-y-2 select-text min-h-0 scroll-smooth">
            {segments.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-16 px-4 select-none">
                <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
                  Traducción automática en paralelo
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                  Conforme hables y corrijas tus frases, se traducirán automáticamente aquí en tiempo real.
                </p>
              </div>
            )}

            {/* Bloques de Traducción Editables */}
            {segments.map((segment) => (
              <EditableSegmentCard
                key={`trans-${segment.id}`}
                text={segment.translatedText}
                onChange={(newVal) => onUpdateTranslatedText?.(segment.id, newVal)}
                onDelete={() => onDeleteSegment?.(segment.id)}
                placeholder="Traducción..."
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



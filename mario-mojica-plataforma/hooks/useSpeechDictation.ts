"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { enriquecerPuntuacionYPreguntas } from "@/lib/punctuationEngine";

export interface SpeechSegment {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
  isFinal: boolean;
}

interface UseSpeechDictationOptions {
  sourceLang?: string;
  targetLang?: "en" | "pt" | "es";
  autoTranslate?: boolean;
}

export function useSpeechDictation({
  sourceLang = "es-CO",
  targetLang = "en",
  autoTranslate = true,
}: UseSpeechDictationOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sourceLangRef = useRef<string>(sourceLang);
  sourceLangRef.current = sourceLang;

  const targetLangRef = useRef<"en" | "pt" | "es">(targetLang);
  targetLangRef.current = targetLang;

  const autoTranslateRef = useRef(autoTranslate);
  autoTranslateRef.current = autoTranslate;

  // Traducir texto consolidado
  const translateSegment = useCallback(async (segmentId: string, text: string) => {
    if (!autoTranslateRef.current || !text.trim()) return;

    const fromLang = sourceLangRef.current.split("-")[0] || "es";
    const toLang = targetLangRef.current;
    if (fromLang === toLang) {
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === segmentId ? { ...seg, translatedText: text } : seg
        )
      );
      return;
    }

    try {
      const res = await fetch("/api/dictado/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          fromLang,
          toLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data.translation || text;

        setSegments((prev) =>
          prev.map((seg) =>
            seg.id === segmentId ? { ...seg, translatedText: translated } : seg
          )
        );
      }
    } catch (err) {
      console.warn("Error traduciendo segmento:", err);
    }
  }, []);

  const lastChunkRef = useRef<string>("");

  // Agregar texto continuo con puntuación inteligente y detección de preguntas
  const appendOrNewSegment = useCallback(
    (newChunk: string) => {
      if (!isRecordingRef.current) return;
      const clean = newChunk.trim();
      if (!clean) return;

      // Anti-repetición inmediata
      if (clean === lastChunkRef.current) return;
      lastChunkRef.current = clean;

      // Detección y formateo inteligente de preguntas según el idioma activo
      const punctuatedChunk = enriquecerPuntuacionYPreguntas(clean, sourceLangRef.current);
      const isTranslating = autoTranslateRef.current;

      setSegments((prev) => {
        if (prev.length === 0) {
          const newId = `seg_${Date.now()}`;
          if (isTranslating) translateSegment(newId, punctuatedChunk);
          return [
            {
              id: newId,
              originalText: punctuatedChunk,
              translatedText: isTranslating ? "Traduciendo..." : "",
              timestamp: Date.now(),
              isFinal: true,
            },
          ];
        }

        const lastIndex = prev.length - 1;
        const lastSeg = prev[lastIndex];

        // Evitar duplicación si el bloque anterior ya termina exactamente con esta frase
        if (lastSeg.originalText.endsWith(punctuatedChunk) || lastSeg.originalText.endsWith(clean)) {
          return prev;
        }

        const lastWords = lastSeg.originalText.trim().split(/\s+/).length;

        // Si el párrafo actual tiene menos de 28 palabras, concatenamos de forma armónica
        if (lastWords < 28) {
          const lastText = lastSeg.originalText.trim();
          const endsWithPunctuation = /[.,;:!?]$/.test(lastText);

          let combinedOriginal = "";
          if (endsWithPunctuation) {
            combinedOriginal = `${lastText} ${punctuatedChunk}`;
          } else {
            if (punctuatedChunk.startsWith("¿")) {
              const despuesDeSigno = punctuatedChunk.slice(1);
              const primeraPalabra = despuesDeSigno.split(" ")[0] || "";
              const esSigla = primeraPalabra === primeraPalabra.toUpperCase() && primeraPalabra.length > 1;
              const letraInicio = esSigla ? despuesDeSigno.charAt(0) : despuesDeSigno.charAt(0).toLowerCase();
              combinedOriginal = `${lastText}, ¿${letraInicio}${despuesDeSigno.slice(1)}`;
            } else {
              const primeraPalabra = punctuatedChunk.split(" ")[0] || "";
              const esSigla = primeraPalabra === primeraPalabra.toUpperCase() && primeraPalabra.length > 1;
              const letraInicio = esSigla ? punctuatedChunk.charAt(0) : punctuatedChunk.charAt(0).toLowerCase();
              combinedOriginal = `${lastText}, ${letraInicio}${punctuatedChunk.slice(1)}`;
            }
          }

          combinedOriginal = combinedOriginal.replace(/\s+/g, " ").trim();

          const updated = [...prev];
          updated[lastIndex] = {
            ...lastSeg,
            originalText: combinedOriginal,
            translatedText: isTranslating ? "Traduciendo..." : "",
          };

          if (isTranslating) {
            translateSegment(lastSeg.id, combinedOriginal);
          }
          return updated;
        } else {
          // Párrafo nuevo tras superar 28 palabras
          const newId = `seg_${Date.now()}`;
          if (isTranslating) translateSegment(newId, punctuatedChunk);
          return [
            ...prev,
            {
              id: newId,
              originalText: punctuatedChunk,
              translatedText: isTranslating ? "Traduciendo..." : "",
              timestamp: Date.now(),
              isFinal: true,
            },
          ];
        }
      });

      setInterimText("");
    },
    [translateSegment]
  );

  // Inicializar Web Speech API con guardas estrictas de grabación
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      // Bloqueo estricto si no estamos grabando
      if (!isRecordingRef.current) return;

      let finalTranscript = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const transcript = item[0]?.transcript || "";
        if (item.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          currentInterim += transcript;
        }
      }

      // Solo el resultado marcado como FINAL se consolida
      if (finalTranscript.trim()) {
        appendOrNewSegment(finalTranscript.trim());
      } else {
        // El interim solo se muestra visualmente, NUNCA se consolida con un timer automático
        setInterimText(currentInterim);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Si se detuvo la grabación, salir limpiamente
      if (!isRecordingRef.current) {
        setIsRecording(false);
        return;
      }

      // Si la grabación sigue activa y el motor se apagó por silencio largo del navegador, reiniciar
      try {
        recognition.start();
      } catch (e) {}
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sourceLang, appendOrNewSegment]);

  // Cronómetro
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      // Abortar cualquier sesión huérfana previa
      try {
        recognitionRef.current.abort();
      } catch (e) {}

      isRecordingRef.current = true;
      setIsRecording(true);
      lastChunkRef.current = "";
      recognitionRef.current.lang = sourceLangRef.current;
      recognitionRef.current.start();
    } catch (e) {
      console.warn("No se pudo iniciar reconocimiento:", e);
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Consolidar remanente si había interim pendiente
    if (interimText.trim()) {
      appendOrNewSegment(interimText.trim());
      setInterimText("");
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [interimText, appendOrNewSegment]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearAll = useCallback(() => {
    setSegments([]);
    setInterimText("");
    setDurationSeconds(0);
    lastChunkRef.current = "";
  }, []);

  // Actualizar idioma de reconocimiento si cambia dinámicamente
  useEffect(() => {
    sourceLangRef.current = sourceLang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLang;
    }
  }, [sourceLang]);

  const retranslateAll = useCallback(
    async (newTargetLang: "en" | "pt" | "es", newSourceLang?: string) => {
      targetLangRef.current = newTargetLang;
      if (newSourceLang) {
        sourceLangRef.current = newSourceLang;
        if (recognitionRef.current) {
          recognitionRef.current.lang = newSourceLang;
        }
      }
      for (const seg of segments) {
        translateSegment(seg.id, seg.originalText);
      }
    },
    [segments, translateSegment]
  );

  return {
    isRecording,
    interimText,
    segments,
    isSupported,
    durationSeconds,
    startRecording,
    stopRecording,
    toggleRecording,
    clearAll,
    retranslateAll,
  };
}

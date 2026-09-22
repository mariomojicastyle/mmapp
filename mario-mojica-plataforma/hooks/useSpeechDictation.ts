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
  const [interimTranslatedText, setInterimTranslatedText] = useState("");
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceCommitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interimTranslateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interimTextRef = useRef("");

  const sourceLangRef = useRef<string>(sourceLang);
  sourceLangRef.current = sourceLang;

  const targetLangRef = useRef<"en" | "pt" | "es">(targetLang);
  targetLangRef.current = targetLang;

  const autoTranslateRef = useRef(autoTranslate);
  autoTranslateRef.current = autoTranslate;

  const lastChunkRef = useRef<string>("");

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

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

  // Traducción en tiempo real del texto en proceso (interim) con debounce ágil (220ms)
  const triggerInterimTranslation = useCallback((text: string) => {
    if (!autoTranslateRef.current) return;
    const clean = text.trim();
    if (!clean || clean.split(/\s+/).length < 2) {
      setInterimTranslatedText("");
      return;
    }

    if (interimTranslateTimerRef.current) {
      clearTimeout(interimTranslateTimerRef.current);
    }

    interimTranslateTimerRef.current = setTimeout(async () => {
      try {
        const fromLang = sourceLangRef.current.split("-")[0] || "es";
        const toLang = targetLangRef.current;
        if (fromLang === toLang) {
          setInterimTranslatedText(clean);
          return;
        }

        const res = await fetch("/api/dictado/traducir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: clean,
            fromLang,
            toLang,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const translated = data.translation || clean;
          if (interimTextRef.current) {
            setInterimTranslatedText(translated);
          }
        }
      } catch (err) {
        // Silencioso en interim para no interrumpir el flujo
      }
    }, 220);
  }, []);

  // Agregar texto continuo con puntuación inteligente y detección de preguntas
  const appendOrNewSegment = useCallback(
    (newChunk: string) => {
      const clean = newChunk.trim();
      if (!clean) return;

      // Limpiar timer de interim y texto provisional
      if (interimTranslateTimerRef.current) {
        clearTimeout(interimTranslateTimerRef.current);
        interimTranslateTimerRef.current = null;
      }
      setInterimTranslatedText("");

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
        const lastText = lastSeg.originalText.trim();
        const endsWithPunctuation = /[.,;:!?]$/.test(lastText);

        // Si el párrafo actual tiene menos de 16 palabras y no concluyó con puntuación fuerte, concatenamos
        if (lastWords < 16 && !endsWithPunctuation) {
          let combinedOriginal = "";
          if (punctuatedChunk.startsWith("¿")) {
            combinedOriginal = `${lastText} ${punctuatedChunk}`;
          } else {
            const primeraPalabra = punctuatedChunk.split(" ")[0] || "";
            const esSigla = primeraPalabra === primeraPalabra.toUpperCase() && primeraPalabra.length > 1;
            const letraInicio = esSigla ? punctuatedChunk.charAt(0) : punctuatedChunk.charAt(0).toLowerCase();
            combinedOriginal = `${lastText} ${letraInicio}${punctuatedChunk.slice(1)}`;
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
          // Párrafo nuevo: oración limpia e independiente
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

      interimTextRef.current = "";
      setInterimText("");
    },
    [translateSegment]
  );

  // Inicializar y vincular eventos a una instancia de SpeechRecognition
  const setupRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLangRef.current;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
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

      if (finalTranscript.trim()) {
        if (silenceCommitTimerRef.current) {
          clearTimeout(silenceCommitTimerRef.current);
          silenceCommitTimerRef.current = null;
        }
        appendOrNewSegment(finalTranscript.trim());
      } else {
        const trimmedInterim = currentInterim.trim();
        interimTextRef.current = trimmedInterim;
        setInterimText(trimmedInterim);

        // 1. Traducción en tiempo real de interim simultánea en segundo plano
        triggerInterimTranslation(trimmedInterim);

        // 2. Micro-segmentación proactiva: si el audio de WhatsApp o hablante no pausa,
        // dividimos inteligentemente por frontera de frase o conector para no dejar el texto trabado
        const words = trimmedInterim.split(/\s+/);
        if (words.length >= 12) {
          const punctMatch = trimmedInterim.match(/^(.*?[.,;!?])\s+(.+)$/);
          if (punctMatch) {
            const head = punctMatch[1].trim();
            const tail = punctMatch[2].trim();
            if (head) {
              appendOrNewSegment(head);
              interimTextRef.current = tail;
              setInterimText(tail);
              triggerInterimTranslation(tail);
            }
          } else if (words.length >= 16) {
            const connectorRegex = /\s+(mas|então|entao|aí|ai|porque|por exemplo|quando|além disso|onde|pero|entonces|porque|y|e)\s+/i;
            const searchSlice = trimmedInterim.slice(25);
            const matchIdx = searchSlice.search(connectorRegex);
            if (matchIdx !== -1) {
              const cutPos = 25 + matchIdx;
              const head = trimmedInterim.slice(0, cutPos).trim();
              const tail = trimmedInterim.slice(cutPos).trim();
              if (head) {
                appendOrNewSegment(head);
                interimTextRef.current = tail;
                setInterimText(tail);
                triggerInterimTranslation(tail);
              }
            } else if (words.length >= 20) {
              const head = words.slice(0, 12).join(" ");
              const tail = words.slice(12).join(" ");
              appendOrNewSegment(head);
              interimTextRef.current = tail;
              setInterimText(tail);
              triggerInterimTranslation(tail);
            }
          }
        }

        // 3. Temporizador de silencio ágil (800ms en vez de 1400ms para respuesta inmediata)
        if (trimmedInterim) {
          if (silenceCommitTimerRef.current) {
            clearTimeout(silenceCommitTimerRef.current);
          }
          silenceCommitTimerRef.current = setTimeout(() => {
            if (isRecordingRef.current && interimTextRef.current) {
              appendOrNewSegment(interimTextRef.current);
            }
          }, 800);
        }
      }
    };

    recognition.onerror = (event: any) => {
      const err = event.error;

      // Eventos benignos que se pueden ignorar
      if (err === "no-speech" || err === "aborted") {
        return;
      }

      console.warn("[SpeechRecognition] Error detectado:", err);

      if (err === "not-allowed" || err === "service-not-allowed") {
        setErrorMessage(
          "Permiso de micrófono denegado. Haz clic en el icono del candado en la barra de direcciones de tu navegador y permite el uso del micrófono."
        );
        isRecordingRef.current = false;
        setIsRecording(false);
      } else if (err === "audio-capture") {
        setErrorMessage(
          "No se detecta captura de audio. Verifica que tu micrófono esté conectado, seleccionado como predeterminado en Windows y no esté en uso exclusivo por otra app (Meet, Zoom, etc.)."
        );
        isRecordingRef.current = false;
        setIsRecording(false);
      } else if (err === "network") {
        setErrorMessage(
          "Error de conexión con el servicio de transcripción de voz de Google. Verifica tu conexión a internet."
        );
        isRecordingRef.current = false;
        setIsRecording(false);
      } else {
        setErrorMessage(`Error en el reconocimiento de voz (${err}).`);
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (!isRecordingRef.current) {
        setIsRecording(false);
        return;
      }

      // Si la grabación sigue activa y el motor finalizó por tiempo límite del navegador,
      // reiniciar suavemente tras una pausa mínima para evitar bucles cerrados
      setTimeout(() => {
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("[SpeechRecognition] No se pudo reiniciar tras onend:", e);
          }
        }
      }, 150);
    };

    return recognition;
  }, [appendOrNewSegment]);

  // Verificar soporte al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSpeech =
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setIsSupported(hasSpeech);
  }, []);

  // Cronómetro de grabación
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

  // Iniciar grabación con verificación de micrófono previa
  const startRecording = useCallback(async () => {
    setErrorMessage(null);

    // 1. Pre-flight check: Despertar hardware y validar permisos mediante getUserMedia
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Liberar inmediatamente las pistas para que SpeechRecognition tenga acceso libre
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (mediaErr: any) {
      console.warn("[startRecording] Error solicitando micrófono:", mediaErr);
      if (mediaErr.name === "NotAllowedError" || mediaErr.name === "PermissionDeniedError") {
        setErrorMessage(
          "Permiso de micrófono denegado. Permite el acceso al micrófono haciendo clic en el icono del candado en la barra de URL."
        );
      } else if (mediaErr.name === "NotFoundError" || mediaErr.name === "DevicesNotFoundError") {
        setErrorMessage(
          "No se encontró ningún micrófono conectado en tu equipo. Conecta un micrófono e inténtalo de nuevo."
        );
      } else {
        setErrorMessage(
          "No se puede acceder al micrófono. Verifica que otra aplicación no lo esté usando de forma exclusiva."
        );
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      return;
    }

    // 2. Crear instancia limpia de reconocimiento
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const instance = setupRecognition();
      if (!instance) {
        setErrorMessage("Reconocimiento de voz no compatible con este navegador.");
        return;
      }

      recognitionRef.current = instance;
      isRecordingRef.current = true;
      setIsRecording(true);
      lastChunkRef.current = "";
      instance.lang = sourceLangRef.current;
      instance.start();
    } catch (startErr: any) {
      console.warn("[startRecording] Error al arrancar SpeechRecognition:", startErr);
      setErrorMessage("No se pudo iniciar el servicio de dictado. Intenta de nuevo.");
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [setupRecognition]);

  // Detener grabación limpiamente
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (silenceCommitTimerRef.current) {
      clearTimeout(silenceCommitTimerRef.current);
      silenceCommitTimerRef.current = null;
    }

    // Consolidar remanente si había interim pendiente
    if (interimTextRef.current.trim()) {
      appendOrNewSegment(interimTextRef.current.trim());
      interimTextRef.current = "";
      setInterimText("");
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [appendOrNewSegment]);

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
    setInterimTranslatedText("");
    interimTextRef.current = "";
    if (interimTranslateTimerRef.current) {
      clearTimeout(interimTranslateTimerRef.current);
      interimTranslateTimerRef.current = null;
    }
    setDurationSeconds(0);
    lastChunkRef.current = "";
    setErrorMessage(null);
  }, []);

  // Actualizar idioma de reconocimiento si cambia dinámicamente y forzar a Chromium a cargar el nuevo modelo
  useEffect(() => {
    const prevLang = sourceLangRef.current;
    sourceLangRef.current = sourceLang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLang;
    }

    // Si el usuario cambia el idioma mientras el micrófono está grabando,
    // destruimos limpiamente la sesión vieja de Chrome y creamos una nueva instancia
    // vinculada estrictamente al nuevo idioma (ej: pt-BR) para que Google Speech API
    // conmute sus servidores de inmediato sin quedarse atascado en el idioma anterior.
    if (isRecordingRef.current && prevLang !== sourceLang) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        }
      } catch (e) {}

      setTimeout(() => {
        if (isRecordingRef.current) {
          const freshInstance = setupRecognition();
          if (freshInstance) {
            freshInstance.lang = sourceLang;
            recognitionRef.current = freshInstance;
            try {
              freshInstance.start();
            } catch (err) {
              console.warn("[useSpeechDictation] Error al reiniciar SpeechRecognition con nuevo idioma:", err);
            }
          }
        }
      }, 100);
    }
  }, [sourceLang, setupRecognition]);

  const retranslateAll = useCallback(
    async (newTargetLang: "en" | "pt" | "es", newSourceLang?: string) => {
      targetLangRef.current = newTargetLang;
      if (newSourceLang && newSourceLang !== sourceLangRef.current) {
        const prevLang = sourceLangRef.current;
        sourceLangRef.current = newSourceLang;
        if (recognitionRef.current) {
          recognitionRef.current.lang = newSourceLang;
        }

        if (isRecordingRef.current && prevLang !== newSourceLang) {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.onend = null;
              recognitionRef.current.onerror = null;
              recognitionRef.current.abort();
            }
          } catch (e) {}

          setTimeout(() => {
            if (isRecordingRef.current) {
              const freshInstance = setupRecognition();
              if (freshInstance) {
                freshInstance.lang = newSourceLang;
                recognitionRef.current = freshInstance;
                try {
                  freshInstance.start();
                } catch (err) {}
              }
            }
          }, 100);
        }
      }
      for (const seg of segments) {
        translateSegment(seg.id, seg.originalText);
      }
    },
    [segments, translateSegment, setupRecognition]
  );

  // Actualizar el texto original de un segmento específico (edición en vivo)
  const updateSegmentText = useCallback(
    (segmentId: string, newText: string) => {
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === segmentId ? { ...seg, originalText: newText } : seg
        )
      );

      // Si autoTranslate está activo y el texto no está vacío, re-traducir
      if (autoTranslateRef.current && newText.trim()) {
        translateSegment(segmentId, newText);
      }
    },
    [translateSegment]
  );

  // Actualizar directamente la traducción de un segmento
  const updateTranslatedText = useCallback(
    (segmentId: string, newTranslation: string) => {
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === segmentId ? { ...seg, translatedText: newTranslation } : seg
        )
      );
    },
    []
  );

  // Eliminar un segmento específico
  const deleteSegment = useCallback((segmentId: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== segmentId));
  }, []);

  // Agregar un segmento completo directamente (por ejemplo, desde carga de archivo de audio)
  const addDirectSegment = useCallback((originalText: string, translatedText: string) => {
    const newId = `seg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setSegments((prev) => [
      ...prev,
      {
        id: newId,
        originalText: originalText.trim(),
        translatedText: translatedText.trim(),
        timestamp: Date.now(),
        isFinal: true,
      },
    ]);
  }, []);

  // Eliminar el último segmento
  const deleteLastSegment = useCallback(() => {
    setSegments((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  // Limpieza al desmontar el hook
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (silenceCommitTimerRef.current) clearTimeout(silenceCommitTimerRef.current);
      if (interimTranslateTimerRef.current) clearTimeout(interimTranslateTimerRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isRecording,
    interimText,
    interimTranslatedText,
    segments,
    isSupported,
    durationSeconds,
    errorMessage,
    clearError,
    startRecording,
    stopRecording,
    toggleRecording,
    clearAll,
    retranslateAll,
    updateSegmentText,
    updateTranslatedText,
    deleteSegment,
    deleteLastSegment,
    addDirectSegment,
  };
}

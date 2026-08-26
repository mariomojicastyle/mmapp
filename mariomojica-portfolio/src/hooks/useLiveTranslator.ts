"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  speaker: "mario" | "cliente" | "sistema";
  originalText: string;
  translatedText: string;
  fromLang: string;
  toLang: string;
  timestamp: number;
}

export function useLiveTranslator({
  sala = "henn",
  role = "mario",
  myLang = "es",
  targetLang = "pt"
}: {
  sala?: string;
  role?: "mario" | "cliente";
  myLang?: string;
  targetLang?: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [ttsVolume, setTtsVolume] = useState(0.9);
  const [isConnected, setIsConnected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const lastSyncTimestampRef = useRef<number>(0);

  // Inicializar Web Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition no soportado en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = myLang === "es" ? "es-CO" : myLang === "pt" ? "pt-BR" : "en-US";

    recognition.onresult = async (event: any) => {
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const finalText = transcript.trim();
          if (finalText) {
            await handleFinalTranscript(finalText);
          }
        } else {
          currentInterim += transcript;
        }
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-reiniciar si sigue en modo escucha
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          // Ya iniciado
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [myLang, isListening]);

  // Manejar frase final: traducir, hablar y enviar a la sala
  const handleFinalTranscript = async (finalText: string) => {
    setInterimText("");
    try {
      // 1. Llamar a la API de traducción rápida
      const res = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: finalText,
          fromLang: myLang,
          toLang: targetLang
        })
      });

      const data = await res.json();
      const translated = data.translation || finalText;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        speaker: role,
        originalText: finalText,
        translatedText: translated,
        fromLang: myLang,
        toLang: targetLang,
        timestamp: Date.now()
      };

      // Guardar localmente
      setMessages(prev => [...prev, newMsg]);

      // Enviar a la sala compartida
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_message",
          sala,
          message: newMsg
        })
      });

    } catch (err) {
      console.error("Error al procesar transcripción final:", err);
    }
  };

  // Reproducir Text-to-Speech (TTS)
  const speakText = useCallback((textToSpeak: string, langCode: string) => {
    if (typeof window === "undefined" || !isTTSEnabled || !textToSpeak) return;

    try {
      window.speechSynthesis.cancel(); // Cancelar previos
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode === "pt" ? "pt-BR" : langCode === "en" ? "en-US" : "es-ES";
      utterance.volume = ttsVolume;
      utterance.rate = 1.05; // Levemente ágil para no retrasarse

      // Buscar voz nativa si existe
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Error:", e);
    }
  }, [isTTSEnabled, ttsVolume]);

  // Polling de sincronización bilateral en la sala compartida
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/copiloto/sesion?sala=${sala}&since=${lastSyncTimestampRef.current}`);
        if (res.ok) {
          const data = await res.json();
          setIsConnected(true);
          if (data.messages && data.messages.length > 0) {
            // Filtrar mensajes de otros participantes
            const incomingOthers = data.messages.filter((m: ChatMessage) => m.speaker !== role);
            if (incomingOthers.length > 0) {
              setMessages(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = incomingOthers.filter((m: ChatMessage) => !existingIds.has(m.id));
                
                // Si hay mensaje nuevo del otro participante, reproducir TTS si está activo
                uniqueNew.forEach((m: ChatMessage) => {
                  speakText(m.translatedText, myLang);
                });

                return [...prev, ...uniqueNew];
              });
            }
            lastSyncTimestampRef.current = data.lastUpdated || Date.now();
          }
        }
      } catch (e) {
        setIsConnected(false);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [sala, role, myLang, speakText]);

  // Control de inicio/parada
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText("");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error al iniciar micrófono:", err);
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    isListening,
    interimText,
    messages,
    isTTSEnabled,
    setIsTTSEnabled,
    ttsVolume,
    setTtsVolume,
    isConnected,
    toggleListening,
    clearMessages
  };
}

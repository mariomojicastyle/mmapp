"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  speaker: "mario" | "cliente" | "sistema";
  speakerName?: string;
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
  const [isConnected, setIsConnected] = useState(true);

  const recognitionRef = useRef<any>(null);
  const speechBufferRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);
  const lastProcessedSentenceRef = useRef<string>("");
  const isProcessingRef = useRef<boolean>(false);

  // Reproducir Text-to-Speech (TTS) para el receptor
  const speakText = useCallback((textToSpeak: string, langCode: string) => {
    if (typeof window === "undefined" || !isTTSEnabled || !textToSpeak) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode === "pt" ? "pt-BR" : langCode === "en" ? "en-US" : "es-ES";
      utterance.volume = ttsVolume;
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
      if (matchingVoice) utterance.voice = matchingVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Error:", e);
    }
  }, [isTTSEnabled, ttsVolume]);

  // Enviar y traducir una frase completa única
  const commitCompleteSentence = async (fullSentence: string) => {
    const trimmed = fullSentence.trim();
    if (!trimmed || trimmed.length < 2 || trimmed === lastProcessedSentenceRef.current || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    lastProcessedSentenceRef.current = trimmed;
    speechBufferRef.current = "";
    setInterimText("");

    try {
      // 1. Traducir frase
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          fromLang: myLang,
          toLang: targetLang
        })
      });

      const transData = await resTrans.json();
      const translated = transData.translation || trimmed;

      const newMsg: ChatMessage = {
        id: `msg_${sala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: role,
        speakerName: role === "mario" ? "Mario Mojica" : "Marcos Unnass",
        originalText: trimmed,
        translatedText: translated,
        fromLang: myLang,
        toLang: targetLang,
        timestamp: Date.now()
      };

      // 2. Guardar en estado local inmediatamente
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMsg.id || (m.originalText === trimmed && Math.abs(m.timestamp - newMsg.timestamp) < 3000));
        return exists ? prev : [...prev, newMsg];
      });

      // 3. Enviar a Supabase Cloud
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
      console.error("Error transmitiendo frase:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Inicializar Web Speech Recognition con Acumulación Inteligente y Detección de Silencio
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

    recognition.onresult = (event: any) => {
      let liveTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          speechBufferRef.current = (speechBufferRef.current + " " + text).trim();
        } else {
          liveTranscript += text;
        }
      }

      const currentDraft = (speechBufferRef.current + " " + liveTranscript).trim();
      setInterimText(currentDraft);

      // Reiniciar temporizador de silencio (1.2s después de callar la voz, se consolida la frase)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const sentenceToCommit = (speechBufferRef.current + " " + liveTranscript).trim();
        if (sentenceToCommit) {
          commitCompleteSentence(sentenceToCommit);
        }
      }, 1200);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [myLang, isListening, targetLang, role, sala]);

  // Polling Realtime a Supabase Cloud (Consulta mensajes de la sala)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/copiloto/sesion?sala=${sala}`);
        if (res.ok) {
          const data = await res.json();
          setIsConnected(true);
          if (data.allMessages && Array.isArray(data.allMessages)) {
            setMessages(prev => {
              const existingMap = new Map(prev.map(m => [m.id, m]));
              let hasNewFromOther = false;

              data.allMessages.forEach((incoming: ChatMessage) => {
                if (!existingMap.has(incoming.id)) {
                  existingMap.set(incoming.id, incoming);
                  if (incoming.speaker !== role) {
                    hasNewFromOther = true;
                    speakText(incoming.translatedText, myLang);
                  }
                }
              });

              return Array.from(existingMap.values()).sort((a, b) => a.timestamp - b.timestamp);
            });
          }
        }
      } catch (e) {
        setIsConnected(false);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [sala, role, myLang, speakText]);

  // Control de inicio/parada manual del micrófono
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Consolidar lo que quede en el buffer inmediatamente
      if (speechBufferRef.current) {
        commitCompleteSentence(speechBufferRef.current);
      }
    } else {
      speechBufferRef.current = "";
      lastProcessedSentenceRef.current = "";
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error al iniciar micrófono:", err);
      }
    }
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
    toggleListening
  };
}

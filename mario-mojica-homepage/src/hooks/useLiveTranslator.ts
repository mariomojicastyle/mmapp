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
  const isListeningRef = useRef<boolean>(false);
  const myLangRef = useRef<string>(myLang);
  const targetLangRef = useRef<string>(targetLang);
  const roleRef = useRef<string>(role);
  const salaRef = useRef<string>(sala);

  const lastSentSentenceRef = useRef<string>("");
  const isSendingRef = useRef<boolean>(false);
  const accumulatedFinalRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);

  // Mantener refs sincronizados para evitar re-renders destructivos
  useEffect(() => {
    myLangRef.current = myLang;
    targetLangRef.current = targetLang;
    roleRef.current = role;
    salaRef.current = sala;
  }, [myLang, targetLang, role, sala]);

  // Reproducir Text-to-Speech (TTS)
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

  // Enviar y traducir una frase completa a Supabase
  const sendFinalSentence = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || text.length < 2 || text === lastSentSentenceRef.current || isSendingRef.current) {
      return;
    }

    isSendingRef.current = true;
    lastSentSentenceRef.current = text;
    accumulatedFinalRef.current = "";
    setInterimText("");

    const currentRole = roleRef.current;
    const currentMyLang = myLangRef.current;
    const currentTargetLang = targetLangRef.current;
    const currentSala = salaRef.current;

    try {
      // 1. Traducir frase
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          fromLang: currentMyLang,
          toLang: currentTargetLang
        })
      });

      const transData = await resTrans.json();
      const translated = transData.translation || text;

      const newMsg: ChatMessage = {
        id: `msg_${currentSala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: currentRole as any,
        speakerName: currentRole === "mario" ? "Mario Mojica" : "Marcos Unnass",
        originalText: text,
        translatedText: translated,
        fromLang: currentMyLang,
        toLang: currentTargetLang,
        timestamp: Date.now()
      };

      // 2. Guardar en estado local
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMsg.id || (m.originalText === text && Math.abs(m.timestamp - newMsg.timestamp) < 4000));
        return exists ? prev : [...prev, newMsg];
      });

      // 3. Enviar a Supabase Cloud
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_message",
          sala: currentSala,
          message: newMsg
        })
      });

    } catch (err) {
      console.error("Error transmitiendo frase:", err);
    } finally {
      isSendingRef.current = false;
    }
  };

  // Inicializar Recognition una sola vez
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

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptText = item[0].transcript;
        if (item.isFinal) {
          accumulatedFinalRef.current = (accumulatedFinalRef.current + " " + transcriptText).trim();
        } else {
          interim += transcriptText;
        }
      }

      const fullDraft = (accumulatedFinalRef.current + " " + interim).trim();
      setInterimText(fullDraft);

      // Detección de Silencio (1.2 segundos tras callar la voz consolida la frase)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const sentenceToCommit = (accumulatedFinalRef.current + " " + interim).trim();
        if (sentenceToCommit) {
          sendFinalSentence(sentenceToCommit);
        }
      }, 1200);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // Si el usuario no lo apagó manualmente, reiniciar suavemente
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [myLang]);

  // Polling Realtime a Supabase Cloud (Consulta mensajes de la sala cada 1 segundo)
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
                  if (incoming.speaker !== roleRef.current) {
                    hasNewFromOther = true;
                    speakText(incoming.translatedText, myLangRef.current);
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
  }, [sala, speakText]);

  // Control manual del micrófono (Garantizado con evento de usuario directo)
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListeningRef.current) {
      // Apagar micrófono
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current.stop();
      } catch (e) {}

      // Consolidar lo que quede en el buffer
      if (accumulatedFinalRef.current) {
        sendFinalSentence(accumulatedFinalRef.current);
      }
    } else {
      // Encender micrófono
      accumulatedFinalRef.current = "";
      lastSentSentenceRef.current = "";
      setInterimText("");
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error iniciando micrófono:", err);
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

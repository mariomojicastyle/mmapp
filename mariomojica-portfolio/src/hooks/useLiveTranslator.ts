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

// Limpiador NLP de frases y palabras duplicadas
function cleanAggressiveDuplicates(text: string): string {
  if (!text) return "";
  let str = text.trim();

  // 1. Eliminar palabras repetidas consecutivas
  str = str.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");

  // 2. Eliminar n-gramas repetidos (de 2 a 12 palabras)
  let words = str.split(/\s+/);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 8) {
    changed = false;
    iterations++;
    for (let len = Math.min(10, Math.floor(words.length / 2)); len >= 2; len--) {
      for (let i = 0; i <= words.length - 2 * len; i++) {
        const phrase1 = words.slice(i, i + len).join(" ").toLowerCase();
        const phrase2 = words.slice(i + len, i + 2 * len).join(" ").toLowerCase();
        if (phrase1 === phrase2) {
          words.splice(i + len, len);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return words.join(" ").trim();
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
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isMeetingActiveRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);

  const myLangRef = useRef<string>(myLang);
  const targetLangRef = useRef<string>(targetLang);
  const roleRef = useRef<string>(role);
  const salaRef = useRef<string>(sala);

  const silenceTimerRef = useRef<any>(null);
  const lastProcessedTextRef = useRef<string>("");

  useEffect(() => {
    myLangRef.current = myLang;
    targetLangRef.current = targetLang;
    roleRef.current = role;
    salaRef.current = sala;
  }, [myLang, targetLang, role, sala]);

  // Consultar mensajes del servidor
  const fetchRoomMessages = useCallback(async () => {
    try {
      const currentSala = salaRef.current;
      const res = await fetch(`/api/copiloto/sesion?sala=${currentSala}`);
      if (res.ok) {
        const data = await res.json();
        setIsConnected(true);
        if (data.allMessages && Array.isArray(data.allMessages)) {
          setMessages(prev => {
            const existingMap = new Map(prev.map(m => [m.id, m]));
            let hasNew = false;

            data.allMessages.forEach((incoming: ChatMessage) => {
              if (!existingMap.has(incoming.id)) {
                existingMap.set(incoming.id, incoming);
                hasNew = true;
              }
            });

            return hasNew
              ? Array.from(existingMap.values()).sort((a, b) => a.timestamp - b.timestamp)
              : prev;
          });
        }
      }
    } catch (e) {
      setIsConnected(false);
    }
  }, []);

  // Traducir y emitir de inmediato en tiempo real
  const translateAndCommit = async (rawText: string) => {
    const cleanedText = cleanAggressiveDuplicates(rawText);
    if (!cleanedText || cleanedText.length < 2 || cleanedText === lastProcessedTextRef.current) {
      return;
    }

    lastProcessedTextRef.current = cleanedText;
    setIsTranslating(true);
    setInterimText("");

    const currentRole = roleRef.current;
    const currentMyLang = myLangRef.current;
    const currentTargetLang = targetLangRef.current;
    const currentSala = salaRef.current;

    try {
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          fromLang: currentMyLang,
          toLang: currentTargetLang
        })
      });

      const transData = await resTrans.json();
      const translated = cleanAggressiveDuplicates(transData.translation || cleanedText);

      const newMsg: ChatMessage = {
        id: `msg_${currentSala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: currentRole as any,
        speakerName: currentRole === "mario" ? "Mario Mojica" : "Marcos Unnass",
        originalText: cleanedText,
        translatedText: translated,
        fromLang: currentMyLang,
        toLang: currentTargetLang,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newMsg]);

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
      console.error("Error en traducción tiempo real:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Inicializar Web Speech Recognition Fluido
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
      setIsMeetingActive(true);
      isMeetingActiveRef.current = true;
      manualStopRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk;
        } else {
          currentInterim += transcriptChunk;
        }
      }

      const cleanedInterim = cleanAggressiveDuplicates(currentInterim);
      if (cleanedInterim) {
        setInterimText(cleanedInterim);
      }

      // Si tenemos un segmento final reconocido por el PC
      if (finalTranscript.trim()) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        translateAndCommit(finalTranscript.trim());
      } else if (currentInterim.trim()) {
        // Pausa rápida de 1.0s para procesar en tiempo real sin demoras
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentInterim.trim() && isMeetingActiveRef.current) {
            translateAndCommit(currentInterim.trim());
          }
        }, 1000);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsMeetingActive(false);
        isMeetingActiveRef.current = false;
        manualStopRef.current = true;
      }
    };

    // Auto-reinicio para sesión continua
    recognition.onend = () => {
      if (isMeetingActiveRef.current && !manualStopRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsMeetingActive(false);
        isMeetingActiveRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isMeetingActiveRef.current = false;
      manualStopRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [myLang]);

  // Polling de sincronización cada 1s
  useEffect(() => {
    fetchRoomMessages();
    const pollInterval = setInterval(fetchRoomMessages, 1000);
    return () => clearInterval(pollInterval);
  }, [fetchRoomMessages]);

  const toggleMeeting = () => {
    if (!recognitionRef.current) return;

    if (isMeetingActiveRef.current) {
      manualStopRef.current = true;
      isMeetingActiveRef.current = false;
      setIsMeetingActive(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      try {
        recognitionRef.current.abort();
      } catch (e) {}

      if (interimText) {
        translateAndCommit(interimText);
      }
    } else {
      setInterimText("");
      lastProcessedTextRef.current = "";
      manualStopRef.current = false;
      isMeetingActiveRef.current = true;
      setIsMeetingActive(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error iniciando micrófono:", err);
      }
    }
  };

  return {
    isMeetingActive,
    isListening: isMeetingActive,
    interimText,
    messages,
    isConnected,
    isTranslating,
    toggleMeeting,
    toggleListening: toggleMeeting
  };
}

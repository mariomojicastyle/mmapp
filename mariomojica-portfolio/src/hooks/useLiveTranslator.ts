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

  str = str.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");

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
  activeLang = "es",
  participanteCliente = "Marcos Unnass",
  participanteMario = "Mario Mojica"
}: {
  sala?: string;
  activeLang?: "es" | "pt";
  participanteCliente?: string;
  participanteMario?: string;
}) {
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isMeetingActiveRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);

  const salaRef = useRef<string>(sala);
  const activeLangRef = useRef<string>(activeLang);
  const clientNameRef = useRef<string>(participanteCliente);
  const hostNameRef = useRef<string>(participanteMario);

  const silenceTimerRef = useRef<any>(null);
  const lastProcessedTextRef = useRef<string>("");

  useEffect(() => {
    salaRef.current = sala;
    activeLangRef.current = activeLang;
    clientNameRef.current = participanteCliente;
    hostNameRef.current = participanteMario;

    if (recognitionRef.current && isMeetingActiveRef.current) {
      recognitionRef.current.lang = activeLang === "pt" ? "pt-BR" : "es-CO";
    }
  }, [sala, activeLang, participanteCliente, participanteMario]);

  // Consultar mensajes del servidor
  const fetchRoomMessages = useCallback(async () => {
    try {
      const currentSala = salaRef.current;
      const res = await fetch(`/api/copiloto/sesion?sala=${currentSala}`);
      if (res.ok) {
        const data = await res.json();
        setIsConnected(true);
        if (data.allMessages && Array.isArray(data.allMessages)) {
          setMessages(data.allMessages);
        }
      }
    } catch (e) {
      setIsConnected(false);
    }
  }, []);

  // Limpiar mensajes locales y de la base de datos
  const clearMessages = async () => {
    setMessages([]);
    setInterimText("");
    lastProcessedTextRef.current = "";
    try {
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_room_data",
          sala: salaRef.current
        })
      });
    } catch (e) {}
  };

  // Traducir y emitir de inmediato
  const translateAndCommit = async (rawText: string) => {
    const cleanedText = cleanAggressiveDuplicates(rawText);
    if (!cleanedText || cleanedText.length < 2 || cleanedText === lastProcessedTextRef.current) {
      return;
    }

    lastProcessedTextRef.current = cleanedText;
    setIsTranslating(true);
    setInterimText("");

    const currentLang = activeLangRef.current;
    const isPtSource = currentLang === "pt";
    const fromLang = isPtSource ? "pt" : "es";
    const toLang = isPtSource ? "es" : "pt";
    const speaker = isPtSource ? "cliente" : "mario";
    const speakerName = isPtSource ? clientNameRef.current : hostNameRef.current;
    const currentSala = salaRef.current;

    try {
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          fromLang,
          toLang
        })
      });

      const transData = await resTrans.json();
      const translated = cleanAggressiveDuplicates(transData.translation || cleanedText);

      const newMsg: ChatMessage = {
        id: `msg_${currentSala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker,
        speakerName,
        originalText: cleanedText,
        translatedText: translated,
        fromLang,
        toLang,
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

  // Inicializar Web Speech Recognition con el micrófono del portátil
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
    recognition.lang = activeLang === "pt" ? "pt-BR" : "es-CO";

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

      if (finalTranscript.trim()) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        translateAndCommit(finalTranscript.trim());
      } else if (currentInterim.trim()) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentInterim.trim() && isMeetingActiveRef.current) {
            translateAndCommit(currentInterim.trim());
          }
        }, 900);
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
  }, [activeLang]);

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
    toggleListening: toggleMeeting,
    clearMessages
  };
}

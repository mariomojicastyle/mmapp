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

// Extracción de texto
function extractTranscriptFromEvent(eventResults: any): string {
  if (!eventResults || eventResults.length === 0) return "";

  const lastText = eventResults[eventResults.length - 1][0]?.transcript?.trim() || "";
  const firstText = eventResults[0][0]?.transcript?.trim() || "";

  if (eventResults.length > 1 && lastText.toLowerCase().includes(firstText.toLowerCase())) {
    return lastText;
  }

  let combined = "";
  for (let i = 0; i < eventResults.length; i++) {
    const chunk = eventResults[i][0]?.transcript?.trim() || "";
    if (chunk && !combined.includes(chunk)) {
      combined += " " + chunk;
    }
  }
  return (combined || lastText).trim();
}

// Limpiador NLP
function cleanAggressiveDuplicates(text: string): string {
  if (!text) return "";
  let str = text.trim();

  str = str.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");

  let words = str.split(/\s+/);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (let len = Math.min(12, Math.floor(words.length / 2)); len >= 2; len--) {
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
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [ttsVolume, setTtsVolume] = useState(0.9);
  const [isConnected, setIsConnected] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);

  const myLangRef = useRef<string>(myLang);
  const targetLangRef = useRef<string>(targetLang);
  const roleRef = useRef<string>(role);
  const salaRef = useRef<string>(sala);

  const currentDictationTextRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);
  const isTranslatingRef = useRef<boolean>(false);

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
                if (incoming.speaker !== roleRef.current) {
                  speakText(incoming.translatedText, myLangRef.current);
                }
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
  }, [speakText]);

  // Traducir el bloque completo y enviarlo a Supabase
  const translateAndCommitBlock = async (rawBlockText: string) => {
    const cleanedText = cleanAggressiveDuplicates(rawBlockText);
    if (!cleanedText || cleanedText.length < 2 || isTranslatingRef.current) {
      return;
    }

    isTranslatingRef.current = true;
    setIsTranslating(true);
    currentDictationTextRef.current = "";
    setInterimText("");

    const currentRole = roleRef.current;
    const currentMyLang = myLangRef.current;
    const currentTargetLang = targetLangRef.current;
    const currentSala = salaRef.current;

    try {
      // 1. Traducir el bloque limpio
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

      // 2. Insertar inmediatamente en la vista local
      setMessages(prev => [...prev, newMsg]);

      // 3. Persistir en Supabase Cloud
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_message",
          sala: currentSala,
          message: newMsg
        })
      });

      // 4. Forzar sincronización inmediata
      setTimeout(() => fetchRoomMessages(), 300);

    } catch (err) {
      console.error("Error al traducir y enviar bloque:", err);
    } finally {
      isTranslatingRef.current = false;
      setIsTranslating(false);
    }
  };

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

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      manualStopRef.current = false;
    };

    recognition.onresult = (event: any) => {
      const extracted = extractTranscriptFromEvent(event.results);
      const cleaned = cleanAggressiveDuplicates(extracted);

      currentDictationTextRef.current = cleaned;
      setInterimText(cleaned);

      // Esperar 2.5s de silencio antes de traducir y enviar
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (currentDictationTextRef.current && isListeningRef.current) {
          toggleListening();
        }
      }, 2500);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsListening(false);
        isListeningRef.current = false;
        manualStopRef.current = true;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current && !manualStopRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      manualStopRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [myLang]);

  // Polling Realtime a Supabase Cloud cada 800ms
  useEffect(() => {
    fetchRoomMessages();
    const pollInterval = setInterval(fetchRoomMessages, 800);
    return () => clearInterval(pollInterval);
  }, [fetchRoomMessages]);

  // Control manual del micrófono
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListeningRef.current) {
      manualStopRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      try {
        recognitionRef.current.abort();
      } catch (e) {}

      const textToCommit = currentDictationTextRef.current;
      if (textToCommit) {
        translateAndCommitBlock(textToCommit);
      }
    } else {
      currentDictationTextRef.current = "";
      setInterimText("");
      manualStopRef.current = false;
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error iniciando micrófono:", err);
      }
    }
  };

  const submitCurrentDictation = () => {
    if (currentDictationTextRef.current) {
      toggleListening();
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
    isTranslating,
    toggleListening,
    submitCurrentDictation
  };
}

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

// Filtro inteligente para colapsar repeticiones accidentales del motor de voz móvil
function cleanRepeatedPhrases(text: string): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return text.trim();

  // 1. Eliminar repetición inmediata de palabras idénticas
  const step1: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
      step1.push(words[i]);
    }
  }

  // 2. Colapsar bloques de frases repetidas
  let cleaned = [...step1];
  for (let blockSize = Math.floor(cleaned.length / 2); blockSize >= 2; blockSize--) {
    for (let i = 0; i <= cleaned.length - 2 * blockSize; i++) {
      const b1 = cleaned.slice(i, i + blockSize).join(" ");
      const b2 = cleaned.slice(i + blockSize, i + 2 * blockSize).join(" ");
      if (b1.toLowerCase() === b2.toLowerCase()) {
        cleaned.splice(i + blockSize, blockSize);
        i--;
      }
    }
  }
  return cleaned.join(" ");
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

  const currentSpeechDraftRef = useRef<string>("");
  const lastSentSentenceRef = useRef<string>("");
  const isSendingRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);

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

  // Fijar y transmitir la frase completa única a Supabase
  const commitAndSend = async (rawText: string) => {
    const cleaned = cleanRepeatedPhrases(rawText);
    if (!cleaned || cleaned.length < 2 || cleaned === lastSentSentenceRef.current || isSendingRef.current) {
      return;
    }

    isSendingRef.current = true;
    lastSentSentenceRef.current = cleaned;
    currentSpeechDraftRef.current = "";
    setInterimText("");

    const currentRole = roleRef.current;
    const currentMyLang = myLangRef.current;
    const currentTargetLang = targetLangRef.current;
    const currentSala = salaRef.current;

    try {
      // 1. Traducir frase con API ultra rápida
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleaned,
          fromLang: currentMyLang,
          toLang: currentTargetLang
        })
      });

      const transData = await resTrans.json();
      const translated = cleanRepeatedPhrases(transData.translation || cleaned);

      const newMsg: ChatMessage = {
        id: `msg_${currentSala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: currentRole as any,
        speakerName: currentRole === "mario" ? "Mario Mojica" : "Marcos Unnass",
        originalText: cleaned,
        translatedText: translated,
        fromLang: currentMyLang,
        toLang: currentTargetLang,
        timestamp: Date.now()
      };

      // 2. Fijar inmediatamente en la UI local
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMsg.id || (m.originalText === cleaned && Math.abs(m.timestamp - newMsg.timestamp) < 4000));
        return exists ? prev : [...prev, newMsg];
      });

      // 3. Persistir en Supabase Cloud para que aparezca en el otro dispositivo en < 500ms
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
      console.error("Error fijando frase:", err);
    } finally {
      isSendingRef.current = false;
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
    };

    recognition.onresult = (event: any) => {
      // Reconstrucción limpia SIN concatenación acumulativa bucle
      let sentenceAccumulator = "";
      let hasFinal = false;

      for (let i = 0; i < event.results.length; ++i) {
        const chunk = event.results[i][0].transcript;
        sentenceAccumulator += chunk;
        if (event.results[i].isFinal) {
          hasFinal = true;
        }
      }

      const fullDraft = sentenceAccumulator.trim();
      currentSpeechDraftRef.current = fullDraft;
      setInterimText(fullDraft);

      // Auto-Fijar: 800ms de pausa o flag isFinal fija la oración de inmediato
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (currentSpeechDraftRef.current) {
          commitAndSend(currentSpeechDraftRef.current);
        }
      }, hasFinal ? 400 : 800);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // Si quedan palabras sin fijar, fijarlas antes de cerrar
      if (currentSpeechDraftRef.current) {
        commitAndSend(currentSpeechDraftRef.current);
      }

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

  // Polling Realtime a Supabase Cloud cada 1s
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

  // Control manual del micrófono
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListeningRef.current) {
      // Apagar y fijar inmediatamente lo que haya
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (currentSpeechDraftRef.current) {
        commitAndSend(currentSpeechDraftRef.current);
      }
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    } else {
      // Encender micrófono
      currentSpeechDraftRef.current = "";
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

  // Función para limpiar la sala de pruebas anteriores
  const clearRoomMessages = async () => {
    setMessages([]);
    setInterimText("");
    currentSpeechDraftRef.current = "";
    try {
      await fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear_messages",
          sala
        })
      });
    } catch (e) {}
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
    clearRoomMessages
  };
}

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

  // Traducir el bloque completo de dictado y enviarlo a Supabase
  const translateAndCommitBlock = async (rawBlockText: string) => {
    const textToTranslate = rawBlockText.trim();
    if (!textToTranslate || textToTranslate.length < 2 || isTranslatingRef.current) {
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
      // 1. Traducir el bloque completo
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToTranslate,
          fromLang: currentMyLang,
          toLang: currentTargetLang
        })
      });

      const transData = await resTrans.json();
      const translated = transData.translation || textToTranslate;

      const newMsg: ChatMessage = {
        id: `msg_${currentSala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: currentRole as any,
        speakerName: currentRole === "mario" ? "Mario Mojica" : "Marcos Unnass",
        originalText: textToTranslate,
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
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript + " ";
      }

      const text = fullTranscript.trim();
      currentDictationTextRef.current = text;
      setInterimText(text);

      // Esperar 2.5 segundos de silencio natural tras terminar de hablar antes de traducir el bloque
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (currentDictationTextRef.current && isListeningRef.current) {
          // Detener dictado y traducir el bloque completo
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

  // Encender / Apagar Micrófono con 1 Clic
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListeningRef.current) {
      // 1. APAGAR INMEDIATAMENTE
      manualStopRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      try {
        recognitionRef.current.abort();
      } catch (e) {}

      // 2. Si había texto dictado, traducirlo y publicarlo
      const textToCommit = currentDictationTextRef.current;
      if (textToCommit) {
        translateAndCommitBlock(textToCommit);
      }
    } else {
      // 1. ENCENDER
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

  // Función para forzar envío del dictado
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

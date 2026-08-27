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

// Clasificador Heurístico Automático de Idioma e Interlocutor (Español / Português)
function detectLanguageAndSpeaker(
  text: string,
  clientName = "Marcos Unnass",
  hostName = "Mario Mojica"
): { fromLang: "es" | "pt"; toLang: "es" | "pt"; speaker: "mario" | "cliente"; speakerName: string } {
  if (!text) return { fromLang: "es", toLang: "pt", speaker: "mario", speakerName: hostName };

  const lower = text.toLowerCase();

  const ptPatterns = [
    /\b(voc[eê]|voces|vocês)\b/i,
    /\b(n[aã]o|n[aã]o [eé]|n[aã]o est[aá]|n[aã]o temos)\b/i,
    /\b(obrigad[oa]|valeu|beleza|tchau|obrigado|obrigada)\b/i,
    /\b(tudo bem|bom dia|boa tarde|boa noite)\b/i,
    /\b(fala|falar|falando|falou)\b/i,
    /\b(ent[aã]o|tamb[eé]m|al[eé]m|est[aá]|est[aã]o)\b/i,
    /\b(pra|pro|pras|pros|dum|duma|pelo|pela|pelos|pelas)\b/i,
    /\b(reuni[aã]o|inova[cç][aã]o|f[aá]brica|m[oó]veis|produ[cç][aã]o)\b/i,
    /\b(custos|desenvolvimento|engenharia|montagem|manual)\b/i,
    /\b(com certeza|t[aá] bom|fechado|isso mesmo)\b/i,
    /\b(legal|bacana|otimo|[oó]timo|perfeito)\b/i
  ];

  const esPatterns = [
    /\b(usted|ustedes|nosotros|vosotros)\b/i,
    /\b(gracias|muchas gracias|de nada|hola)\b/i,
    /\b(buenos d[ií]as|buenas tardes|buenas noches)\b/i,
    /\b(estamos|estoy|estaba|tenemos|podemos|vamos)\b/i,
    /\b(entonces|tambi[eé]n|adem[aá]s|despu[eé]s)\b/i,
    /\b(por el|por la|para el|para la|del)\b/i,
    /\b(reuni[oó]n|f[aá]brica|muebles|producci[oó]n|ahorro)\b/i,
    /\b(claro que s[ií]|de acuerdo|perfecto|listo)\b/i
  ];

  let ptScore = 0;
  let esScore = 0;

  ptPatterns.forEach(p => { if (p.test(lower)) ptScore += 2; });
  esPatterns.forEach(p => { if (p.test(lower)) esScore += 2; });

  if (/[çãõê]/i.test(lower)) ptScore += 3;
  if (/[ñ¿¡]/i.test(lower)) esScore += 3;

  if (ptScore > esScore) {
    return {
      fromLang: "pt",
      toLang: "es",
      speaker: "cliente",
      speakerName: clientName
    };
  }

  return {
    fromLang: "es",
    toLang: "pt",
    speaker: "mario",
    speakerName: hostName
  };
}

export function useLiveTranslator({
  sala = "henn",
  participanteCliente = "Marcos Unnass",
  participanteMario = "Mario Mojica"
}: {
  sala?: string;
  participanteCliente?: string;
  participanteMario?: string;
}) {
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isMeetingActiveRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);
  const systemMediaStreamRef = useRef<MediaStream | null>(null);

  const salaRef = useRef<string>(sala);
  const clientNameRef = useRef<string>(participanteCliente);
  const hostNameRef = useRef<string>(participanteMario);

  const silenceTimerRef = useRef<any>(null);
  const lastProcessedTextRef = useRef<string>("");

  useEffect(() => {
    salaRef.current = sala;
    clientNameRef.current = participanteCliente;
    hostNameRef.current = participanteMario;
  }, [sala, participanteCliente, participanteMario]);

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

  // Traducir y emitir de inmediato con Auto-Detección de Idioma e Interlocutor
  const translateAndCommit = async (rawText: string) => {
    const cleanedText = cleanAggressiveDuplicates(rawText);
    if (!cleanedText || cleanedText.length < 2 || cleanedText === lastProcessedTextRef.current) {
      return;
    }

    lastProcessedTextRef.current = cleanedText;
    setIsTranslating(true);
    setInterimText("");

    const detected = detectLanguageAndSpeaker(
      cleanedText,
      clientNameRef.current,
      hostNameRef.current
    );

    const currentSala = salaRef.current;

    try {
      const resTrans = await fetch("/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          fromLang: detected.fromLang,
          toLang: detected.toLang
        })
      });

      const transData = await resTrans.json();
      const translated = cleanAggressiveDuplicates(transData.translation || cleanedText);

      const newMsg: ChatMessage = {
        id: `msg_${currentSala}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: detected.speaker,
        speakerName: detected.speakerName,
        originalText: cleanedText,
        translatedText: translated,
        fromLang: detected.fromLang,
        toLang: detected.toLang,
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

  // Capturar Audio Digital de Tarjeta de Sonido / Pestaña de Meet / Teams
  const enableSystemAudioCapture = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Tu navegador no soporta captura de audio de pantalla/sistema.");
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      systemMediaStreamRef.current = stream;
      setIsSystemAudioActive(true);

      stream.getVideoTracks()[0].onended = () => {
        setIsSystemAudioActive(false);
        systemMediaStreamRef.current = null;
      };

    } catch (err) {
      console.warn("Captura de audio de sistema cancelada:", err);
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
    recognition.lang = "es-CO";

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
      if (systemMediaStreamRef.current) {
        systemMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

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
    isSystemAudioActive,
    enableSystemAudioCapture,
    interimText,
    messages,
    isConnected,
    isTranslating,
    toggleMeeting,
    toggleListening: toggleMeeting,
    clearMessages
  };
}

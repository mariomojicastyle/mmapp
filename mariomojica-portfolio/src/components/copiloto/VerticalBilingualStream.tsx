"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useLiveTranslator";
import { Volume2, VolumeX, Sparkles, MessageSquare, Copy, Check } from "lucide-react";

export function VerticalBilingualStream({
  messages,
  interimText,
  myRole = "mario"
}: {
  messages: ChatMessage[];
  interimText: string;
  myRole?: "mario" | "cliente";
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-3 h-full overflow-hidden">
      {/* Encabezado del Feed Dual */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-600" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Subtítulos y Transcripción en Vivo (Google Meet)
          </h3>
        </div>
        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
          PT ⇄ ES Sincronizado
        </span>
      </div>

      {/* Encabezados de las 2 Columnas Verticales */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs font-extrabold">
        <div className="flex items-center gap-1.5 text-indigo-900">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>🇧🇷 O que diz a Henn (Português)</span>
        </div>
        <div className="flex items-center gap-1.5 text-cyan-900">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
          <span>🇪🇸 Lo que dice Mario (Español)</span>
        </div>
      </div>

      {/* Feed en Cascada con las 2 Columnas Sincronizadas */}
      <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-slate-50/60 rounded-xl border border-slate-200 min-h-[420px]">
        {messages.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
            <Sparkles className="w-8 h-8 text-cyan-500 mb-2 animate-bounce" />
            <p className="font-bold text-sm text-slate-700">Subtítulos Bilingües Listos</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Presiona <strong>"Activar Captura de Audio"</strong>. Lo que hable Marcos se verá en portugués a la izquierda y en español a la derecha en tiempo real.
            </p>
          </div>
        )}

        {messages.map(msg => {
          const ptText = msg.fromLang === "pt" ? msg.originalText : msg.translatedText;
          const esText = msg.fromLang === "es" ? msg.originalText : msg.translatedText;
          const isHennSpeaking = msg.fromLang === "pt" || msg.speaker === "cliente";

          return (
            <div
              key={msg.id}
              className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border transition shadow-sm ${
                isHennSpeaking
                  ? "bg-white border-indigo-200"
                  : "bg-white border-cyan-200"
              }`}
            >
              {/* Columna Izquierda: Portugués */}
              <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                  <span>{isHennSpeaking ? "🎙️ Voz de Marcos" : "Traduzido para PT"}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="text-xs md:text-sm font-semibold text-slate-900 leading-snug">
                  {ptText}
                </div>
              </div>

              {/* Columna Derecha: Español */}
              <div className="bg-cyan-50/40 p-2 rounded-lg border border-cyan-100 flex flex-col justify-between">
                <div className="text-[10px] text-cyan-700 font-semibold mb-1 flex items-center justify-between">
                  <span>{isHennSpeaking ? "Traducido a ES" : "🎙️ Voz de Mario"}</span>
                  <button
                    onClick={() => copyText(msg.id, esText)}
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                    title="Copiar texto"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-cyan-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-xs md:text-sm font-semibold text-slate-900 leading-snug">
                  {esText}
                </div>
              </div>
            </div>
          );
        })}

        {/* Audio en Streaming Activo */}
        {interimText && (
          <div className="p-3 bg-cyan-50 border border-dashed border-cyan-400 rounded-xl text-slate-800 animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
            <span className="text-xs font-bold text-cyan-900">Escuchando:</span>
            <span className="text-xs italic text-slate-700 font-medium">"{interimText}"</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

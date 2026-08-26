"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useLiveTranslator";
import { Volume2, VolumeX, Copy, Check, Sparkles, User, UserCheck } from "lucide-react";

export function LiveTranscriptFeed({
  messages,
  interimText,
  myRole = "mario",
  myLang = "es",
  targetLang = "pt"
}: {
  messages: ChatMessage[];
  interimText: string;
  myRole?: "mario" | "cliente";
  myLang?: string;
  targetLang?: string;
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
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 rounded-xl border border-slate-200 min-h-[360px] max-h-[580px]">
      {messages.length === 0 && !interimText && (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-cyan-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Sala Bilingüe Lista y Escuchando</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Presiona el micrófono para comenzar. Lo que se hable en <strong>{myLang.toUpperCase()}</strong> se traducirá en tiempo real a <strong>{targetLang.toUpperCase()}</strong> sin borrarse jamás.
          </p>
        </div>
      )}

      {/* Lista de Mensajes Persistentes */}
      {messages.map(msg => {
        const isMe = msg.speaker === myRole;

        return (
          <div
            key={msg.id}
            className={`p-3.5 rounded-xl border transition-all ${
              isMe
                ? "bg-white border-cyan-200 shadow-sm ml-4"
                : "bg-white border-slate-200 shadow-sm mr-4"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isMe ? "bg-cyan-500" : "bg-indigo-500"}`} />
                <span className="font-bold text-xs text-slate-800">
                  {isMe ? "Tú (Mario)" : "Móveis Henn (Marcos / Jonas)"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>

              <button
                onClick={() => copyText(msg.id, msg.translatedText)}
                className="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1 p-1"
                title="Copiar traducción"
              >
                {copiedId === msg.id ? <Check className="w-3 h-3 text-cyan-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* Texto Traducido Destacado */}
            <div className="text-sm font-semibold text-slate-900 leading-snug">
              {msg.translatedText}
            </div>

            {/* Texto Original en Gris */}
            <div className="text-[11px] text-slate-500 mt-1 italic">
              Original ({msg.fromLang.toUpperCase()}): "{msg.originalText}"
            </div>
          </div>
        );
      })}

      {/* Texto Provisional en Streaming */}
      {interimText && (
        <div className="p-3 rounded-xl bg-cyan-50/70 border border-dashed border-cyan-300 text-slate-700 animate-pulse">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span className="text-[11px] font-bold text-cyan-800">Escuchando en vivo...</span>
          </div>
          <p className="text-sm text-slate-800 italic">"{interimText}"</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useLiveTranslator";
import { Volume2, VolumeX, Copy, Check, MessageSquareText, Sparkles } from "lucide-react";

export function DualSubtitlesFeed({
  messages,
  interimText,
  myRole = "mario"
}: {
  messages: ChatMessage[];
  interimText: string;
  myRole?: "mario" | "cliente";
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-3">
      {/* Encabezado del Feed Dual */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-cyan-600" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Subtítulos Simultáneos en Vivo (Google Meet Screen Share)
          </h3>
        </div>
        <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
          PT ⇄ ES Sincronizado
        </span>
      </div>

      {/* Contenedor con Scroll de Dos Franjas */}
      <div className="overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200 max-h-[380px] min-h-[220px]">
        {messages.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
            <Sparkles className="w-6 h-6 text-cyan-500 mb-2" />
            <p className="font-bold text-sm text-slate-700">Subtítulos Listos</p>
            <p className="text-xs text-slate-500 max-w-sm mt-0.5">
              Habla tú en español o habla Marcos en portugués. Ambos textos aparecerán en paralelo en letras grandes y legibles.
            </p>
          </div>
        )}

        {messages.map(msg => {
          const isHenn = msg.speaker === "cliente" || msg.fromLang === "pt";

          return (
            <div
              key={msg.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              {/* Franja Portugués */}
              <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    🇧🇷 Português (Henn)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  {msg.fromLang === "pt" ? msg.originalText : msg.translatedText}
                </div>
              </div>

              {/* Franja Español */}
              <div className="bg-cyan-50/40 p-2.5 rounded-lg border border-cyan-100 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-900 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    🇪🇸 Español (Mario)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  {msg.fromLang === "es" ? msg.originalText : msg.translatedText}
                </div>
              </div>
            </div>
          );
        })}

        {/* Franja en Vivo Mientras se Habla */}
        {interimText && (
          <div className="p-3 bg-cyan-50/80 border border-dashed border-cyan-400 rounded-xl text-slate-800 animate-pulse">
            <span className="text-xs font-bold text-cyan-800 block mb-1">🎙️ Escuchando audio en directo...</span>
            <p className="text-sm italic font-medium">"{interimText}"</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

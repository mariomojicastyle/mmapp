"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useLiveTranslator";
import { Download } from "lucide-react";

export function SplitBilingualFeed({
  messages,
  interimText,
  clienteNombre = "Móveis Henn",
  participanteCliente = "Marcos Unnass",
  participanteMario = "Mario Mojica",
  uiLang = "es",
  onDownloadBoth,
  onDownloadPtPdf
}: {
  messages: ChatMessage[];
  interimText: string;
  clienteNombre?: string;
  participanteCliente?: string;
  participanteMario?: string;
  uiLang?: "es" | "pt";
  onDownloadBoth?: () => void;
  onDownloadPtPdf?: () => void;
}) {
  const bottomRefPt = useRef<HTMLDivElement>(null);
  const bottomRefEs = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRefPt.current?.scrollIntoView({ behavior: "smooth" });
    bottomRefEs.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  const isPt = uiLang === "pt";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden select-text">
      {/* Encabezados de las Dos Franjas */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold divide-x divide-slate-200 select-none">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>🇧🇷 Português ({clienteNombre})</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">{participanteCliente}</span>
        </div>
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>🇪🇸 Español (Mario)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">{participanteMario}</span>
        </div>
      </div>

      {/* Cajas de Texto Fluido Continuo (100% Seleccionable) */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 flex-1 overflow-hidden select-text cursor-text">
        {/* COLUMNA 1: PORTUGUÊS */}
        <div className="flex flex-col justify-between bg-white h-full overflow-hidden select-text">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm text-slate-800 leading-relaxed select-text">
            {messages.length === 0 && !interimText && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16 px-4 select-none">
                <p className="font-semibold text-xs text-slate-600">Transcrição em Português</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  O diálogo fluirá aqui continuamente. Você pode selecionar qualquer texto para copiar.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const ptText = msg.fromLang === "pt" ? msg.originalText : msg.translatedText;
              const isHenn = msg.fromLang === "pt" || msg.speaker === "cliente";
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div key={`pt-${msg.id}`} className="border-b border-slate-100 pb-2.5 last:border-0 select-text">
                  <div className="text-[11px] font-bold text-slate-500 mb-0.5 flex items-center gap-1.5 select-none">
                    <span className={`${isHenn ? "text-slate-900 font-extrabold" : "text-cyan-700"}`}>
                      {isHenn ? `${participanteCliente}:` : `${participanteMario}:`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">[{time}]</span>
                  </div>
                  <p className="text-slate-900 font-medium text-[13px] md:text-sm pl-1 select-text">
                    {ptText}
                  </p>
                </div>
              );
            })}

            {interimText && (
              <div className="text-xs text-cyan-800 italic bg-cyan-50/70 p-2 rounded border-l-2 border-cyan-500 animate-pulse select-none">
                Escutando: "{interimText}"
              </div>
            )}
            <div ref={bottomRefPt} />
          </div>

          {/* Botón Descargar Notas de la Reunión en PDF para el Cliente */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 select-none">
            <button
              onClick={onDownloadPtPdf}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              title="Baixar as notas e matriz de custos em PDF para o cliente"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Baixar Notas da Reunião (PT .pdf)</span>
            </button>
          </div>
        </div>

        {/* COLUMNA 2: ESPAÑOL */}
        <div className="flex flex-col justify-between bg-slate-50/30 h-full overflow-hidden select-text">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm text-slate-800 leading-relaxed select-text">
            {messages.length === 0 && !interimText && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16 px-4 select-none">
                <p className="font-semibold text-xs text-slate-600">Transcripción en Español</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  El diálogo traducido y tus respuestas aparecerán aquí. Puedes seleccionar cualquier texto para copiar.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const esText = msg.fromLang === "es" ? msg.originalText : msg.translatedText;
              const isMario = msg.fromLang === "es" || msg.speaker === "mario";
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div key={`es-${msg.id}`} className="border-b border-slate-100 pb-2.5 last:border-0 select-text">
                  <div className="text-[11px] font-bold text-slate-500 mb-0.5 flex items-center gap-1.5 select-none">
                    <span className={`${isMario ? "text-cyan-800 font-extrabold" : "text-slate-900"}`}>
                      {isMario ? `${participanteMario}:` : `${participanteCliente}:`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">[{time}]</span>
                  </div>
                  <p className="text-slate-900 font-medium text-[13px] md:text-sm pl-1 select-text">
                    {esText}
                  </p>
                </div>
              );
            })}

            {interimText && (
              <div className="text-xs text-cyan-800 italic bg-cyan-50/70 p-2 rounded border-l-2 border-cyan-500 animate-pulse select-none">
                Escuchando: "{interimText}"
              </div>
            )}
            <div ref={bottomRefEs} />
          </div>

          {/* Botón Descargar Simultáneamente MD y PDF para Mario */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 select-none">
            <button
              onClick={onDownloadBoth}
              className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              title="Descarga automáticamente ambos archivos: el .md para tu control y el .pdf con el logo de Mario Mojica"
            >
              <Download className="w-3.5 h-3.5 text-cyan-200" />
              <span>Descargar Notas (ES .md + .pdf)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

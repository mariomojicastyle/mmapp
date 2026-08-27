"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useLiveTranslator";
import { Download, Loader2 } from "lucide-react";

export function SplitBilingualFeed({
  messages,
  interimText,
  isTranslating = false,
  clienteNombre = "Móveis Henn",
  participanteCliente = "Marcos Unnass",
  participanteMario = "Mario Mojica",
  uiLang = "es",
  onDownloadBoth,
  onDownloadPtPdf
}: {
  messages: ChatMessage[];
  interimText: string;
  isTranslating?: boolean;
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm flex flex-col h-full overflow-hidden select-text">
      {/* 1. LEYENDA SUPERIOR DE INTERLOCUTORES CON BOLITAS DE COLOR */}
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold select-none shrink-0">
        <div className="flex items-center gap-3">
          {/* Bolita Cian: Mario */}
          <span className="flex items-center gap-1.5 text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shrink-0" />
            <span>{participanteMario}</span>
            <span className="text-[9px] text-slate-400 font-normal">(Español - Negrilla)</span>
          </span>

          {/* Bolita Esmeralda: Cliente */}
          <span className="flex items-center gap-1.5 text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shrink-0" />
            <span>{participanteCliente}</span>
            <span className="text-[9px] text-slate-400 font-normal">(Português - Tono Grafito)</span>
          </span>
        </div>

        <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
          Transcripción Simultánea B2B
        </span>
      </div>

      {/* 2. Encabezados de las Dos Columnas */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-white text-slate-900 text-xs font-extrabold divide-x divide-slate-200 select-none shrink-0">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Português ({clienteNombre})</span>
          </span>
        </div>
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
            <span className="truncate">Español (Mario)</span>
          </span>
        </div>
      </div>

      {/* 3. Cajas de Diálogo Paralelo Minimalistas */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 flex-1 overflow-hidden select-text cursor-text min-h-0">
        {/* COLUMNA 1: PORTUGUÊS */}
        <div className="flex flex-col justify-between bg-white h-full overflow-hidden select-text">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 font-sans text-xs sm:text-sm leading-relaxed select-text">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 px-3 select-none">
                <p className="font-semibold text-xs text-slate-600">Transcrição em Português</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  O diálogo fluirá aqui de forma contínua durante a reunião.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const ptText = msg.fromLang === "pt" ? msg.originalText : msg.translatedText;
              const isCliente = msg.speaker === "cliente" || msg.fromLang === "pt";
              const isFirstOrChanged = idx === 0 || messages[idx - 1].speaker !== msg.speaker;

              return (
                <div
                  key={`pt-${msg.id}`}
                  className={`pl-2.5 border-l-2 ${
                    isCliente ? "border-emerald-500" : "border-cyan-400"
                  } ${isFirstOrChanged ? "pt-1.5" : "pt-0.5"}`}
                >
                  {isFirstOrChanged && (
                    <div className="flex items-center gap-1.5 mb-0.5 select-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCliente ? "bg-emerald-500" : "bg-cyan-500"}`} />
                      <span className={`text-[10px] font-bold ${isCliente ? "text-emerald-800" : "text-cyan-800"}`}>
                        {isCliente ? participanteCliente : participanteMario}
                      </span>
                    </div>
                  )}
                  {/* Diferenciación de Tono: Mario en negro/slate-900 y Cliente en gris grafito elegante */}
                  <p className={`text-xs sm:text-[13px] leading-relaxed select-text ${
                    isCliente
                      ? "text-slate-700 font-normal"
                      : "text-slate-900 font-bold"
                  }`}>
                    {ptText}
                  </p>
                </div>
              );
            })}

            <div ref={bottomRefPt} />
          </div>

          {/* Botón Descargar Notas PDF Cliente */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 select-none shrink-0">
            <button
              onClick={onDownloadPtPdf}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Baixar Notas da Reunião (PT .pdf)</span>
            </button>
          </div>
        </div>

        {/* COLUMNA 2: ESPAÑOL */}
        <div className="flex flex-col justify-between bg-slate-50/20 h-full overflow-hidden select-text">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 font-sans text-xs sm:text-sm leading-relaxed select-text">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 px-3 select-none">
                <p className="font-semibold text-xs text-slate-600">Transcripción en Español</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  El diálogo traducido aparecerá aquí en tiempo real.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const esText = msg.fromLang === "es" ? msg.originalText : msg.translatedText;
              const isCliente = msg.speaker === "cliente" || msg.fromLang === "pt";
              const isFirstOrChanged = idx === 0 || messages[idx - 1].speaker !== msg.speaker;

              return (
                <div
                  key={`es-${msg.id}`}
                  className={`pl-2.5 border-l-2 ${
                    isCliente ? "border-emerald-500" : "border-cyan-400"
                  } ${isFirstOrChanged ? "pt-1.5" : "pt-0.5"}`}
                >
                  {isFirstOrChanged && (
                    <div className="flex items-center gap-1.5 mb-0.5 select-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCliente ? "bg-emerald-500" : "bg-cyan-500"}`} />
                      <span className={`text-[10px] font-bold ${isCliente ? "text-emerald-800" : "text-cyan-800"}`}>
                        {isCliente ? participanteCliente : participanteMario}
                      </span>
                    </div>
                  )}
                  {/* Diferenciación de Tono: Mario en negro negrilla y Cliente en grafito */}
                  <p className={`text-xs sm:text-[13px] leading-relaxed select-text ${
                    isCliente
                      ? "text-slate-700 font-normal"
                      : "text-slate-900 font-bold"
                  }`}>
                    {esText}
                  </p>
                </div>
              );
            })}

            <div ref={bottomRefEs} />
          </div>

          {/* Botón Descargar Notas ES Mario */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 select-none shrink-0">
            <button
              onClick={onDownloadBoth}
              className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">Descargar Notas (ES .md + .pdf)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de Transcripción Activa en Vivo */}
      {(interimText || isTranslating) && (
        <div className="bg-slate-900 text-white px-3.5 py-2 border-t border-cyan-500/40 flex items-center justify-between gap-2 shrink-0 z-20 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            )}
            <p className="text-xs text-cyan-200 font-medium truncate">
              "{interimText || "..."}"
            </p>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">Escuchando reunión...</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { use3BFStore, IdiomaManual } from "@/lib/store";
import { Mic, Play, Loader2, Volume2, Globe, Sparkles, CheckCircle2 } from "lucide-react";

const VOCES_POR_IDIOMA: Record<IdiomaManual, Array<{ id: string; nombre: string; region: string }>> = {
  es: [
    { id: "es-MX-DaliaNeural", nombre: "Dalia (Femenina, Suave)", region: "México" },
    { id: "es-MX-JorgeNeural", nombre: "Jorge (Masculina, Corporativa)", region: "México" },
    { id: "es-ES-AlvaroNeural", nombre: "Álvaro (Masculina, Neutra)", region: "España" },
    { id: "es-CO-GonzaloNeural", nombre: "Gonzalo (Masculina, Cálida)", region: "Colombia" },
  ],
  pt: [
    { id: "pt-BR-FranciscaNeural", nombre: "Francisca (Feminina, Natural)", region: "Brasil" },
    { id: "pt-BR-AntonioNeural", nombre: "Antônio (Masculino, Direto)", region: "Brasil" },
    { id: "pt-BR-ThalitaNeural", nombre: "Thalita (Feminina, Amigável)", region: "Brasil" },
  ],
  en: [
    { id: "en-US-JennyNeural", nombre: "Jenny (Female, Clear & Crisp)", region: "US" },
    { id: "en-US-GuyNeural", nombre: "Guy (Male, Professional)", region: "US" },
    { id: "en-GB-SoniaNeural", nombre: "Sonia (Female, Smooth)", region: "UK" },
  ],
};

export default function VoiceStudioPanel() {
  const {
    pasosManual,
    pasoActivoManualId,
    actualizarPasoManual,
    idiomaVozManual,
    setIdiomaVozManual,
    coloresApariencia,
  } = use3BFStore();

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const [generando, setGenerando] = useState(false);
  const [errorTts, setErrorTts] = useState<string | null>(null);
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  const textoActual =
    idiomaVozManual === "pt"
      ? pasoActivo.guionPt
      : idiomaVozManual === "en"
      ? pasoActivo.guionEn
      : pasoActivo.guionEs;

  const vozActual =
    idiomaVozManual === "pt"
      ? pasoActivo.vozPt
      : idiomaVozManual === "en"
      ? pasoActivo.vozEn
      : pasoActivo.vozEs;

  const audioUrlActual =
    idiomaVozManual === "pt"
      ? pasoActivo.audioUrlPt
      : idiomaVozManual === "en"
      ? pasoActivo.audioUrlEn
      : pasoActivo.audioUrlEs;

  const setTexto = (val: string) => {
    if (idiomaVozManual === "pt") {
      actualizarPasoManual(pasoActivo.id, { guionPt: val });
    } else if (idiomaVozManual === "en") {
      actualizarPasoManual(pasoActivo.id, { guionEn: val });
    } else {
      actualizarPasoManual(pasoActivo.id, { guionEs: val });
    }
  };

  const setVoz = (val: string) => {
    if (idiomaVozManual === "pt") {
      actualizarPasoManual(pasoActivo.id, { vozPt: val });
    } else if (idiomaVozManual === "en") {
      actualizarPasoManual(pasoActivo.id, { vozEn: val });
    } else {
      actualizarPasoManual(pasoActivo.id, { vozEs: val });
    }
  };

  const generarLocucion = async () => {
    if (!textoActual.trim()) return;

    try {
      setGenerando(true);
      setErrorTts(null);

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textoActual.trim(),
          voice: vozActual,
          formato: "json",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al sintetizar voz");
      }

      const data = await res.json();
      const duracionAudio = data.durationSeconds || 10.0;

      // Actualizar el paso con la URL del audio y calibrar la duración total del paso
      const updateData: any = {
        duracionAudioSegundos: duracionAudio,
        duracionTotal: Math.max(duracionAudio, pasoActivo.duracionTotal),
      };

      if (idiomaVozManual === "pt") {
        updateData.audioUrlPt = data.audioBase64;
      } else if (idiomaVozManual === "en") {
        updateData.audioUrlEn = data.audioBase64;
      } else {
        updateData.audioUrlEs = data.audioBase64;
      }

      actualizarPasoManual(pasoActivo.id, updateData);

      // Reproducir audio de confirmación
      const audio = new Audio(data.audioBase64);
      audio.play().catch(() => {});
    } catch (err: any) {
      console.error("[VoiceStudio] Error:", err);
      setErrorTts(err.message || "Error al conectar con el servicio de voz");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 text-xs">
      {/* Selector de Idioma en Cápsulas */}
      <div className="flex items-center justify-between">
        <span className="font-bold tracking-wide uppercase opacity-70 text-[10px] flex items-center gap-1">
          <Globe className="w-3 h-3 text-cyan-600" /> Idioma del Guion de Voz
        </span>

        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
          {(["es", "pt", "en"] as const).map((lang) => {
            const activo = idiomaVozManual === lang;
            const labels = { es: "Español", pt: "Português", en: "English" };
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setIdiomaVozManual(lang)}
                style={activo ? { backgroundColor: botonActivoColor, color: "#ffffff" } : {}}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                  activo ? "shadow-sm" : "opacity-60 hover:opacity-100"
                }`}
              >
                {labels[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Voz Neural */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold opacity-80 text-[11px]">Voz Neural ({idiomaVozManual.toUpperCase()}):</label>
        <select
          value={vozActual}
          onChange={(e) => setVoz(e.target.value)}
          className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
        >
          {VOCES_POR_IDIOMA[idiomaVozManual].map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre} ({v.region})
            </option>
          ))}
        </select>
      </div>

      {/* Editor de Guion de Locución */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="font-semibold opacity-80 text-[11px]">Guion de Narración:</label>
          <span className="text-[10px] opacity-60 font-mono">{textoActual.length} caracteres</span>
        </div>

        <textarea
          rows={4}
          value={textoActual}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Escribe el texto que la voz neural locutará para el ${pasoActivo.id}...`}
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] text-xs font-sans outline-none focus:border-cyan-500 transition resize-none"
        />
      </div>

      {/* Botón de Generación de Voz en Cápsula Pura */}
      <button
        type="button"
        disabled={generando || !textoActual.trim()}
        onClick={generarLocucion}
        style={{ backgroundColor: botonActivoColor }}
        className="w-full py-2 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 transition"
      >
        {generando ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sintetizando Voz Neural...
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" /> Generar Audio & Calibrar Duración ({idiomaVozManual.toUpperCase()})
          </>
        )}
      </button>

      {/* Mensaje de Error si falla */}
      {errorTts && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px]">
          {errorTts}
        </div>
      )}

      {/* Reproductor de Audio si ya fue generado */}
      {audioUrlActual && (
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[11px] truncate">Audio sincronizado ({idiomaVozManual.toUpperCase()})</span>
              <span className="text-[10px] opacity-60 font-mono">
                Duración: {pasoActivo.duracionAudioSegundos || 10}s
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const audio = new Audio(audioUrlActual);
              audio.play().catch(() => {});
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition font-bold text-[10px]"
          >
            <Play className="w-3 h-3" /> Escuchar
          </button>
        </div>
      )}
    </div>
  );
}

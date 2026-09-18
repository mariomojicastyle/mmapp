"use client";

import React, { useState, useRef, useEffect } from "react";
import { use3BFStore, IdiomaManual } from "@/lib/store";
import { Mic, Play, Square, Loader2, Volume2, Globe, Sparkles, CheckCircle2, Download, Gauge, Zap, FastForward } from "lucide-react";
import CalibradorCinematicaSection from "./CalibradorCinematicaSection";

export interface VozTtsOpcion {
  id: string;
  nombre: string;
  bandera: string;
  genero: "Mujer" | "Hombre";
  tono: string;
  region: string;
}

const VOCES_POR_IDIOMA: Record<IdiomaManual, VozTtsOpcion[]> = {
  es: [
    // México
    { id: "es-MX-DaliaNeural", nombre: "Dalia", bandera: "🇲🇽", genero: "Mujer", tono: "Didáctica y Suave", region: "México" },
    { id: "es-MX-JorgeNeural", nombre: "Jorge", bandera: "🇲🇽", genero: "Hombre", tono: "Corporativo y Claro", region: "México" },
    // Colombia
    { id: "es-CO-GonzaloNeural", nombre: "Gonzalo", bandera: "🇨🇴", genero: "Hombre", tono: "Cálido y Explicativo", region: "Colombia" },
    { id: "es-CO-SalomeNeural", nombre: "Salomé", bandera: "🇨🇴", genero: "Mujer", tono: "Amigable y Natural", region: "Colombia" },
    // Argentina
    { id: "es-AR-TomasNeural", nombre: "Tomás", bandera: "🇦🇷", genero: "Hombre", tono: "Moderno y Fluido", region: "Argentina" },
    { id: "es-AR-ElenaNeural", nombre: "Elena", bandera: "🇦🇷", genero: "Mujer", tono: "Clara y Expresiva", region: "Argentina" },
    // Chile
    { id: "es-CL-LorenzoNeural", nombre: "Lorenzo", bandera: "🇨🇱", genero: "Hombre", tono: "Sobrio y Preciso", region: "Chile" },
    { id: "es-CL-CatalinaNeural", nombre: "Catalina", bandera: "🇨🇱", genero: "Mujer", tono: "Conversacional", region: "Chile" },
    // Perú
    { id: "es-PE-AlexNeural", nombre: "Alex", bandera: "🇵🇪", genero: "Hombre", tono: "Directo e Informativo", region: "Perú" },
    { id: "es-PE-CamilaNeural", nombre: "Camila", bandera: "🇵🇪", genero: "Mujer", tono: "Serena y Didáctica", region: "Perú" },
    // Venezuela
    { id: "es-VE-SebastianNeural", nombre: "Sebastián", bandera: "🇻🇪", genero: "Hombre", tono: "Enérgico y Firme", region: "Venezuela" },
    { id: "es-VE-PaolaNeural", nombre: "Paola", bandera: "🇻🇪", genero: "Mujer", tono: "Suave y Pausada", region: "Venezuela" },
    // EE.UU. Hispano
    { id: "es-US-AlonsoNeural", nombre: "Alonso", bandera: "🇺🇸", genero: "Hombre", tono: "Neutro Panamericano", region: "EE.UU." },
    { id: "es-US-PalomaNeural", nombre: "Paloma", bandera: "🇺🇸", genero: "Mujer", tono: "Neutra y Confiable", region: "EE.UU." },
    // España (Europa)
    { id: "es-ES-AlvaroNeural", nombre: "Álvaro", bandera: "🇪🇸", genero: "Hombre", tono: "Castizo y Maduro", region: "España" },
    { id: "es-ES-ElviraNeural", nombre: "Elvira", bandera: "🇪🇸", genero: "Mujer", tono: "Institucional y Elegante", region: "España" },
    { id: "es-ES-XimenaNeural", nombre: "Ximena", bandera: "🇪🇸", genero: "Mujer", tono: "Juvenil y Dinámica", region: "España" },
  ],
  pt: [
    // Brasil
    { id: "pt-BR-AntonioNeural", nombre: "Antônio", bandera: "🇧🇷", genero: "Hombre", tono: "Técnico e Seguro", region: "Brasil" },
    { id: "pt-BR-FranciscaNeural", nombre: "Francisca", bandera: "🇧🇷", genero: "Mujer", tono: "Natural e Fluida", region: "Brasil" },
    { id: "pt-BR-ThalitaNeural", nombre: "Thalita", bandera: "🇧🇷", genero: "Mujer", tono: "Amigável e Didática", region: "Brasil" },
    { id: "pt-BR-ThalitaMultilingualNeural", nombre: "Thalita Multilíngue", bandera: "🇧🇷", genero: "Mujer", tono: "Alta Fidelidade Neural", region: "Brasil" },
    // Portugal
    { id: "pt-PT-DuarteNeural", nombre: "Duarte", bandera: "🇵🇹", genero: "Hombre", tono: "Corporativo e Preciso", region: "Portugal" },
    { id: "pt-PT-RaquelNeural", nombre: "Raquel", bandera: "🇵🇹", genero: "Mujer", tono: "Clara e Institucional", region: "Portugal" },
  ],
  en: [
    // Estados Unidos
    { id: "en-US-JennyNeural", nombre: "Jenny", bandera: "🇺🇸", genero: "Mujer", tono: "Clear & Crisp Assistant", region: "US" },
    { id: "en-US-GuyNeural", nombre: "Guy", bandera: "🇺🇸", genero: "Hombre", tono: "Warm & Professional", region: "US" },
    { id: "en-US-AriaNeural", nombre: "Aria", bandera: "🇺🇸", genero: "Mujer", tono: "Expressive & Natural", region: "US" },
    { id: "en-US-ChristopherNeural", nombre: "Christopher", bandera: "🇺🇸", genero: "Hombre", tono: "Authoritative & Confident", region: "US" },
    { id: "en-US-AndrewNeural", nombre: "Andrew", bandera: "🇺🇸", genero: "Hombre", tono: "Modern & Technical", region: "US" },
    { id: "en-US-AvaNeural", nombre: "Ava", bandera: "🇺🇸", genero: "Mujer", tono: "Friendly & Engaging", region: "US" },
    { id: "en-US-BrianNeural", nombre: "Brian", bandera: "🇺🇸", genero: "Hombre", tono: "Calm & Deep Resonance", region: "US" },
    { id: "en-US-EmmaNeural", nombre: "Emma", bandera: "🇺🇸", genero: "Mujer", tono: "Smooth & Cheerful", region: "US" },
    // Reino Unido
    { id: "en-GB-RyanNeural", nombre: "Ryan", bandera: "🇬🇧", genero: "Hombre", tono: "British Professional", region: "UK" },
    { id: "en-GB-SoniaNeural", nombre: "Sonia", bandera: "🇬🇧", genero: "Mujer", tono: "British Smooth Narrative", region: "UK" },
    { id: "en-GB-ThomasNeural", nombre: "Thomas", bandera: "🇬🇧", genero: "Hombre", tono: "British Warm & Formal", region: "UK" },
    { id: "en-GB-LibbyNeural", nombre: "Libby", bandera: "🇬🇧", genero: "Mujer", tono: "British Contemporary", region: "UK" },
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
  const [reproduciendoAudio, setReproduciendoAudio] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  // Control centralizado de reproducción y detención de audio
  const detenerAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setReproduciendoAudio(false);
  };

  const reproducirAudio = (url: string) => {
    detenerAudio();
    if (!url) return;
    try {
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setReproduciendoAudio(true);

      audio.onended = () => {
        setReproduciendoAudio(false);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setReproduciendoAudio(false);
        currentAudioRef.current = null;
      };

      audio.play().catch((err) => {
        console.warn("[VoiceStudio] Error reproduciendo audio:", err);
        setReproduciendoAudio(false);
        currentAudioRef.current = null;
      });
    } catch (e) {
      console.warn("[VoiceStudio] Error creando Audio:", e);
      setReproduciendoAudio(false);
    }
  };

  const toggleAudio = () => {
    if (reproduciendoAudio) {
      detenerAudio();
    } else if (audioUrlActual) {
      reproducirAudio(audioUrlActual);
    }
  };

  // Detener audio al cambiar de paso activo o idioma
  useEffect(() => {
    detenerAudio();
    return () => {
      detenerAudio();
    };
  }, [pasoActivo.id, idiomaVozManual]);

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

  const calidadActual = pasoActivo.calidadAudioTts || "96k";
  const setCalidad = (val: "48k" | "96k" | "opus") => {
    actualizarPasoManual(pasoActivo.id, { calidadAudioTts: val });
  };

  const velocidadActual = typeof pasoActivo.velocidadAudioTts === "number" ? pasoActivo.velocidadAudioTts : 0.9;
  const setVelocidad = (val: number) => {
    actualizarPasoManual(pasoActivo.id, { velocidadAudioTts: val });
  };

  const generarLocucion = async () => {
    if (!textoActual.trim()) return;

    try {
      detenerAudio();
      setGenerando(true);
      setErrorTts(null);

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textoActual.trim(),
          voice: vozActual,
          calidad: calidadActual,
          velocidad: velocidadActual,
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
        calidadAudioTts: calidadActual,
        velocidadAudioTts: velocidadActual,
      };

      if (idiomaVozManual === "pt") {
        updateData.audioUrlPt = data.audioBase64;
      } else if (idiomaVozManual === "en") {
        updateData.audioUrlEn = data.audioBase64;
      } else {
        updateData.audioUrlEs = data.audioBase64;
      }

      actualizarPasoManual(pasoActivo.id, updateData);

      // Reproducir audio de confirmación con posibilidad de detenerlo en cualquier momento
      reproducirAudio(data.audioBase64);
    } catch (err: any) {
      console.error("[VoiceStudio] Error:", err);
      setErrorTts(err.message || "Error al conectar con el servicio de voz");
    } finally {
      setGenerando(false);
    }
  };

  const [traduciendo, setTraduciendo] = useState(false);
  const [descargando, setDescargando] = useState(false);

  // Traducir automáticamente el guion desde el español preservando pausas [pausa: N]
  const traducirGuion = async (targetLang: "pt" | "en") => {
    const textoOrigen = pasoActivo.guionEs?.trim();
    if (!textoOrigen) {
      setErrorTts("Primero redacta el guion en Español para poder traducirlo.");
      return;
    }

    try {
      setTraduciendo(true);
      setErrorTts(null);

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textoOrigen, targetLang }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error en la traducción automática");
      }

      const data = await res.json();
      if (data.translation) {
        if (targetLang === "pt") {
          actualizarPasoManual(pasoActivo.id, { guionPt: data.translation });
        } else {
          actualizarPasoManual(pasoActivo.id, { guionEn: data.translation });
        }
      }
    } catch (err: any) {
      console.error("[VoiceStudio] Error al traducir:", err);
      setErrorTts(err.message || "Error al conectar con el servicio de traducción");
    } finally {
      setTraduciendo(false);
    }
  };

  // Descargar el archivo .mp3 del idioma actual
  const descargarAudio = async () => {
    let url = audioUrlActual;
    if (!url) {
      // Si aún no está generado, generarlo primero
      await generarLocucion();
      const updatedPaso = use3BFStore.getState().pasosManual.find((p) => p.id === pasoActivo.id);
      url =
        idiomaVozManual === "pt"
          ? updatedPaso?.audioUrlPt
          : idiomaVozManual === "en"
          ? updatedPaso?.audioUrlEn
          : updatedPaso?.audioUrlEs;
    }

    if (!url) return;

    try {
      setDescargando(true);
      // Detectar la extensión correcta del archivo a partir de la data URL o de la calidad
      const isWebm = url.startsWith("data:audio/webm") || calidadActual === "opus";
      const ext = isWebm ? "webm" : "mp3";

      const a = document.createElement("a");
      a.href = url;
      a.download = `${pasoActivo.id}_locucion_${idiomaVozManual.toUpperCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("[VoiceStudio] Error al descargar audio:", e);
    } finally {
      setDescargando(false);
    }
  };

  const codigoPaso = pasoActivo.id.toUpperCase().startsWith("P")
    ? pasoActivo.id.toUpperCase()
    : `P${String(pasoActivo.numero ?? 0).padStart(2, "0")}`;

  const tituloNarracion = `Narración de Armado ${codigoPaso}`;

  return (
    <div className="flex flex-col gap-3.5 text-xs pb-12">
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

      {/* Selector de Voz Neural Enriquecido */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="font-semibold opacity-80 text-[11px]">
            Narrador / Voz Neural ({idiomaVozManual.toUpperCase()}):
          </label>
          <span className="text-[10px] opacity-60 font-medium">
            {VOCES_POR_IDIOMA[idiomaVozManual]?.length || 0} disponibles
          </span>
        </div>
        <select
          value={vozActual}
          onChange={(e) => setVoz(e.target.value)}
          className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none cursor-pointer focus:border-cyan-500 shadow-2xs"
        >
          {VOCES_POR_IDIOMA[idiomaVozManual].map((v) => (
            <option key={v.id} value={v.id}>
              {v.bandera} {v.nombre} ({v.region}, {v.genero}) — {v.tono}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Calidad / Compresión de Audio TTS */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="font-semibold opacity-80 text-[11px] flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-600" /> Calidad / Compresión de Audio:
          </label>
          <span className="text-[10px] opacity-60 font-mono font-medium">
            {calidadActual === "96k" ? "96 kbps (Máx. Fidelidad)" : calidadActual === "48k" ? "48 kbps (-50% Peso)" : "Opus (Ultra-ligero)"}
          </span>
        </div>
        <select
          value={calidadActual}
          onChange={(e) => setCalidad(e.target.value as any)}
          className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none cursor-pointer focus:border-cyan-500 shadow-2xs"
        >
          <option value="96k">💎 96 kbps — Alta Fidelidad (Cálido, Acústica Plena, 0 Lata)</option>
          <option value="48k">⚡ 48 kbps — Balanceado / Comprimido (-50% tamaño, Carga Rápida)</option>
          <option value="opus">📦 Opus WebM — Ultra-Comprimido (-70% tamaño, Ideal Móvil)</option>
        </select>
      </div>

      {/* Selector de Velocidad / Cadencia de Voz (0.8x a 1.1x) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="font-semibold opacity-80 text-[11px] flex items-center gap-1">
            <FastForward className="w-3 h-3 text-cyan-600" /> Velocidad de Locución:
          </label>
          <span className="text-[10px] opacity-70 font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {velocidadActual === 0.9 ? "0.90x (Velocidad Normal)" : velocidadActual === 0.85 ? "0.85x (Un poco más lenta)" : velocidadActual === 0.8 ? "0.80x (Más lenta)" : velocidadActual === 1.0 ? "1.00x (Un poco rápido)" : "1.10x (Más rápido)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={velocidadActual}
            onChange={(e) => setVelocidad(parseFloat(e.target.value))}
            className="flex-1 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none cursor-pointer focus:border-cyan-500 shadow-2xs"
          >
            <option value="0.8">0.80x — Más lenta</option>
            <option value="0.85">0.85x — Un poco más lenta</option>
            <option value="0.9">0.90x — Velocidad normal (Por defecto)</option>
            <option value="1.0">1.00x — Un poco rápido</option>
            <option value="1.1">1.10x — Más rápido</option>
          </select>
          {velocidadActual !== 0.9 && (
            <button
              type="button"
              onClick={() => setVelocidad(0.9)}
              title="Restablecer a Velocidad Normal (0.90x)"
              className="px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
            >
              0.9x Normal
            </button>
          )}
        </div>
      </div>

      {/* Editor de Guion de Locución Crecido al 300% con Traductor Automático */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
            {tituloNarracion}
          </label>

          <div className="flex items-center gap-2">
            {/* Botón de Traducir Automáticamente para Portugués e Inglés */}
            {idiomaVozManual !== "es" ? (
              <button
                type="button"
                disabled={traduciendo || !pasoActivo.guionEs?.trim()}
                onClick={() => traducirGuion(idiomaVozManual as "pt" | "en")}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer disabled:opacity-40 transition"
              >
                {traduciendo ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Traduciendo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 text-cyan-500" />
                    <span>Traducir automáticamente</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[10px] opacity-60">Pausas:</span>
                <button
                  type="button"
                  onClick={() => {
                    const tag = " [pausa: 1] ";
                    setTexto((textoActual.trim() ? textoActual.trim() + tag : tag).trimStart());
                  }}
                  title="Insertar 1 segundo de silencio"
                  className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold transition cursor-pointer"
                >
                  +1s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tag = " [pausa: 2] ";
                    setTexto((textoActual.trim() ? textoActual.trim() + tag : tag).trimStart());
                  }}
                  title="Insertar 2 segundos de silencio"
                  className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold transition cursor-pointer"
                >
                  +2s
                </button>
              </div>
            )}
            <span className="text-[10px] opacity-60 font-mono">{textoActual.length}c</span>
          </div>
        </div>

        {/* Textarea Crecido 300% (min-h-[250px], rows={12}) */}
        <textarea
          rows={12}
          value={textoActual}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.select();
          }}
          onClick={(e) => {
            e.currentTarget.select();
          }}
          placeholder={`Escribe el texto que la voz neural locutará para el ${pasoActivo.id} en ${idiomaVozManual.toUpperCase()}... Usa [pausa: 1] para silencios.`}
          className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-sans outline-none focus:border-cyan-500 transition resize-y min-h-[250px] leading-relaxed shadow-inner"
        />

        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          💡 Las etiquetas de pausa como <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full text-cyan-600 dark:text-cyan-400">[pausa: 1]</code> o <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full text-cyan-600 dark:text-cyan-400">[pausa: 2]</code> no se traducen y se conservan automáticamente en la misma posición de la oración.
        </p>

        {/* Fila de Botones de Acción tal cual la plataforma (sin botón subir) */}
        <div className="flex items-center gap-2 mt-1">
          {/* 1. Botón Escuchar / Detener */}
          <button
            type="button"
            disabled={generando || (!reproduciendoAudio && !textoActual.trim())}
            onClick={reproduciendoAudio ? detenerAudio : generarLocucion}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition cursor-pointer shadow-xs active:scale-95 ${
              reproduciendoAudio
                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 hover:text-cyan-600"
            }`}
          >
            {generando ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600" />
                <span>Generando...</span>
              </>
            ) : reproduciendoAudio ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current text-rose-600 dark:text-rose-400 animate-pulse" />
                <span>Detener {idiomaVozManual.toUpperCase()}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span>Escuchar {idiomaVozManual.toUpperCase()}</span>
              </>
            )}
          </button>

          {/* 2. Botón Descargar MP3 */}
          <button
            type="button"
            disabled={!audioUrlActual || descargando}
            onClick={descargarAudio}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-950/40 px-3.5 py-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
          >
            {descargando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Mensaje de Error si falla */}
      {errorTts && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px]">
          {errorTts}
        </div>
      )}

      {/* Tarjeta Informativa de Audio Sincronizado */}
      {audioUrlActual && (
        <div className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 truncate">
                Audio sincronizado ({idiomaVozManual.toUpperCase()})
              </span>
              <span className="text-[10px] opacity-60 font-mono flex items-center gap-1.5">
                <span>Duración: {pasoActivo.duracionAudioSegundos || 10}s</span>
                <span>•</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {calidadActual === "96k" ? "96 kbps (HQ)" : calidadActual === "48k" ? "48 kbps (Ligero)" : "Opus (WebM)"}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {velocidadActual.toFixed(2).replace(/\.?0+$/, "")}x
                </span>
              </span>
            </div>
          </div>

          {reproduciendoAudio && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-[10px] font-bold border border-rose-300 dark:border-rose-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></span>
              En reproducción
            </span>
          )}
        </div>
      )}

      {/* 🎬 Calibración Cinemática de Ensamble (Offset XY & Velocidades Globales) */}
      <CalibradorCinematicaSection pasoActivo={pasoActivo} />
    </div>
  );
}

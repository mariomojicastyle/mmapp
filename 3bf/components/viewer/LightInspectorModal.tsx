"use client";

import React from "react";
import { use3BFStore, PRESETS_ILUMINACION } from "@/lib/store";
import { 
  Sun, 
  Lamp, 
  Sparkles, 
  X, 
  Power, 
  Compass, 
  SunMedium, 
  Sliders, 
  Check, 
  Palette,
  Layers,
  Target,
  Move,
  EyeOff,
  CircleDot,
  Cone
} from "lucide-react";

export default function LightInspectorModal() {
  const { 
    calibracion, 
    setLuzPropiedad, 
    setLuzTarget,
    enfocarLuzACentro,
    seleccionarLuzEstudio, 
    aplicarPresetIluminacion,
    coloresApariencia,
    tema 
  } = use3BFStore();

  const { luzSeleccionadaId, lucesEstudio, presetIluminacion } = calibracion;

  if (!luzSeleccionadaId || !lucesEstudio || !lucesEstudio[luzSeleccionadaId]) {
    return null;
  }

  const luz = lucesEstudio[luzSeleccionadaId];
  const targetPos = luz.target || [0, 0.45, 0];

  // 🎨 Tokens semánticos de coherencia visual Light ("Tech Ethos") y Dark ("Obsidian Teal")
  const isDark = tema === "obsidian";
  const fondoModal = coloresApariencia?.fondoPaneles || (isDark ? "#131B2E" : "#FFFFFF");
  const bordeModal = coloresApariencia?.bordePaneles || (isDark ? "#1E293B" : "#CBD5E1");
  const textoPrincipal = coloresApariencia?.textoPrincipal || (isDark ? "#F8FAFC" : "#0F172A");
  const textoSecundario = coloresApariencia?.textoSecundario || (isDark ? "#94A3B8" : "#64748B");
  const fondoControl = isDark ? "#1A2338" : "#F1F5F9";
  const bordeControl = isDark ? "#2A364F" : "#CBD5E1";
  const fondoCardEspecial = isDark ? "#0D1322" : "#F8FAFC";
  const activoFondo = coloresApariencia?.botonActivo || "#0891B2";
  const activoBorde = "#06B6D4";

  // Presets rápidos de temperatura Kelvin
  const kelvinPresets = [
    { k: 2700, label: "2700K Cálido" },
    { k: 4000, label: "4000K Neutro" },
    { k: 5500, label: "5500K Sol Día" },
    { k: 6500, label: "6500K Frío" },
  ];

  return (
    <div 
      className="absolute top-14 right-4 z-40 w-88 backdrop-blur-md rounded-2xl border shadow-2xl p-4 text-xs select-none transition-all duration-200 animate-in fade-in slide-in-from-right-3"
      style={{
        backgroundColor: fondoModal,
        borderColor: bordeModal,
        color: textoPrincipal,
      }}
    >
      {/* 🎯 CABECERA DEL INSPECTOR */}
      <div 
        className="flex items-center justify-between pb-3 border-b"
        style={{ borderColor: bordeModal }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs"
            style={{ 
              backgroundColor: isDark ? `${luz.color}33` : `${luz.color}20`, 
              border: `1.5px solid ${luz.color}` 
            }}
          >
            {luz.id === "key_sun" ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : luz.tipo === "point" ? (
              <Lamp className="w-4 h-4 text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-500" />
            )}
          </div>
          <div>
            <h3 
              className="font-bold text-[13px] leading-tight"
              style={{ color: textoPrincipal }}
            >
              {luz.nombre}
            </h3>
            <span 
              className="text-[10px] font-mono"
              style={{ color: textoSecundario }}
            >
              {luz.tipo === "directional" ? "Luz Direccional con Cono" : luz.tipo === "point" ? "Luz Esférica (Bombillo 360°)" : "Luz Difusa"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botón Encendido/Apagado */}
          <button
            onClick={() => setLuzPropiedad(luz.id, "activa", !luz.activa)}
            title={luz.activa ? "Apagar luz" : "Encender luz"}
            className="p-1.5 rounded-lg border transition-all cursor-pointer"
            style={{
              backgroundColor: luz.activa 
                ? (isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)") 
                : fondoControl,
              borderColor: luz.activa ? "#10B981" : bordeControl,
              color: luz.activa ? "#10B981" : textoSecundario,
            }}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* Botón Cerrar */}
          <button
            onClick={() => seleccionarLuzEstudio(null)}
            className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: fondoControl,
              borderColor: bordeControl,
              color: textoSecundario,
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 🎯 CUERPO DE CONTROLES */}
      <div className="mt-3 space-y-3.5 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Selector de Tipo: Direccional vs Esférica 360° */}
        <div className="space-y-1.5">
          <span 
            className="text-[10px] font-bold uppercase tracking-wider block"
            style={{ color: textoSecundario }}
          >
            Tipo de Iluminación
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setLuzPropiedad(luz.id, "tipo", "directional")}
              className="p-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: luz.tipo === "directional" ? activoFondo : fondoControl,
                borderColor: luz.tipo === "directional" ? activoBorde : bordeControl,
                color: luz.tipo === "directional" ? "#FFFFFF" : textoPrincipal,
                fontWeight: luz.tipo === "directional" ? "700" : "500",
              }}
            >
              <Cone className="w-3.5 h-3.5" />
              <span className="text-[10px]">Direccional (Cono)</span>
            </button>
            <button
              onClick={() => setLuzPropiedad(luz.id, "tipo", "point")}
              className="p-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: luz.tipo === "point" ? activoFondo : fondoControl,
                borderColor: luz.tipo === "point" ? activoBorde : bordeControl,
                color: luz.tipo === "point" ? "#FFFFFF" : textoPrincipal,
                fontWeight: luz.tipo === "point" ? "700" : "500",
              }}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span className="text-[10px]">Esférica (360°)</span>
            </button>
          </div>
        </div>

        {/* Selector de Manipulación 3D (TransformControls) */}
        <div 
          className="space-y-1.5 p-2 rounded-xl border"
          style={{
            backgroundColor: fondoCardEspecial,
            borderColor: bordeModal,
          }}
        >
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: textoPrincipal }}>
              <Move className="w-3.5 h-3.5 text-indigo-400" />
              Flechas de Movimiento 3D
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setLuzPropiedad(luz.id, "modoGizmo", "luz")}
              className="px-1.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer truncate shadow-2xs"
              style={{
                backgroundColor: luz.modoGizmo === "luz" ? activoFondo : fondoControl,
                borderColor: luz.modoGizmo === "luz" ? activoBorde : bordeControl,
                color: luz.modoGizmo === "luz" ? "#FFFFFF" : textoPrincipal,
              }}
              title="Mover posición de la lámpara en 3D"
            >
              📍 Lámpara
            </button>

            {luz.tipo === "directional" && (
              <button
                onClick={() => setLuzPropiedad(luz.id, "modoGizmo", "target")}
                className="px-1.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer truncate shadow-2xs"
                style={{
                  backgroundColor: luz.modoGizmo === "target" ? activoFondo : fondoControl,
                  borderColor: luz.modoGizmo === "target" ? activoBorde : bordeControl,
                  color: luz.modoGizmo === "target" ? "#FFFFFF" : textoPrincipal,
                }}
                title="Mover punto objetivo al que apunta la lámpara"
              >
                🎯 Objetivo
              </button>
            )}

            <button
              onClick={() => setLuzPropiedad(luz.id, "modoGizmo", "ninguno")}
              className="px-1.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer truncate shadow-2xs"
              style={{
                backgroundColor: luz.modoGizmo === "ninguno" 
                  ? (isDark ? "#334155" : "#64748B") 
                  : fondoControl,
                borderColor: luz.modoGizmo === "ninguno" ? "#475569" : bordeControl,
                color: luz.modoGizmo === "ninguno" ? "#FFFFFF" : textoSecundario,
              }}
              title="Ocultar flechas de transformación"
            >
              <EyeOff className="w-3 h-3 inline mr-0.5" /> Ocultar
            </button>
          </div>
        </div>

        {/* Parámetro Específico: Ángulo de Cono (Direccional) o Radio de Alcance (Esférica) */}
        {luz.tipo === "directional" ? (
          <div 
            className="space-y-2 p-2.5 rounded-xl border"
            style={{
              backgroundColor: isDark ? "rgba(8, 145, 178, 0.1)" : "rgba(8, 145, 178, 0.05)",
              borderColor: isDark ? "#164E63" : "#BAE6FD",
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: textoPrincipal }}>
                <Cone className="w-3.5 h-3.5 text-[#0891B2]" />
                Apertura del Cono de Luz
              </span>
              <span 
                className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border"
                style={{ 
                  backgroundColor: fondoControl, 
                  borderColor: bordeControl, 
                  color: activoFondo 
                }}
              >
                {luz.anguloCono || 45}°
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="75"
              step="1"
              value={luz.anguloCono || 45}
              onChange={(e) => setLuzPropiedad(luz.id, "anguloCono", parseInt(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0891B2]"
              style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
            />

            {/* Coordenadas del Target y Botón Centrar */}
            <div 
              className="pt-2 border-t space-y-1.5"
              style={{ borderColor: isDark ? "#1E293B" : "#E0F2FE" }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: textoSecundario }}>
                  <Target className="w-3 h-3 text-[#0891B2]" /> Coordenadas Objetivo (Target)
                </span>
                <button
                  onClick={() => enfocarLuzACentro(luz.id)}
                  className="px-2 py-0.5 rounded border text-[9px] font-bold transition-all cursor-pointer shadow-2xs hover:opacity-90"
                  style={{
                    backgroundColor: fondoControl,
                    borderColor: bordeControl,
                    color: activoFondo,
                  }}
                >
                  Centrar al Mueble
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div 
                  className="flex items-center gap-1 p-1 rounded border"
                  style={{ backgroundColor: fondoControl, borderColor: bordeControl }}
                >
                  <span className="font-bold text-red-500">X:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={Number(targetPos[0].toFixed(2))}
                    onChange={(e) => setLuzTarget(luz.id, [parseFloat(e.target.value) || 0, targetPos[1], targetPos[2]])}
                    className="w-full bg-transparent outline-none font-mono text-[10px]"
                    style={{ color: textoPrincipal }}
                  />
                </div>
                <div 
                  className="flex items-center gap-1 p-1 rounded border"
                  style={{ backgroundColor: fondoControl, borderColor: bordeControl }}
                >
                  <span className="font-bold text-green-500">Y:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={Number(targetPos[1].toFixed(2))}
                    onChange={(e) => setLuzTarget(luz.id, [targetPos[0], parseFloat(e.target.value) || 0, targetPos[2]])}
                    className="w-full bg-transparent outline-none font-mono text-[10px]"
                    style={{ color: textoPrincipal }}
                  />
                </div>
                <div 
                  className="flex items-center gap-1 p-1 rounded border"
                  style={{ backgroundColor: fondoControl, borderColor: bordeControl }}
                >
                  <span className="font-bold text-blue-500">Z:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={Number(targetPos[2].toFixed(2))}
                    onChange={(e) => setLuzTarget(luz.id, [targetPos[0], targetPos[1], parseFloat(e.target.value) || 0])}
                    className="w-full bg-transparent outline-none font-mono text-[10px]"
                    style={{ color: textoPrincipal }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="space-y-1.5 p-2.5 rounded-xl border"
            style={{
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.05)",
              borderColor: isDark ? "#78350F" : "#FDE68A",
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: textoPrincipal }}>
                <CircleDot className="w-3.5 h-3.5 text-amber-500" />
                Radio de Alcance 360°
              </span>
              <span 
                className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border"
                style={{ 
                  backgroundColor: fondoControl, 
                  borderColor: bordeControl, 
                  color: "#D97706" 
                }}
              >
                {(luz.radioAlcance || 4.0).toFixed(1)} m
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.2"
              value={luz.radioAlcance || 4.0}
              onChange={(e) => setLuzPropiedad(luz.id, "radioAlcance", parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500"
              style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
            />
          </div>
        )}

        {/* Control: Intensidad */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold flex items-center gap-1.5" style={{ color: textoPrincipal }}>
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              Intensidad
            </span>
            <span 
              className="font-mono font-bold px-1.5 py-0.5 rounded border text-[11px]"
              style={{ 
                backgroundColor: fondoControl, 
                borderColor: bordeControl, 
                color: textoPrincipal 
              }}
            >
              {luz.intensidad.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={luz.intensidad}
            onChange={(e) => setLuzPropiedad(luz.id, "intensidad", parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0891B2]"
            style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
          />
        </div>

        {/* Control: Temperatura Kelvin y Color */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold flex items-center gap-1.5" style={{ color: textoPrincipal }}>
              <Palette className="w-3.5 h-3.5 text-cyan-500" />
              Temperatura de Color
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[11px]" style={{ color: textoPrincipal }}>
                {luz.temperaturaKelvin} K
              </span>
              <div 
                className="w-3.5 h-3.5 rounded-full border shadow-xs" 
                style={{ backgroundColor: luz.color, borderColor: bordeControl }} 
              />
            </div>
          </div>

          {/* Slider de Kelvin (gradiente cálido a frío) */}
          <div className="relative flex items-center">
            <input
              type="range"
              min="2500"
              max="7500"
              step="50"
              value={luz.temperaturaKelvin}
              onChange={(e) => setLuzPropiedad(luz.id, "temperaturaKelvin", parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: "linear-gradient(to right, #ff9e43, #ffd39f, #ffffff, #d7e4ff, #9bbcfd)",
              }}
            />
          </div>

          {/* Badges Rápidos Kelvin */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {kelvinPresets.map((kp) => {
              const isSelected = luz.temperaturaKelvin === kp.k;
              return (
                <button
                  key={kp.k}
                  onClick={() => setLuzPropiedad(luz.id, "temperaturaKelvin", kp.k)}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold border transition-all text-center cursor-pointer shadow-2xs"
                  style={{
                    backgroundColor: isSelected ? activoFondo : fondoControl,
                    borderColor: isSelected ? activoBorde : bordeControl,
                    color: isSelected ? "#FFFFFF" : textoPrincipal,
                    fontWeight: isSelected ? "700" : "500",
                  }}
                >
                  {kp.label}
                </button>
              );
            })}
          </div>

          {/* Color Hex Libre */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px]" style={{ color: textoSecundario }}>Tinte Hex Personalizado</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={luz.color}
                onChange={(e) => setLuzPropiedad(luz.id, "color", e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span 
                className="font-mono text-[10px] uppercase font-bold px-1 py-0.5 rounded border"
                style={{ backgroundColor: fondoControl, borderColor: bordeControl, color: textoPrincipal }}
              >
                {luz.color}
              </span>
            </div>
          </div>
        </div>

        {/* Orientación Espacial (Azimut & Elevación) */}
        {luz.tipo !== "ambient" && (
          <div 
            className="space-y-2.5 pt-2 border-t"
            style={{ borderColor: bordeModal }}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span style={{ color: textoPrincipal }}>Posición Radial de la Lámpara</span>
            </div>

            {/* Slider de Azimut (0° a 360°) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]" style={{ color: textoSecundario }}>
                <span>Azimut (Ángulo horizontal)</span>
                <span className="font-mono font-bold" style={{ color: textoPrincipal }}>{luz.azimut}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={luz.azimut}
                onChange={(e) => setLuzPropiedad(luz.id, "azimut", parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0891B2]"
                style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
              />
            </div>

            {/* Slider de Elevación (10° a 85°) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]" style={{ color: textoSecundario }}>
                <span>Elevación (Altura)</span>
                <span className="font-mono font-bold" style={{ color: textoPrincipal }}>{luz.elevacion}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="2"
                value={luz.elevacion}
                onChange={(e) => setLuzPropiedad(luz.id, "elevacion", parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0891B2]"
                style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
              />
            </div>

            {/* Slider de Distancia Radial */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]" style={{ color: textoSecundario }}>
                <span>Distancia al Centro</span>
                <span className="font-mono font-bold" style={{ color: textoPrincipal }}>{luz.distancia.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.2"
                value={luz.distancia}
                onChange={(e) => setLuzPropiedad(luz.id, "distancia", parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0891B2]"
                style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
              />
            </div>
          </div>
        )}

        {/* Control: Proyección de Sombras */}
        {luz.tipo === "directional" && (
          <div 
            className="pt-2 border-t flex items-center justify-between"
            style={{ borderColor: bordeModal }}
          >
            <span className="text-[11px] font-semibold" style={{ color: textoPrincipal }}>
              Proyectar Sombras en Escenario
            </span>
            <input
              type="checkbox"
              checked={luz.proyectarSombras}
              onChange={(e) => setLuzPropiedad(luz.id, "proyectarSombras", e.target.checked)}
              className="w-4 h-4 rounded text-[#0891B2] accent-[#0891B2] cursor-pointer"
            />
          </div>
        )}

        {/* PRESETS RÁPIDOS DE ESTUDIO */}
        <div 
          className="pt-3 border-t space-y-1.5"
          style={{ borderColor: bordeModal }}
        >
          <span 
            className="text-[10px] font-bold uppercase tracking-wider block"
            style={{ color: textoSecundario }}
          >
            Presets Rápidos de Iluminación
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(PRESETS_ILUMINACION).map(([key, p]) => {
              const isSelected = presetIluminacion === key;
              return (
                <button
                  key={key}
                  onClick={() => aplicarPresetIluminacion(key)}
                  className="p-1.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs"
                  style={{
                    backgroundColor: isSelected 
                      ? (isDark ? "rgba(8, 145, 178, 0.2)" : "rgba(8, 145, 178, 0.1)") 
                      : fondoControl,
                    borderColor: isSelected ? activoFondo : bordeControl,
                    color: isSelected ? activoFondo : textoPrincipal,
                    fontWeight: isSelected ? "700" : "500",
                  }}
                >
                  <div className="text-[10px] leading-tight truncate">{p.nombre}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

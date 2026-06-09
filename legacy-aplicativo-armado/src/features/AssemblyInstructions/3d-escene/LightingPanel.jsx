import React, { useState, useCallback } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import useEnviroment from "../hooks/useEnviroment.js";
import * as THREE from "three";

// Mapa de tone mappings disponibles en Three.js
const TONE_MAPPINGS = {
  ACESFilmic: THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  Linear: THREE.LinearToneMapping,
  None: THREE.NoToneMapping,
};

// Constantes de rango de cada slider
const SLIDERS = [
  { key: "ambientIntensity", label: "💡 Ambiental", min: 0, max: 1, step: 0.01 },
  { key: "ambientShadow", label: "💡 Ambiental (sombras)", min: 0, max: 1, step: 0.01 },
  { key: "directionalIntensity", label: "☀️ Direccional", min: 0, max: 3, step: 0.05 },
  { key: "spotIntensity", label: "🔦 Spot", min: 0, max: 2, step: 0.05 },
  { key: "spotShadow", label: "🔦 Spot (sombras)", min: 0, max: 2, step: 0.05 },
  { key: "envIntensity", label: "🌍 Entorno (env map)", min: 0, max: 2, step: 0.05 },
  { key: "exposure", label: "📷 Exposición", min: 0.1, max: 3, step: 0.05 },
];

/**
 * Panel flotante de calibración de iluminación.
 * Se muestra sólo cuando showLightingEditor === true en el store.
 * Renderiza dentro del Canvas con <Html> de drei.
 */
export default function LightingPanel() {
  const showEditor = useEnviroment((state) => state.showLightingEditor);
  const lightingConfig = useEnviroment((state) => state.lightingConfig);
  const SetLightingConfig = useEnviroment((state) => state.SetLightingConfig);
  const { gl } = useThree();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Aplicar tone mapping y exposure en caliente (gl se configuró al montar el Canvas)
  const applyToRenderer = useCallback((key, value) => {
    if (key === "toneMapping") {
      gl.toneMapping = TONE_MAPPINGS[value] || THREE.ACESFilmicToneMapping;
    }
    if (key === "exposure") {
      gl.toneMappingExposure = value;
    }
  }, [gl]);

  const handleChange = (key, raw) => {
    const value = key === "toneMapping" ? raw : parseFloat(raw);
    SetLightingConfig({ [key]: value });
    applyToRenderer(key, value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Obtener el ID del manual (almacenado en el store)
      const manualId = useEnviroment.getState().id;
      if (!manualId) {
        console.error("LightingPanel: No se encontró ID del manual para guardar.");
        return;
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Emitir mensaje Broadcast vía Supabase Realtime para que el CMS guarde con privilegios de administrador
      const channel = supabase.channel('manual-features-realtime');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'save-lighting',
            payload: {
              codigoManual: manualId,
              lightingConfig: lightingConfig
            }
          });
          setTimeout(() => {
            channel.unsubscribe();
          }, 500);
        }
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      console.log("✅ Evento de guardado de iluminación transmitido:", lightingConfig);
    } catch (err) {
      console.error("❌ Error guardando iluminación:", err);
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = {
      ambientIntensity: 0.4,
      ambientShadow: 0.25,
      directionalIntensity: 1.6,
      spotIntensity: 0.8,
      spotShadow: 0.5,
      envIntensity: 1.0,
      exposure: 1.0,
      toneMapping: "ACESFilmic",
    };
    SetLightingConfig(defaults);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  };

  if (!showEditor) return null;

  // ── Estilos inline (glassmorphism oscuro, idéntico a CameraOverlay) ──
  const panelStyle = {
    background: "rgba(0,0,0,0.88)",
    border: "1px solid rgba(99,255,200,0.3)",
    borderRadius: "14px",
    padding: collapsed ? "10px 14px" : "14px 16px",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "11px",
    color: "#e0e0e0",
    minWidth: collapsed ? "180px" : "260px",
    maxHeight: collapsed ? "auto" : "80vh",
    overflowY: collapsed ? "hidden" : "auto",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    userSelect: "none",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: "bold",
    fontSize: "12px",
    color: "#63ffc8",
    cursor: "pointer",
    marginBottom: collapsed ? 0 : "10px",
  };

  const sliderRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
    marginBottom: "6px",
  };

  const labelStyle = {
    flex: "1 1 120px",
    fontSize: "10px",
    color: "#aaa",
    whiteSpace: "nowrap",
  };

  const valueStyle = {
    width: "36px",
    textAlign: "right",
    fontSize: "10px",
    color: "#63ffc8",
    fontFamily: "monospace",
  };

  const inputStyle = {
    flex: "1 1 80px",
    accentColor: "#63ffc8",
    cursor: "pointer",
    height: "4px",
  };

  const selectStyle = {
    width: "100%",
    padding: "5px 8px",
    border: "1px solid rgba(99,255,200,0.2)",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.05)",
    color: "#e0e0e0",
    fontSize: "11px",
    cursor: "pointer",
    outline: "none",
    marginBottom: "8px",
  };

  const btnBase = {
    flex: 1,
    padding: "7px 6px",
    border: "1px solid rgba(99,255,200,0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "10px",
    fontWeight: "bold",
    transition: "all 0.2s",
    textAlign: "center",
  };

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: "fixed",
        top: "12px",
        left: "12px",
        pointerEvents: "auto",
        zIndex: 9998,
      }}
      calculatePosition={() => [12, 12, 0]}
    >
      <div 
        style={panelStyle}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header con toggle de colapsar */}
        <div style={headerStyle} onClick={() => setCollapsed(!collapsed)}>
          <span>☀️ Calibración de Iluminación</span>
          <span style={{ fontSize: "14px" }}>{collapsed ? "▸" : "▾"}</span>
        </div>

        {!collapsed && (
          <>
            {/* Sliders por cada fuente de luz */}
            {SLIDERS.map((s) => (
              <div key={s.key} style={sliderRowStyle}>
                <span style={labelStyle}>{s.label}</span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={lightingConfig[s.key]}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                  style={inputStyle}
                />
                <span style={valueStyle}>{Number(lightingConfig[s.key]).toFixed(2)}</span>
              </div>
            ))}

            {/* Selector de Tone Mapping */}
            <div style={{ marginTop: "4px", marginBottom: "2px" }}>
              <span style={{ ...labelStyle, display: "block", marginBottom: "4px" }}>
                🎨 Tone Mapping
              </span>
              <select
                value={lightingConfig.toneMapping}
                onChange={(e) => handleChange("toneMapping", e.target.value)}
                style={selectStyle}
              >
                {Object.keys(TONE_MAPPINGS).map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={handleReset}
                style={{
                  ...btnBase,
                  background: "rgba(255,255,255,0.05)",
                  color: "#aaa",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                🔄 Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...btnBase,
                  background: saved
                    ? "rgba(99,255,200,0.15)"
                    : "rgba(99,255,200,0.08)",
                  color: saved ? "#63ffc8" : "#ccc",
                  border: saved
                    ? "1px solid #63ffc8"
                    : "1px solid rgba(99,255,200,0.3)",
                  opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.background = "rgba(99,255,200,0.18)";
                }}
                onMouseLeave={(e) => {
                  if (!saving)
                    e.currentTarget.style.background = saved
                      ? "rgba(99,255,200,0.15)"
                      : "rgba(99,255,200,0.08)";
                }}
              >
                {saving ? "⏳ Guardando..." : saved ? "✅ ¡Guardado!" : "💾 Guardar en Supabase"}
              </button>
            </div>
          </>
        )}
      </div>
    </Html>
  );
}

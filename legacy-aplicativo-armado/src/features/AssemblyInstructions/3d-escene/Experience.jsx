import { useThree, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, useGLTF, useHelper, Environment } from "@react-three/drei";
import React, { useRef, useEffect, Suspense, useState, useMemo } from "react";
import useEnviroment from "../hooks/useEnviroment.js";
import * as THREE from 'three';
import Model from "./Model.jsx";
import Floor from "./Floor/Floor.jsx";
import LightingPanel from "./LightingPanel.jsx";
import { getAssetPath } from "../../../lib/assets.js";

// Configurar el decodificador de Draco directamente desde el origen verificado de Netlify
if (typeof window !== "undefined") {
  useGLTF.setDecoderPath("/draco/gltf/");
}





function ActualAssemblySceneViewer({ id, modelUrl, productData, decryptedUrl }) {
  const { scene, gl, camera } = useThree();
  const controlsRef = useRef();
  const [cameraTarget, setCameraTarget] = useState([0, 0.8, 0]);
  const lastLoggedPos = useRef(""); // Throttle logging outputs

  const { progress } = useProgress();
  const CheckReadyToPlay = useEnviroment((state) => state.CheckReadyToPlay);
  useEffect(() => {
    CheckReadyToPlay(progress);
  }, [progress, CheckReadyToPlay]);

  const isModelVisible = useEnviroment((state) => state.show);
  const CargarPasoInicial = useEnviroment((state) => state.CargarPasoInicial);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const cameraPositions = useEnviroment((state) => state.cameraPositions);
  const alturas = useEnviroment((state) => state.alturas);
  const sombras = useEnviroment((state) => state.sombras);
  const computedModelMinY = useEnviroment((state) => state.computedModelMinY);
  const lightingConfig = useEnviroment((state) => state.lightingConfig);
  const customColors = useEnviroment((state) => state.customColors);


  const modelCenter = useEnviroment((state) => state.modelCenter);

  // Actualizar el target de la cámara usando coordenadas guardadas en 'alturas' o fallback a centro de gravedad
  useEffect(() => {
    let customTarget = null;
    if (alturas && alturas.length > 0) {
      const altData = alturas.find(a => a.paso === PasoActual);
      if (altData && altData.target && Array.isArray(altData.target)) {
        customTarget = [altData.target[0], altData.target[1], altData.target[2]];
      }
    }
    
    if (!customTarget && modelCenter && Array.isArray(modelCenter)) {
      customTarget = modelCenter;
    }

    if (customTarget) {
      // Solo inicializar target si el usuario no ha tomado el control manual de órbita/paneo libre
      const isManualOrbit = useEnviroment.getState().isManualOrbit;
      if (!isManualOrbit) {
        setCameraTarget(customTarget);
        if (controlsRef.current) {
          controlsRef.current.target.set(customTarget[0], customTarget[1], customTarget[2]);
          controlsRef.current.update();
        }
      }
    }
  }, [PasoActual, alturas, modelCenter]);

  

  // Sincronizar tone mapping y exposición en caliente con el renderer
  useEffect(() => {
    if (gl) {
      const toneMappingMap = {
        ACESFilmic: THREE.ACESFilmicToneMapping,
        AgX: THREE.AgXToneMapping,
        Linear: THREE.LinearToneMapping,
        None: THREE.NoToneMapping,
      };
      gl.toneMapping = toneMappingMap[lightingConfig.toneMapping] || THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = lightingConfig.exposure;
    }
  }, [gl, lightingConfig.toneMapping, lightingConfig.exposure]);

  // Escuchar cambios de localStorage y Supabase Realtime desde la plataforma (otra ventana)
  useEffect(() => {
    // 1. Limpiar cualquier estado fantasma previo de localStorage para evitar que quede pegado
    if (typeof window !== "undefined") {
      localStorage.removeItem('cameraOverlay');
      localStorage.removeItem('lightingEditor');
    }

    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 787;

    // Si es móvil, forzar apagado incondicional
    if (isMobileUA) {
      useEnviroment.getState().SetCameraOverlay(false);
      useEnviroment.getState().SetLightingEditor(false);
      return;
    }

    // 2. Verificar parámetros de búsqueda URL (prioridad al abrir pestaña nueva en PC)
    const params = new URLSearchParams(window.location.search);
    const urlCameraOverlay = params.get('cameraOverlay');
    const urlLightingEditor = params.get('lightingEditor');
    
    if (urlCameraOverlay === 'on') {
      useEnviroment.getState().SetCameraOverlay(true);
    } else if (urlCameraOverlay === 'off') {
      useEnviroment.getState().SetCameraOverlay(false);
    }
    
    if (urlLightingEditor === 'on') {
      useEnviroment.getState().SetLightingEditor(true);
    } else if (urlLightingEditor === 'off') {
      useEnviroment.getState().SetLightingEditor(false);
    }

    // 3. Listener del evento localStorage para cuando compartan origen (solo PC)
    const handleStorage = (e) => {
      if (e.key === 'cameraOverlay') {
        const state = useEnviroment.getState();
        state.SetCameraOverlay(e.newValue === 'on');
      }
      if (e.key === 'lightingEditor') {
        const state = useEnviroment.getState();
        state.SetLightingEditor(e.newValue === 'on');
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Suscripción en tiempo real con Supabase Realtime (Broadcast) para comunicación cruzada entre puertos
    let channel;
    const initRealtime = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        channel = supabase.channel('manual-features-realtime');
        channel
          .on('broadcast', { event: 'toggle-feature' }, ({ payload }) => {
            const currentId = id || useEnviroment.getState().id;
            const matchesManual = !payload?.codigoManual || payload.codigoManual === currentId || payload.codigoManual === "all";
            if (payload && matchesManual) {
              const state = useEnviroment.getState();
              if (payload.key === 'cameraOverlay') {
                const isActive = payload.value === 'on';
                state.SetCameraOverlay(isActive);
                try {
                  const url = new URL(window.location.href);
                  if (isActive) {
                    url.searchParams.set('cameraOverlay', 'on');
                  } else {
                    url.searchParams.delete('cameraOverlay');
                  }
                  window.history.replaceState({}, '', url.toString());
                } catch (e) {}
              }
              if (payload.key === 'lightingEditor') {
                const isActive = payload.value === 'on';
                state.SetLightingEditor(isActive);
                try {
                  const url = new URL(window.location.href);
                  if (isActive) {
                    url.searchParams.set('lightingEditor', 'on');
                  } else {
                    url.searchParams.delete('lightingEditor');
                  }
                  window.history.replaceState({}, '', url.toString());
                } catch (e) {}
              }
            }
          })
          .subscribe();
      } catch (err) {
        console.error("Error al inicializar Supabase Realtime:", err);
      }
    };
    initRealtime();
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.unsubscribe();
    };
  }, [id]);

  const isEstudio = productData?.tipoAmbiente === "estudio";
  const colorAmbienteVal = productData?.colorAmbiente || "#e8e8e8";

  const floorY = useMemo(() => {
    let planeValue = null;
    if (alturas && alturas.length > 0) {
      const altData = alturas.find(a => a.paso === PasoActual);
      if (altData && altData.plane !== undefined) {
        planeValue = altData.plane;
      }
    }
    if (planeValue === null && computedModelMinY !== null) {
      planeValue = computedModelMinY;
    }
    return planeValue !== null ? planeValue - 0.001 : -0.001;
  }, [alturas, PasoActual, computedModelMinY]);

  return (
    <>
      <color attach="background" args={[customColors.background || colorAmbienteVal]} />
      {/* Niebla suave que desvanece las líneas en la lejanía */}
      <fog attach="fog" args={[customColors.background || colorAmbienteVal, 6, 20]} />
      <gridHelper 
        args={[
          24, 
          24, 
          customColors.gridCenter || '#b5b5c3', 
          customColors.gridLines || '#d1d1db'
        ]} 
        position={[0, floorY + 0.003, 0]} 
      />


      <Environment preset="city" blur={0.8} environmentIntensity={lightingConfig.envIntensity} />
      <ambientLight intensity={sombras ? lightingConfig.ambientShadow : lightingConfig.ambientIntensity} />
      <directionalLight 
        position={[6, 10, 4]} 
        intensity={lightingConfig.directionalIntensity} 
        castShadow={sombras} 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.006}
        shadow-camera-far={25}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.1}
      />
      <spotLight position={[-5, 5, -5]} intensity={sombras ? lightingConfig.spotShadow : lightingConfig.spotIntensity} />

      <OrbitControls
        makeDefault
        ref={controlsRef}
        enablePan={true}
        screenSpacePanning={true}
        panSpeed={1.0}
        zoomSpeed={0.8}
        autoRotateSpeed={0.85}
        maxDistance={12}
        minDistance={0.15}
        minPolarAngle={0.01}
        maxPolarAngle={Math.PI / 2 + 0.12}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      <Suspense fallback={null}>
        <Floor productData={productData} />
      </Suspense>

      <Suspense fallback={null}>
        {isModelVisible && <Model key={`${id}_${PasoActual}`} id={id} modelUrl={modelUrl} orbitControlsRef={controlsRef} productData={productData} />}
      </Suspense>

      <ViewportCameraManager orbitControlsRef={controlsRef} />
      <LightingPanel />
    </>
  );
}

function ViewportCameraManager({ orbitControlsRef }) {
  const showOverlay = useEnviroment((state) => state.showCameraOverlay);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const manualId = useEnviroment((state) => state.id);
  const { camera } = useThree();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 787;
  
  if (isMobile || !showOverlay) return null;
  
  const handleSetCameraPosition = async () => {
    setSaving(true);
    try {
      if (!manualId) {
        console.error("CameraOverlay: No se encontró ID del manual para guardar.");
        return;
      }

      // Obtener coordenadas de la cámara y controles directamente en caliente
      const currentPos = [
        parseFloat(camera.position.x.toFixed(4)),
        parseFloat(camera.position.y.toFixed(4)),
        parseFloat(camera.position.z.toFixed(4))
      ];
      
      const targetVec = orbitControlsRef?.current?.target || new THREE.Vector3(0, 0.8, 0);
      const currentTarget = [
        parseFloat(targetVec.x.toFixed(4)),
        parseFloat(targetVec.y.toFixed(4)),
        parseFloat(targetVec.z.toFixed(4))
      ];

      // 1. Actualizar el store de Zustand del visor localmente de inmediato (para evitar retrasos/saltos)
      const currentCameraPositions = useEnviroment.getState().cameraPositions || [];
      const updatedPositions = currentCameraPositions.map(p => {
        if (p.pasos === pasoActual) {
          return { ...p, override: true, position: { x: currentPos[0], y: currentPos[1], z: currentPos[2] } };
        }
        return p;
      });
      if (!currentCameraPositions.some(p => p.pasos === pasoActual)) {
        updatedPositions.push({
          pasos: pasoActual,
          override: true,
          position: { x: currentPos[0], y: currentPos[1], z: currentPos[2] }
        });
      }

      const currentAlturas = useEnviroment.getState().alturas || [];
      const updatedAlturas = currentAlturas.map(a => {
        if (a.paso === pasoActual) {
          return { ...a, target: currentTarget };
        }
        return a;
      });
      if (!currentAlturas.some(a => a.paso === pasoActual)) {
        updatedAlturas.push({ paso: pasoActual, target: currentTarget });
      }

      useEnviroment.getState().ChargerCameraPositions(updatedPositions);
      useEnviroment.getState().ChargerAlturas(updatedAlturas);

      // 2. Guardar DIRECTAMENTE en la base de datos vía API de la plataforma (Resiliente, sin depender del CMS)
      const savePayload = {
        codigoManual: manualId,
        step: pasoActual,
        cameraPosition: currentPos,
        cameraTarget: currentTarget,
        cameraMode: 'manual',
        useGlbCamera: false
      };

      try {
        const isLocalPlatform = window.location.origin.includes('localhost:3003');
        const apiTarget = isLocalPlatform
          ? 'http://localhost:3003/api/proyectos/guardar-camara'
          : (window.location.origin.includes('mario-mojica-armado.netlify.app')
              ? '/.netlify/functions/guardar-camara'
              : 'https://mariomojica.com/api/proyectos/guardar-camara');

        const res = await fetch(apiTarget, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload)
        });
        if (res.ok) {
          console.log("✅ Coordenadas de cámara guardadas directamente en Supabase vía API");
        } else {
          // Si falló por proxy, intentar directo a la función de Netlify
          try {
            await fetch('https://mario-mojica-armado.netlify.app/.netlify/functions/guardar-camara', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(savePayload)
            });
            console.log("✅ Coordenadas de cámara guardadas directamente vía Netlify Function fallback");
          } catch (e) {}
        }
      } catch (apiErr) {
        console.warn("⚠️ Error en invocación directa de API, intentando fallback:", apiErr);
        try {
          await fetch('https://mario-mojica-armado.netlify.app/.netlify/functions/guardar-camara', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savePayload)
          });
        } catch (e) {}
      }

      // 3. Conectar y emitir mensaje Broadcast vía Supabase Realtime para que el CMS actualice su UI si está abierto
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const channel = supabase.channel('manual-features-realtime');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'update-camera',
            payload: savePayload
          });
          setTimeout(() => {
            channel.unsubscribe();
          }, 500);
        }
      });

      // 4. Emitir mensaje vía postMessage a window.opener si está disponible
      if (window.opener) {
        window.opener.postMessage({
          type: 'update-camera',
          payload: savePayload
        }, '*');
        console.log("✅ Posición de cámara enviada vía postMessage a window.opener");
      }

      // 4. Copiar al portapapeles automáticamente en el formato tradicional
      const clipText = `🎥 CÁMARA -> posición: [${currentPos.join(', ')}] | target: [${currentTarget.join(', ')}]`;
      navigator.clipboard.writeText(clipText)
        .then(() => {
          console.log("✅ Coordenadas de cámara copiadas al portapapeles:", clipText);
        })
        .catch(err => {
          console.warn("No se pudo copiar al portapapeles:", err);
        });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      console.log(`✅ Posición de cámara transmitida y actualizada localmente para el paso ${pasoActual}:`, currentPos, currentTarget);
    } catch (err) {
      console.error("❌ Error guardando posición de cámara:", err);
      alert("Error al guardar la posición de la cámara: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseOverlay = () => {
    useEnviroment.getState().SetCameraOverlay(false);
    try {
      localStorage.setItem('cameraOverlay', 'off');
      const url = new URL(window.location.href);
      url.searchParams.delete('cameraOverlay');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        pointerEvents: 'auto',
        zIndex: 9999
      }}
      calculatePosition={() => [window.innerWidth - 280, 12, 0]}
    >
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(99,255,200,0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#63ffc8',
          minWidth: '240px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎥 CÁMARA</span>
            <span style={{ opacity: 0.6 }}>— Paso {pasoActual}</span>
          </div>
          <button
            onClick={handleCloseOverlay}
            title="Ocultar Guía de Cámara"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '9999px',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
              lineHeight: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
              e.currentTarget.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#ccc';
            }}
          >
            ✕
          </button>
        </div>
        <button
          onClick={handleSetCameraPosition}
          disabled={saving}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: saved ? '1px solid #63ffc8' : '1px solid rgba(99,255,200,0.3)',
            borderRadius: '9999px',
            background: saved ? 'rgba(99,255,200,0.15)' : 'rgba(255,255,255,0.05)',
            color: saved ? '#63ffc8' : '#ccc',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? '⏳ Guardando...' : saved ? '✅ ¡Guardado!' : `🎥 Definir posición Paso ${pasoActual}`}
        </button>
      </div>
    </Html>
  );
}

export default function AssemblySceneViewer(props) {
  return <ActualAssemblySceneViewer {...props} />;
}

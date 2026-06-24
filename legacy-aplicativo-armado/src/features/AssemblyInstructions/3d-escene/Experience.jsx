import { useThree, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, useGLTF, useHelper, Environment, useTexture } from "@react-three/drei";
import React, { useRef, useEffect, Suspense, useState, useMemo } from "react";
import useEnviroment from "../hooks/useEnviroment.js";
import * as THREE from 'three';
import Model from "./Model.jsx";
import Floor from "./Floor/Floor.jsx";
import LightingPanel from "./LightingPanel.jsx";
import { getAssetPath } from "../../../lib/assets.js";



// Utility to partition a single panoramic atlas image into cubemap textures
function parseCubemapTextureAtlas(atlasImgUrl, tilesNum) {
  const textures = [];
  for (let i = 0; i < tilesNum; i++) {
    textures[i] = new THREE.Texture();
  }

  new THREE.ImageLoader().load(atlasImgUrl, (image) => {
    console.log("Cargando atlas 3D:", atlasImgUrl, "dimensiones reales detectadas:", image.width, "x", image.height);
    let canvas, context;
    const tileWidth = image.height;

    for (let i = 0; i < textures.length; i++) {
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d");
      canvas.height = tileWidth;
      canvas.width = tileWidth;

      context.drawImage(image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
      textures[i].image = canvas;
      textures[i].needsUpdate = true;
    }
  });

  return textures;
}

export default function AssemblySceneViewer({ id, modelUrl, productData }) {
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


  // Actualizar el target de la cámara usando los datos de 'alturas' del JSON
  useEffect(() => {
    if (alturas && alturas.length > 0) {
      const altData = alturas.find(a => a.paso === PasoActual);
      if (altData && altData.target) {
        setCameraTarget([altData.target[0], altData.target[1], altData.target[2]]);
      }
    }
  }, [PasoActual, alturas]);

  // Cargar la imagen panorámica en formato stripe y dividirla en 6 partes
  // Determinar si hay texturas PBR activas en las paredes (modo avanzado)
  // Se activa solo si además de la imagen difusa, se proporcionan mapas PBR complementarios (normales o rugosidad).
  // Si solo se proporciona pbrWallDiff, se asume que es la tira panorámica 360 (modo práctico de una sola imagen).
  const hasWallTextures = useMemo(() => {
    return !!(
      productData?.pbrWallDiff && 
      (productData?.pbrWallNormal || productData?.pbrWallRoughness || productData?.pbrWallHeight)
    );
  }, [productData?.pbrWallDiff, productData?.pbrWallNormal, productData?.pbrWallRoughness, productData?.pbrWallHeight]);

  // URL del atlas panorámico para el Skybox
  const atlasUrl = useMemo(() => {
    return (!hasWallTextures && productData?.pbrWallDiff) 
      ? productData.pbrWallDiff 
      : "/hdri2/salon_01.webp";
  }, [hasWallTextures, productData?.pbrWallDiff]);

  const [cacheBuster] = useState(() => Date.now());
  
  // Load panoramic stripe and split it into cubemap tiles
  const textures = useMemo(() => {
    return parseCubemapTextureAtlas(`${atlasUrl}?v=${cacheBuster}`, 6);
  }, [atlasUrl, cacheBuster]);

  const wallTextureConfig = useMemo(() => {
    const config = {
      map: productData?.pbrWallDiff || getAssetPath("/textures/floor/floor-diff.webp"),
      normalMap: productData?.pbrWallNormal || getAssetPath("/textures/floor/floor-normal.webp"),
      roughnessMap: productData?.pbrWallRoughness || getAssetPath("/textures/floor/floor-roughness.webp"),
    };
    if (productData?.pbrWallHeight) {
      config.bumpMap = productData.pbrWallHeight;
    }
    return config;
  }, [productData?.pbrWallDiff, productData?.pbrWallNormal, productData?.pbrWallRoughness, productData?.pbrWallHeight]);

  const wallTextureMaps = useTexture(wallTextureConfig);

  // Crear una referencia estable para wallTextureMaps para evitar re-ejecuciones por objetos contenedores efímeros
  const stableWallTextureMaps = useMemo(() => wallTextureMaps, [
    wallTextureMaps?.map,
    wallTextureMaps?.normalMap,
    wallTextureMaps?.roughnessMap,
    wallTextureMaps?.bumpMap
  ]);

  // Configurar las texturas de pared si están presentes
  useEffect(() => {
    if (hasWallTextures && stableWallTextureMaps) {
      Object.values(stableWallTextureMaps).forEach((texture) => {
        if (texture) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 2); // Repetición agradable en las paredes del escenario
        }
      });
      if (stableWallTextureMaps.map) {
        stableWallTextureMaps.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  }, [hasWallTextures, stableWallTextureMaps]);

  // Cargar el modelo GLB inicial (paso 00)
  const initialModelUrl = getAssetPath(`/${id}/models/P00.glb`);
  const { scene: gltfScene } = useGLTF(initialModelUrl);

  useEffect(() => {
    if (gltfScene) {
      CargarPasoInicial(gltfScene);
    }
  }, [gltfScene, CargarPasoInicial]);

  // Ref para persistir el skybox entre re-renders
  const skyBoxRef = useRef(null);

  // Align environmental background mesh to the computed floor y-axis
  const alignSkyboxToGround = (skyBoxMesh) => {
    if (!skyBoxMesh) return;
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
    
    if (planeValue !== null) {
      const floorY = planeValue - 0.001;
      const skyBoxY = floorY + 2.25 - 0.001;
      skyBoxMesh.position.set(0, skyBoxY, 0);
    } else {
      skyBoxMesh.position.set(0, 1.626, 0);
    }
  };

  // Crear el skybox / escenario PBR o básico
  useEffect(() => {
    if (productData?.tipoAmbiente === "estudio") {
      // Si está en modo estudio, no creamos ni agregamos el skybox
      return;
    }
    let materials;
    if (hasWallTextures) {
      // Crear material PBR para las paredes del escenario
      const wallMaterial = new THREE.MeshStandardMaterial({
        map: stableWallTextureMaps.map,
        normalMap: stableWallTextureMaps.normalMap,
        roughnessMap: stableWallTextureMaps.roughnessMap,
        bumpMap: stableWallTextureMaps.bumpMap || null,
        bumpScale: 0.02,
        roughness: 0.8,
        metalness: 0.1,
      });

      // Material gris claro neutro para el techo del escenario
      const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d0d0d0"),
        roughness: 0.9,
      });

      // Material oscuro para la base (escondida bajo el piso)
      const hiddenFloorMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#111111"),
      });

      // 6 caras: 0=Derecha, 1=Izquierda, 2=Techo, 3=Piso, 4=Frente, 5=Atrás
      materials = [
        wallMaterial,        // Derecha
        wallMaterial,        // Izquierda
        ceilingMaterial,     // Techo
        hiddenFloorMaterial, // Piso
        wallMaterial,        // Frente
        wallMaterial,        // Atrás
      ];
    } else {
      materials = textures.map((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texture });
      });
    }

    const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
    skyBox.geometry.scale(12, 4.5, -12); // Escala original de producción de 12x4.5x-12
    
    // Posicionar inmediatamente en su creación
    alignSkyboxToGround(skyBox);

    skyBoxRef.current = skyBox;
    scene.add(skyBox);

    return () => {
      scene.remove(skyBox);
      skyBox.geometry.dispose();
      materials.forEach(m => m.dispose());
      skyBoxRef.current = null;
    };
  }, [hasWallTextures, stableWallTextureMaps, textures, scene, productData?.tipoAmbiente]);

  // Actualizar posición del skybox al cambiar de paso o cuando se computa el minY del modelo
  useEffect(() => {
    alignSkyboxToGround(skyBoxRef.current);
  }, [PasoActual, alturas, computedModelMinY, skyBoxRef.current]);

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
            if (payload && payload.codigoManual === id) {
              const state = useEnviroment.getState();
              if (payload.key === 'cameraOverlay') {
                state.SetCameraOverlay(payload.value === 'on');
              }
              if (payload.key === 'lightingEditor') {
                state.SetLightingEditor(payload.value === 'on');
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
      {isEstudio && (
        <>
          <color attach="background" args={[customColors.background || colorAmbienteVal]} />
          <fog attach="fog" args={[customColors.background || colorAmbienteVal, 5, 15]} />
          <gridHelper 
            args={[
              30, 
              30, 
              customColors.gridCenter || '#b5b5c3', 
              customColors.gridLines || '#d1d1db'
            ]} 
            position={[0, floorY + 0.002, 0]} 
          />
        </>
      )}

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
        autoRotateSpeed={0.85}
        zoomSpeed={0.75}
        target={cameraTarget}
        maxDistance={7}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />

      <Suspense fallback={null}>
        <Floor productData={productData} />
      </Suspense>

      <Suspense fallback={null}>
        {isModelVisible && <Model id={id} modelUrl={modelUrl} orbitControlsRef={controlsRef} productData={productData} />}
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

      // 2. Conectar y emitir mensaje Broadcast vía Supabase Realtime para que el CMS guarde con privilegios de administrador
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
            payload: {
              codigoManual: manualId,
              step: pasoActual,
              cameraPosition: currentPos,
              cameraTarget: currentTarget
            }
          });
          setTimeout(() => {
            channel.unsubscribe();
          }, 500);
        }
      });

      // 3. Emitir mensaje vía postMessage a window.opener si está disponible
      if (window.opener) {
        window.opener.postMessage({
          type: 'update-camera',
          payload: {
            codigoManual: manualId,
            step: pasoActual,
            cameraPosition: currentPos,
            cameraTarget: currentTarget
          }
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
          borderRadius: '12px',
          padding: '14px 16px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#63ffc8',
          minWidth: '240px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textAlign: 'center' }}>
          🎥 CÁMARA — Paso {pasoActual}
        </div>
        <button
          onClick={handleSetCameraPosition}
          disabled={saving}
          style={{
            width: '100%',
            padding: '8px',
            border: saved ? '1px solid #63ffc8' : '1px solid rgba(99,255,200,0.3)',
            borderRadius: '8px',
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

import { useThree, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, useGLTF, useHelper, Environment, useTexture } from "@react-three/drei";
import React, { useRef, useEffect, Suspense, useState, useMemo } from "react";
import useEnviroment from "../hooks/useEnviroment.js";
import * as THREE from 'three';
import Model from "./Model.jsx";
import Floor from "./Floor/Floor.jsx";

// Componente Loader para mostrar el progreso de carga del modelo 3D
function Loader() {
  const { progress } = useProgress();
  const CheckReadyToPlay = useEnviroment((state) => state.CheckReadyToPlay);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    CheckReadyToPlay(progress);
  }, [progress, CheckReadyToPlay]);

  // Animación idéntica a la pantalla inicial para llenado y conteo numérico fluido
  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    const duration = 600; // Animación de llenado suave de 600ms
    
    const startValue = displayProgress;
    const endValue = Math.round(progress);

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const t = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const currentVal = Math.round(startValue + (endValue - startValue) * ease);
      
      setDisplayProgress(currentVal);
      
      if (t < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [progress]);

  const fillerStyles = {
    height: '100%',
    width: `${displayProgress}%`,
    backgroundColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
    transition: 'width 0.1s linear', // Transición lineal ultrarápida para acoplarse al animationframe
    borderRadius: 'inherit',
    boxShadow: '0 0 10px var(--primary-glow)'
  };

  const textContainerStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  };

  const labelStyles = {
    color: '#ffff00', // Amarillo exacto de la captura
    fontWeight: 'bold',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
  };

  return (
    <Html center>
      <div className="progress-model-loader" style={{ position: 'relative' }}>
        <div style={fillerStyles} className="progressBar"></div>
        <div style={textContainerStyles}>
          <span style={labelStyles}>{`${displayProgress}%`}</span>
        </div>
      </div>
    </Html>
  );
}

// Función para cargar la imagen panorámica y dividirla en 6 texturas
function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
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

export default function Experience({ id, modelUrl, productData }) {
  const { scene, gl, camera } = useThree();
  const useOrbitControls = useRef();
  const [cameraTarget, setCameraTarget] = useState([0, 0.8, 0]);
  const lastLoggedPos = useRef(""); // Guardar última posición impresa para evitar inundar la consola

  const toogle = useEnviroment((state) => state.show);
  const CargarPasoInicial = useEnviroment((state) => state.CargarPasoInicial);
  const ActualizarCliente = useEnviroment((state) => state.ActualizarCliente);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const cameraPositions = useEnviroment((state) => state.cameraPositions);
  const alturas = useEnviroment((state) => state.alturas);

  useFrame(() => {
    const pos = camera.position;
    const target = useOrbitControls.current ? useOrbitControls.current.target : { x: 0, y: 0, z: 0 };

    window.cameraDebug = {
      position: [pos.x, pos.y, pos.z],
      target: [target.x, target.y, target.z],
      fov: camera.fov,
      zoom: camera.zoom
    };

    // Imprimir en la consola solo cuando la posición o el target cambien significativamente al arrastrar/rotar
    const currentKey = `POS: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}] | TARGET: [${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)}]`;
    if (lastLoggedPos.current !== currentKey) {
      lastLoggedPos.current = currentKey;
      console.log(`🎥 CÁMARA -> posición: [${pos.x.toFixed(4)}, ${pos.y.toFixed(4)}, ${pos.z.toFixed(4)}] | target: [${target.x.toFixed(4)}, ${target.y.toFixed(4)}, ${target.z.toFixed(4)}]`);
    }
  });

  //Se actualiza si es Maderkit o Practimac
  useEffect(() => {
    if (id && id[0].includes("M")) {
      ActualizarCliente("Maderkit");
    }
  }, [id, ActualizarCliente]);


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
  
  // Cargar la imagen panorámica en formato stripe y dividirla en 6 partes con cache buster
  const textures = useMemo(() => {
    return getTexturesFromAtlasFile(`${atlasUrl}?v=${cacheBuster}`, 6);
  }, [atlasUrl, cacheBuster]);

  const wallTextureConfig = useMemo(() => {
    const config = {
      map: productData?.pbrWallDiff || "/textures/floor/floor-diff.webp",
      normalMap: productData?.pbrWallNormal || "/textures/floor/floor-normal.webp",
      roughnessMap: productData?.pbrWallRoughness || "/textures/floor/floor-roughness.webp",
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
  const initialModelUrl = `/${id}/models/P00.glb`;
  const { scene: gltfScene } = useGLTF(initialModelUrl);

  useEffect(() => {
    if (gltfScene) {
      CargarPasoInicial(gltfScene);
    }
  }, [gltfScene, CargarPasoInicial]);

  // Ref para persistir el skybox entre re-renders
  const skyBoxRef = useRef(null);

  // Función unificada para alinear la altura del escenario con el suelo (floorY)
  const repositionSkybox = (skyBoxMesh) => {
    if (!skyBoxMesh) return;
    if (alturas && alturas.length > 0) {
      const altData = alturas.find(a => a.paso === PasoActual);
      if (altData && altData.plane !== undefined) {
        const floorY = altData.plane - 0.017; // Ajuste idéntico al del Floor para coincidencia exacta
        const skyBoxY = floorY + 2.25 - 0.001; // Desplazamiento original de alineación del piso
        skyBoxMesh.position.set(0, skyBoxY, 0);
      } else {
        skyBoxMesh.position.set(0, 1.626, 0); // Fallback alineado con la media de plane
      }
    } else {
      skyBoxMesh.position.set(0, 1.626, 0);
    }
  };

  // Crear el skybox / escenario PBR o básico
  useEffect(() => {
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
    repositionSkybox(skyBox);

    skyBoxRef.current = skyBox;
    scene.add(skyBox);

    return () => {
      scene.remove(skyBox);
      skyBox.geometry.dispose();
      materials.forEach(m => m.dispose());
      skyBoxRef.current = null;
    };
  }, [hasWallTextures, stableWallTextureMaps, textures, scene]);

  // Actualizar posición del skybox al cambiar de paso
  useEffect(() => {
    repositionSkybox(skyBoxRef.current);
  }, [PasoActual, alturas, skyBoxRef.current]);

  return (
    <>
      <Environment preset="city" blur={0.8} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
      <spotLight position={[-5, 5, -5]} intensity={1} />

      <OrbitControls
        makeDefault
        ref={useOrbitControls}
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

      <Suspense fallback={<Loader />}>
        {toogle && <Model id={id} modelUrl={modelUrl} orbitControlsRef={useOrbitControls} />}
      </Suspense>
    </>
  );
}

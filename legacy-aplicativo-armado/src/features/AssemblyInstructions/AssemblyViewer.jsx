import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "./3d-escene/Experience.jsx";
import NavBarSuperior from "./components/NavBarSuperior/NavBarSuperior.jsx";
import NavBarInferior from "./components/NavBarInferior/NavBarInferior.jsx";
import Landscape from "./components/Landscape/Landscape.jsx";
import useEnviroment from "./hooks/useEnviroment";
import * as THREE from "three";
import PanelInicial from "./components/NavBarInferior/PanelInicial/PanelInicial";
import { getAssetPath } from "../../lib/assets.js";

export default function AssemblyViewer({ productData, steps, id }) {
  // Variables y funciones extraidas del state management (useEnviroment)
  const NuevosPasos = useEnviroment((state) => state.NuevosPasos);
  const ChangeId = useEnviroment((state) => state.ChangeId);
  const ChargerIcon = useEnviroment((state) => state.ChargerIcon);
  const ChargerPositionFloor = useEnviroment((state) => state.ChargerPositionFloor);
  const ChargerAlturas = useEnviroment((state) => state.ChargerAlturas);
  const ChargerCameraPositions = useEnviroment((state) => state.ChargerCameraPositions);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const PiezaHerraje = useEnviroment((state) => state.PiezaHerraje);
  const NamePieza = useEnviroment((state) => state.NamePieza);
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const sombras = useEnviroment((state) => state.sombras);
  const lightingConfig = useEnviroment((state) => state.lightingConfig);

  const isTouchDevice = typeof window !== "undefined" && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Ref para el tooltip flotante y coordenadas del mouse
  const tooltipRef = useRef(null);
  const mouseCoordsRef = useRef({ x: 0, y: 0 });

  // Escuchar el movimiento del mouse de manera global y actualizar directamente el DOM
  useEffect(() => {
    const handleMouseMove = (event) => {
      mouseCoordsRef.current = { x: event.clientX, y: event.clientY };
      if (tooltipRef.current && !isTouchDevice) {
        tooltipRef.current.style.left = `${event.clientX + 18}px`;
        tooltipRef.current.style.top = `${event.clientY + 12}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isTouchDevice]);

  // Posicionar inmediatamente el tooltip cuando aparezca (se monte en el DOM)
  useEffect(() => {
    if (PiezaHerraje && tooltipRef.current) {
      if (isTouchDevice) {
        // Dispositivo táctil: centrado y a 10px de los botones superiores
        const topBar = document.querySelector(".contenedor1-1") || document.querySelector(".contenedor1");
        let topPosition = 112; // Fallback razonable
        if (topBar) {
          const rect = topBar.getBoundingClientRect();
          topPosition = rect.bottom + 10;
        }
        tooltipRef.current.style.left = "50%";
        tooltipRef.current.style.transform = "translateX(-50%)";
        tooltipRef.current.style.top = `${topPosition}px`;
      } else {
        // PC: Sigue al cursor
        tooltipRef.current.style.left = `${mouseCoordsRef.current.x + 18}px`;
        tooltipRef.current.style.top = `${mouseCoordsRef.current.y + 12}px`;
        tooltipRef.current.style.transform = "none";
      }
    }
  }, [PiezaHerraje, isTouchDevice]);

  const refTitle = useRef();

  // Construir la URL del modelo según el paso actual
  const modelUrl = getAssetPath(`/${id}/models/P${pasoActual}.glb`);

  // Efecto para inicializar el store con los datos del data.json
  useEffect(() => {
    if (steps && productData) {
      NuevosPasos(steps);
      if (id) ChangeId(id);

      if (productData.logo) ChargerIcon(productData.logo);
      if (productData.posiciones) ChargerPositionFloor(productData.posiciones);
      if (productData.cameraPositions) ChargerCameraPositions(productData.cameraPositions);
      if (productData.alturas) ChargerAlturas(productData.alturas);

      if (refTitle.current) {
        refTitle.current.innerHTML = productData.name;
      }
    }
  }, [steps, id, productData]);

  // Inyectar configuración de iluminación y colores iniciales persistidos
  useEffect(() => {
    if (productData) {
      if (productData.lightingConfig) {
        useEnviroment.getState().SetLightingConfig(productData.lightingConfig);
      }
      
      const initialBgColor = productData.colorAmbiente || "#e8e8e8";
      const initialFloorColor = productData.colorPiso || "#e8e8e8";
      const initialGridCenter = productData.colorMallaCentro || "#b5b5c3";
      const initialGridLines = productData.colorMallaLineas || "#d1d1db";
      
      const state = useEnviroment.getState();
      if (!state.customColors.background) {
        state.setCustomColor("background", initialBgColor);
      }
      if (!state.customColors.floor) {
        state.setCustomColor("floor", initialFloorColor);
      }
      if (state.customColors.gridCenter === "#b5b5c3" || !state.customColors.gridCenter) {
        state.setCustomColor("gridCenter", initialGridCenter);
      }
      if (state.customColors.gridLines === "#d1d1db" || !state.customColors.gridLines) {
        state.setCustomColor("gridLines", initialGridLines);
      }
    }
  }, [productData]);

  const [orientation, setOrientation] = useState(window.orientation);

  // Función de reload al cambio de orientacion
  useEffect(() => {
    function handleOrientationChange() {
      setOrientation(window.orientation);
      location.reload();
    }
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [id]);

  if (!id) return <div className="p-10 text-red-500">Error: No Product ID provided</div>;

  // Mapa de tone mappings
  const toneMappingMap = {
    ACESFilmic: THREE.ACESFilmicToneMapping,
    AgX: THREE.AgXToneMapping,
    Linear: THREE.LinearToneMapping,
    None: THREE.NoToneMapping,
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900 overflow-hidden m-0 p-0">
      <title ref={refTitle}></title>
      
      {/* Pantalla inicial */}
      <PanelInicial />
      
      {/* The Canvas fills the parent */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows={sombras}
          gl={{
            antialias: true,
            toneMapping: toneMappingMap[lightingConfig.toneMapping] || THREE.ACESFilmicToneMapping,
            toneMappingExposure: lightingConfig.exposure,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{position: [0, 1, 2],  fov: 60}} 
          onPointerMissed={() => NamePieza([""])}
        >
          <Experience id={id} modelUrl={modelUrl} productData={productData} />
        </Canvas>
      </div>

      {/* Cortina translúcida de ayudas (Glassmorphism de derecha a izquierda) */}
      <div className={`cortina-ayudas ${PanelAyudas ? "is-active" : ""}`} />

      {/* UI Overlay Container */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between py-6">
        {/* Top UI */}
        <div className="pointer-events-auto flex justify-center gap-4">
          <NavBarSuperior id={id} data={productData} />
        </div>
        
        {/* Bottom UI */}
        <div className="pointer-events-auto w-full flex justify-center">
          <NavBarInferior id={id} data={productData} />
        </div>
      </div>

      {/* Componente que muestra los renders, al cambio de orientacion del app */}
      <Landscape />

      {/* Tooltip flotante premium que sigue al puntero */}
      {PiezaHerraje && (
        <div 
          ref={tooltipRef}
          className="pointer-tooltip"
          style={{ 
            position: "fixed",
            pointerEvents: "none",
            left: "-1000px",
            top: "-1000px"
          }}
        >
          {PiezaHerraje}
        </div>
      )}

    </div>
  );
}


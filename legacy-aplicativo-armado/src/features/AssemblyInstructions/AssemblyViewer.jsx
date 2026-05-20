import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "./3d-escene/Experience.jsx";
import NavBarSuperior from "./components/NavBarSuperior/NavBarSuperior.jsx";
import NavBarInferior from "./components/NavBarInferior/NavBarInferior.jsx";
import Landscape from "./components/Landscape/Landscape.jsx";
import useEnviroment from "./hooks/useEnviroment";
import * as THREE from "three";
import PanelInicial from "./components/NavBarInferior/PanelInicial/PanelInicial";

export default function AssemblyViewer({ productData, steps, id }) {
  // Variables y funciones extraidas del state management (useEnviroment)
  const NuevosPasos = useEnviroment((state) => state.NuevosPasos);
  const ChangeId = useEnviroment((state) => state.ChangeId);
  const ChargerIcon = useEnviroment((state) => state.ChargerIcon);
  const ChargerPositionFloor = useEnviroment((state) => state.ChargerPositionFloor);
  const ChargerAlturas = useEnviroment((state) => state.ChargerAlturas);
  const ChargerCameraPositions = useEnviroment((state) => state.ChargerCameraPositions);
  const pasoActual = useEnviroment((state) => state.pasoActual);

  const refTitle = useRef();

  // Construir la URL del modelo según el paso actual
  const modelUrl = `/${id}/models/P${pasoActual}.glb`;

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

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900 overflow-hidden m-0 p-0">
      <title ref={refTitle}></title>
      
      {/* Pantalla inicial */}
      <PanelInicial />
      
      {/* The Canvas fills the parent */}
      <div className="absolute inset-0 z-0">
        <Canvas
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{position: [0, 1, 2],  fov: 60}} 
        >
          <Experience id={id} modelUrl={modelUrl} />
        </Canvas>
      </div>

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

    </div>
  );
}


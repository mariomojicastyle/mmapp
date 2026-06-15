import { useTexture, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { DoubleSide, RepeatWrapping } from "three";
import useEnviroment from "../../hooks/useEnviroment";

export default function Floor({ productData }) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const alturas = useEnviroment((state) => state.alturas);
  const sombras = useEnviroment((state) => state.sombras);
  const computedModelMinY = useEnviroment((state) => state.computedModelMinY);
  const customColors = useEnviroment((state) => state.customColors);

  const pasoIndex = parseInt(pasoActual, 10) || 0;
  
  // Buscar la altura del piso (plane) para el paso actual en data.json
  const alturaPaso = alturas?.find(a => a.paso === pasoActual);
  
  // Prioridad: 1) plane manual del paso actual, 2) computedModelMinY (auto-grounding), 3) fallback 0
  const planeValue = (alturaPaso && alturaPaso.plane !== undefined) 
    ? alturaPaso.plane 
    : (computedModelMinY !== null ? computedModelMinY : 0);
  const floorY = planeValue - 0.001; // Ajuste fino de 1mm para evitar z-fighting manteniendo el mueble perfectamente apoyado

  const hasFloorTextures = !!(productData?.pbrFloorDiff || productData?.pbrFloorNormal || productData?.pbrFloorRoughness || productData?.pbrFloorHeight);

  const floorTextureConfig = {
    map: productData?.pbrFloorDiff || "/textures/floor/floor-diff.webp",    
    normalMap: productData?.pbrFloorNormal || "/textures/floor/floor-normal.webp",
    roughnessMap: productData?.pbrFloorRoughness || "/textures/floor/floor-roughness.webp",
  };

  if (productData?.pbrFloorHeight) {
    floorTextureConfig.bumpMap = productData.pbrFloorHeight;
  }

  // Solo incluir el aoMap de madera local si no se ha subido una textura de piso personalizada
  if (!hasFloorTextures) {
    floorTextureConfig.aoMap = "/textures/floor/floor-ao.webp";
  }

  const floorTexture = useTexture(floorTextureConfig);

  Object.values(floorTexture).forEach((texture) => {
    if (texture) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(hasFloorTextures ? 2.5 : 1.5, hasFloorTextures ? 2.5 : 1.5);
    }
  });
  // El mapa de difusión necesita sRGB para colores correctos
  if (floorTexture.map) floorTexture.map.colorSpace = THREE.SRGBColorSpace;

  return (
    <>
      {productData?.tipoAmbiente === "estudio" ? (
        <mesh position-y={floorY} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color={customColors.floor || productData?.colorPiso || productData?.colorAmbiente || "#e8e8e8"} roughness={0.8} metalness={0.1} />
        </mesh>
      ) : (
        <mesh position-y={floorY} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial {...floorTexture} color={customColors.floor || "#ffffff"} bumpScale={0.03} />
        </mesh>
      )}
      
      {sombras && (
        <ContactShadows
          position={[0, floorY + 0.005, 0]}
          opacity={0.8}
          scale={10}
          blur={2.5}
          far={4}
          resolution={512}
          color="#000000"
        />
      )}
    </>
  );
}


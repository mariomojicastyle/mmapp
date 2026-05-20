import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { DoubleSide, RepeatWrapping } from "three";
import useEnviroment from "../../hooks/useEnviroment";

export default function Floor() {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const alturas = useEnviroment((state) => state.alturas);

  const pasoIndex = parseInt(pasoActual, 10) || 0;
  
  // Buscar la altura del piso (plane) para el paso actual en data.json
  const alturaPaso = alturas?.find(a => a.paso === pasoActual);
  const floorY = (alturaPaso && alturaPaso.plane !== undefined ? alturaPaso.plane : 0) - 0.017; // Ajuste de 17mm para evitar que las piezas atraviesen el piso

  const floorTexture = useTexture({
    map: "/textures/floor/floor-diff.webp",    
    normalMap: "/textures/floor/floor-normal.webp",
    roughnessMap: "/textures/floor/floor-roughness.webp",
    aoMap: "/textures/floor/floor-ao.webp"
  });

  Object.values(floorTexture).forEach((texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
  });
  // El mapa de difusión necesita sRGB para colores correctos
  if (floorTexture.map) floorTexture.map.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position-y={floorY} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial {...floorTexture} />
    </mesh>
  );
}


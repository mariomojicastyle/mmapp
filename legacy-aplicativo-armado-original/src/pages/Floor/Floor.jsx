import { useTexture } from "@react-three/drei";
import { DoubleSide, RepeatWrapping } from "three";
import useEnviroment from "../../hooks/useEnviroment";

export default function Floor() {
  const PositionFloor = useEnviroment((state) => state.PositionFloor);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const Altura = useEnviroment((state) => state.alturas);
 
  const floorTexture = useTexture({
    map: "/textures/floor/floor-diff.webp",    
    normalMap: "/textures/floor/floor-normal.webp",
    roughnessMap: "/textures/floor/floor-roughness.webp",
    aoMap: "/textures/floor/floor-ao.webp"
  })

  Object.values(floorTexture).forEach((texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1, 1);  // Ajusta los valores para controlar la cantidad de repeticiones
  });
  const pasoIndex = parseInt(PasoActual, 10);
  const alturaStep = Altura && Altura[pasoIndex] ? parseFloat(Altura[pasoIndex].plane) : 0.66; // Valor por defecto

  console.log("este es la latura de piso",alturaStep)

  return (
    //<mesh position-y={0.66} rotation-x={-Math.PI / 2}
   <mesh position-y={alturaStep} rotation-x={-Math.PI / 2} receiveShadow  >
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial {...floorTexture} />
      {/* <shadowMaterial /> */}
    </mesh>
  );
}

import { useTexture } from "@react-three/drei";
import { DoubleSide, RepeatWrapping } from "three";

export default function Floor() {

  const floorTexture = useTexture({
    map: "textures/floor/floor-diff.webp",
    normalMap: "textures/floor/floor-normal.webp",
    roughnessMap: "textures/floor/floor-roughness.webp",
    aoMap: "textures/floor/floor-ao.webp"
  })

  Object.values(floorTexture).forEach((texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);  // Ajusta los valores para controlar la cantidad de repeticiones
  });

  return (
    <mesh position-y={0.28} rotation-x={-Math.PI / 2}
      receiveShadow
    >
      <planeGeometry args={[5, 5]} />
      <meshStandardMaterial {...floorTexture} />
      {/* <shadowMaterial /> */}
    </mesh>
  );
}

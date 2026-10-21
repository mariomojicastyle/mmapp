import { ContactShadows } from "@react-three/drei";
import useEnviroment from "../../hooks/useEnviroment";

export default function Floor({ productData }) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const alturas = useEnviroment((state) => state.alturas);
  const sombras = useEnviroment((state) => state.sombras);
  const computedModelMinY = useEnviroment((state) => state.computedModelMinY);
  const customColors = useEnviroment((state) => state.customColors);

  // Buscar la altura del piso (plane) para el paso actual en data.json
  const alturaPaso = alturas?.find((a) => a.paso === pasoActual);

  // Prioridad: 1) plane manual del paso actual, 2) computedModelMinY (auto-grounding), 3) fallback 0
  const planeValue =
    alturaPaso && alturaPaso.plane !== undefined
      ? alturaPaso.plane
      : computedModelMinY !== null
      ? computedModelMinY
      : 0;
  const floorY = planeValue - 0.001; // Ajuste fino de 1mm para evitar z-fighting

  const floorColor =
    customColors.floor || productData?.colorPiso || "#ffffff";

  return (
    <>
      <mesh position-y={floorY} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

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

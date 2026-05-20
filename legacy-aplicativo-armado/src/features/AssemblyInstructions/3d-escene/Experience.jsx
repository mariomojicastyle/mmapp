import { useThree, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, useGLTF, useHelper, Environment } from "@react-three/drei";
import { useRef, useEffect, Suspense, useState } from "react";
import useEnviroment from "../hooks/useEnviroment.js";
import * as THREE from 'three';
import Model from "./Model.jsx";
import Floor from "./Floor/Floor.jsx";

// Componente Loader para mostrar el progreso de carga del modelo 3D
function Loader() {
  const { progress } = useProgress();
  const CheckReadyToPlay = useEnviroment((state) => state.CheckReadyToPlay);

  useEffect(() => {
    CheckReadyToPlay(progress);
  }, [progress, CheckReadyToPlay]);

  return (
    <Html center>
      <div style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>
        {progress.toFixed(0)} %
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

export default function Experience({ id, modelUrl }) {
  const { scene, gl, camera } = useThree();
  const useOrbitControls = useRef();
  const [cameraTarget, setCameraTarget] = useState([0, 0.8, 0]);

  const toogle = useEnviroment((state) => state.show);
  const CargarPasoInicial = useEnviroment((state) => state.CargarPasoInicial);
  const ActualizarCliente = useEnviroment((state) => state.ActualizarCliente);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const cameraPositions = useEnviroment((state) => state.cameraPositions);
  const alturas = useEnviroment((state) => state.alturas);

  useFrame(() => {
    window.cameraDebug = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: useOrbitControls.current ? [useOrbitControls.current.target.x, useOrbitControls.current.target.y, useOrbitControls.current.target.z] : null,
      fov: camera.fov,
      zoom: camera.zoom
    };
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
  const textures = getTexturesFromAtlasFile("/hdri2/salon_01.webp", 6);

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

  // Crear el skybox UNA VEZ
  useEffect(() => {
    const materials = textures.map((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: texture });
    });
    const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
    skyBox.geometry.scale(12, 4.5, -12); // Escala 4.5 de altura para apoyar la base en floorY y evitar el estiramiento vertical exagerado de la puerta
    skyBoxRef.current = skyBox;
    scene.add(skyBox);

    return () => {
      scene.remove(skyBox);
      skyBox.geometry.dispose();
      materials.forEach(m => m.dispose());
      skyBoxRef.current = null;
    };
  }, []);

  // Actualizar posición del skybox al cambiar de paso
  // Alinea el plano visual de la proyección panorámica con el suelo físico de la escena (floorY).
  // La foto original tiene la cámara a 1.5 unidades por encima del suelo. Al ampliar la escala
  // del skybox de (8, 2.4, -8) a (12, 3.6, -12) en un factor de 1.5x, la distancia visual desde el
  // centro hasta el suelo se escala de igual forma: 1.5 * 1.5 = 2.25 unidades.
  // Restamos 1 milímetro (0.001 unidades) para evitar el Z-fighting (titileo de texturas coplanares) con el Floor.
  useEffect(() => {
    if (!skyBoxRef.current) return;
    if (alturas && alturas.length > 0) {
      const altData = alturas.find(a => a.paso === PasoActual);
      if (altData && altData.plane !== undefined) {
        const floorY = altData.plane - 0.017; // Ajuste idéntico al del Floor para coincidencia exacta
        const skyBoxY = floorY + 2.25 - 0.001; // Desplazamiento de 1mm hacia abajo para mitigar Z-fighting
        skyBoxRef.current.position.set(0, skyBoxY, 0);
      } else {
        skyBoxRef.current.position.set(0, 1.626, 0); // Fallback alineado con la media de plane (-0.606 - 0.017 + 2.25 - 0.001)
      }
    }
  }, [PasoActual, alturas]);

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

      <Suspense fallback={<Loader />}>
        {toogle && <Model id={id} modelUrl={modelUrl} orbitControlsRef={useOrbitControls} />}
        <Floor />
      </Suspense>
    </>
  );
}

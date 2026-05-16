import { useThree, useLoader} from "@react-three/fiber";
import { OrbitControls, Html, useProgress, useGLTF, useHelper } from "@react-three/drei";
import { useRef, useEffect, Suspense } from "react";
import useEnviroment from "../hooks/useEnviroment.js"; 
import * as THREE from 'three';
import Model from "./Model.js";
import Floor from "./Floor/Floor.jsx";
// import Furniture from "./world/Furniture";



// Componente Loader para mostrar el progreso de carga del modelo 3D
function Loader() {
  const { progress } = useProgress();
  // return <Html center>{progress.toFixed(2)} % loaded</Html>; 
  // Redondeamos a 2 decimales

  // no esta cogiendo esto: (ref playa) 
  const CheckReadyToPlay = useEnviroment((state) => state.CheckReadyToPlay);
  CheckReadyToPlay(progress);
}

// Función para cargar la imagen panorámica y dividirla en 6 texturas
function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
  const textures = [];
  for (let i = 0; i < tilesNum; i++) {
    textures[i] = new THREE.Texture();
  }

  new THREE.ImageLoader().load(atlasImgUrl, (image) => {
    let canvas, context;
    const tileWidth = image.height; // El ancho de cada parte es igual a la altura

    for (let i = 0; i < textures.length; i++) {
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d");
      canvas.height = tileWidth;
      canvas.width = tileWidth;

      // Dibujar cada sección en un nuevo canvas
      context.drawImage(image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
      textures[i].image = canvas;
      textures[i].needsUpdate = true;
    }
  });

  return textures;
}




export default function Experience({ id, data }) {
  const { scene, gl } = useThree(); // Obtenemos la escena y el renderizador de Three.js
  const useOrbitControls = useRef(); // Referencia para los controles de órbita

  const toogle = useEnviroment((state) => state.show);
  const CargarPasoInicial = useEnviroment((state) => state.CargarPasoInicial);
  const ActualizarCliente = useEnviroment((state) => state.ActualizarCliente);
  const PositionFloor = useEnviroment((state) => state.PositionFloor);

  const Altura = useEnviroment((state) => state.alturas); 

  const PasoActual = useEnviroment((state) => state.pasoActual);

  //console.log(Altura[(PasoActual)]);
  console.log(`Estas son las alturas ${Altura}`)

  let routeModel;
  id.toString();

  //Se actualiza si es Maderkit o Practimac, y se carga el paso P00.glb 
  
  if (id[0].includes("M")) {

    routeModel = `/${id}/models/P00.glb`;

    ActualizarCliente("Maderkit");

  }
  


  


  
   // Habilitar las sombras y agregar el tone-mapping en el renderizador
 useEffect(() => {
  // Habilitar sombras
  // gl.shadowMap.enabled = true;
  // gl.shadowMap.type = THREE.PCFSoftShadowMap;

  // Configuración de tone-mapping y encoding
  gl.outputEncoding = THREE.sRGBEncoding; // Usar sRGB para una correcta representación de los colores
  gl.toneMapping = THREE.ACESFilmicToneMapping; // Opción de tone-mapping para mejorar el realismo
  gl.toneMappingExposure = 0.5; // Ajustar exposición, 1.0 es el valor por defecto, puedes aumentar o disminuir


  }, [gl]);


   


  // Cargar la imagen panorámica en formato stripe y dividirla en 6 partes
  const textures = getTexturesFromAtlasFile("/hdri2/salon_01.webp", 6);


  // Cargar el modelo GLB utilizando useGLTF
  //Local 
  const { scene: gltfScene, animations } = useGLTF(`/${id}/models/P00.glb`);
  //Produccion 
  console.log(`Esta es la ruta ${routeModel}`)
  // const { scene: gltfScene,animations}= useGLTF(routeModel);


  CargarPasoInicial(gltfScene);

  // Configurar el cubemap como fondo y entorno de la escena
  useEffect(() => {
    const materials = textures.map((texture) => new THREE.MeshBasicMaterial({ map: texture }));
    // Crear un cubo más grande (10x10x10 unidades)
    const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
    skyBox.geometry.scale(8, 2.4, -8); // Invertir la geometría para que las caras queden hacia dentro
    const alturaStep = Altura[parseInt(PasoActual)]; // Accede a la altura del paso actual
    if (alturaStep) {
      console.log(`esta es la altura de la caja ${alturaStep.skyBox}`)
      skyBox.position.set(0, parseFloat(alturaStep.skyBox), 0);
    }
    //skyBox.position.set(0, 3.10, 0);
    //console.warn(`esta es la position ${PositionFloor[parseInt(PasoActual)]}`) 
    // skyBox.position.set(0, PositionFloor[parseInt(PasoActual)], 0); 


    scene.add(skyBox); // Añadir el cubo a la escena

    return () => {
      scene.remove(skyBox); // Limpiar la escena cuando el componente se desmonta
    };
  }, []);

  gltfScene.position.set(0, 0, 0);

  // Añadir el modelo GLB cargado a la escena 000
  // useEffect(() => {
  //   if (gltfScene) {
  //     gltfScene.position.set(1.5, 0.7, 0); // Posicionar el modelo 3D en el centro
  //     gltfScene.castShadow = true; // Hacer que el modelo proyecte sombra
  //     scene.add(gltfScene); // Añadir el modelo a la escena
  //   }

  //   return () => {
  //     if (gltfScene) {
  //       scene.remove(gltfScene); // Limpiar la escena cuando el componente se desmonta
  //     }
  //   };
  // }, [scene, gltfScene]);

  const directionalLightRef = useRef()

  // useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, "red")

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight 
      intensity={0.4}
      />

<spotLight      
        ref={directionalLightRef}
        intensity={0.5}
        // castShadow
        position={[8, 9, 20]}
        // shadow-mapSize-width={1240}
        // shadow-mapSize-height={1240}
        // ensayo cambio de intensidad de sombras
        // shadow-bias={-0.0001} 
        // shadow-normalBias={0.05}
        // shadow-radius={5110} 
        // shadow-bias={42}
      />

<spotLight
       intensity={30}  
       position={[0.5, 9, 0.5]} 
      //  castShadow 
       color={'#1a1a1a'}/> 
      {/* <SoftShadows /> */}

      <OrbitControls
        ref={useOrbitControls}
        autoRotateSpeed={0.85}
        zoomSpeed={0.75}
        target={[0, 0.8, 0]}
        maxDistance={5}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2}
      />

      
         {/* <SoftShadows /> */}

      {/* <ContactShadows
        position={[0, -1, 0]} 
        // Ajusta la posición si es necesario
        opacity={1} 
        // Controla la opacidad de la sombra
        width={10} 
        // Ancho de la sombra
        height={10} 
        // Altura de la sombra
        blur={2} 
        // Desenfoque para hacer la sombra suave
        far={10} 
        // Distancia a la que se proyecta la sombra
      /> */}

      {/* <Furniture /> */}
      <Suspense fallback={<Loader // => tener en cuenta que a este le puedo cambiar el diseño (el loading es un html que se muestra mientras se termina de cargar los modelos )
      />}>
        {toogle && <Model id={id} />}
        {/* <SoftShadows size={1} focus={0.1}/> */}
        <Floor />
      </Suspense>

    </>

  );
}

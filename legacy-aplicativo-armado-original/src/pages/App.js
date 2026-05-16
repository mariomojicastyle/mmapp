import "../style.css";
import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useLoaderData } from "react-router-dom";
import Experience from "./Experience.js";
import NavBarSuperior from "../components/NavBarSuperior/NavBarSuperior.jsx";
import NavBarInferior from "../components/NavBarInferior/NavBarInferior.jsx";
import Landscape from "../components/Landscape/Landscape.jsx";
import useEnviroment from "../hooks/useEnviroment";
import * as THREE from "three";
import PanelInicial from "../components/NavBarInferior/PanelInicial/PanelInicial";

export default function App() {

  //informacion retornada loaderPost();
  const { post, params } = useLoaderData();

  //Variables y funciones extraidas del state management (useEnviroment)
  const NuevosPasos = useEnviroment((state) => state.NuevosPasos);
  const ChangeId = useEnviroment((state) => state.ChangeId);
  const ChargerIcon = useEnviroment((state) => state.ChargerIcon);
  const ChargerPositionFloor = useEnviroment((state) => state.ChargerPositionFloor);
  const ChargerAlturas = useEnviroment((state) => state.ChargerAlturas); // Nueva función para manejar alturas

  const ChargerCameraPositions = useEnviroment((state) => state.ChargerCameraPositions);




  const refTitle = useRef();

 // Llamado a las funciones del state management
 NuevosPasos(post.pasos);
 ChangeId(params.id);
 ChargerIcon(post.logo);
 ChargerPositionFloor(post.posiciones);

 const cameraPositions = post.cameraPositions;
 console.log("Esta es la petición de posiciones de la cámara:", cameraPositions);
 ChargerCameraPositions(cameraPositions);

 // Colocar el log de depuración y la carga de alturas
 console.log("Esta es la petición de alturas:", post.alturas);
 ChargerAlturas(post.alturas);
  //Titulo
  useEffect(() => {
    refTitle.current.innerHTML = post.name;
  }, [])

  const [orientation, setOrientation] = useState(window.orientation);

  //Función de reload al cambio de orientacion
  useEffect(() => {
    function handleOrientationChange() {
      setOrientation(window.orientation);
      location.reload(); // reload the page
    }
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [params.id]);

  return (
    <>
      <title ref={refTitle}></title>
      
      {/* Pantalla inicial */}
      <PanelInicial />
      
      {/*Contenedor de la experiencia 3D */}
      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
          outputEncoding: THREE.LinearEncoding,
        }}
        // shadows
        camera={{position: [0, 1, 2],  fov: 60}} 
      >
        <Experience id={params.id} data={post} />
      </Canvas>

      {/* Contenedores de los botones ubicados en la parte de arriba y abajo, del aplicativo.
       Se ubican despues del canvas, para no poseer problemas de z-index  */}
      <NavBarSuperior id={params.id} data={post} />
      <NavBarInferior id={params.id} data={post} />

      {/* Componente que muestra los renders, al cambio de orientacion del app */}
      <Landscape />

    </>
  );
}

//Función que obtiene la información del data.json, correspondiente a la referencia del mueble 
export const loaderPost = async ({ params }) => {
  params.id[0].toUpperCase();

  //Para probar en local
  const data = await fetch(`./${params.id}/data.json`);
  
  // var data = null;
  // if (params.id[0] == "M") {
  //   data = await fetch(
  //     `https://3dymedios.com/Prueba/AP/Maderkit/${params.id}/data.json`
  //   );

  // } else if (params.id[0] == "P") {
  //   data = await fetch(
  //     `https://3dymedios.com/Prueba/AP/Practimac/${params.id}/data.json`
  //   );

  // }
  

  const post = await data.json();

  //Se retorna la información obtenida, junto el id ingresado
  return { post, params };
};

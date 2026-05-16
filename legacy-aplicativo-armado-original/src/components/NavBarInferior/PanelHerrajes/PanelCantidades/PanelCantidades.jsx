import useEnviroment from "../../../../hooks/useEnviroment";
import { useEffect, useState } from "react";
import { useRef } from "react";
import "./PanelCantidades.css";

export default function PanelCantidades() {
  const pasoInicial = useEnviroment((state) => state.pasoInicial);

  const PanelCantidadesTrue = useEnviroment(
    (state) => state.PanelCantidadesTrue
  );
  const PanelCantidades = useEnviroment((state) => state.PanelCantidades);
  const menu3 = useRef(null);
  const items3 = document.getElementsByClassName("option3");

  //Para que la informacion del panel de cantidades no se pierda, al cambiar de paso, se crea un global state
  // que posee toda la información referente al paso 00, y este se pueda conservar cada vez qeu se cambia de modelo.
  useEffect(() => {
    useEnviroment.subscribe(
      (state) => state.pasoInicial,
      (value) => {
          value.traverse((child) => {

            //Contenedor
            const item4 = document.createElement("div");
            //Imagen
            const item5 = document.createElement("div");
            //Cantidades
            const item6 = document.createElement("p");
            //Nombre
            const item7 = document.createElement("p");
            //Contenedor imagen y nombre
            const item8 = document.createElement("div");

            item5.classList.add("imagen");

            let characters = [];

            if (
              child.name.includes("Scene") ||
              child.name.includes("Capa") ||
              child.name.includes("Camera") ||
              child.name.includes("Texto") ||
              child.name.includes("Pieza") ||
              child.name.includes("Collection")
            ) {
              // child.material = textMaterial;
            } else if (child.name.includes("-")) {
              characters = child.name.split("-");

              item7.textContent = characters[0];
              item6.textContent = characters[2];
              item4.value = child.name;
              item4.classList.add("option3");

              //Al ser los mismos elementos de texto en linea, se agrega la misma clase
              item7.classList.add("cantidad");
              item6.classList.add("cantidad");

              if (!characters[0].includes("Pieza")) {
                item5.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${characters[0]}.jpg)`;
              }

              item8.appendChild(item7);
              item8.appendChild(item5);
              item4.appendChild(item8);

              if (!item6.textContent == "") {
                item4.appendChild(item6);
              }
            }else {
  
                if (!characters[0].includes("Pieza")) {
                  item5.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${characters[0]}.jpg)`;
                }
  
                item4.textContent = child.name;
                item4.value = child.name;
                item4.classList.add("option3");
  
                item4.appendChild(item5);
  
  
              } 
            if (item4.value != undefined) {
                if (menu3.current != undefined) {
                    if (!item6.textContent == "") {
                        menu3.current.appendChild(item4);
                    }
                  }
            }
          });

          let Unicos3 = [];

          Array.from(items3).forEach((element) => {
            if (Unicos3.includes(element.innerHTML)) {
              menu3.current.removeChild(element);
            } else {
              Unicos3.push(element.innerHTML);
            }
          });
        }
    );
  },[]);

  return (
    <>
      <aside className={`panel3 ${PanelCantidades ? "is-active" : ""}`}>
        {/* <!-- Opcion que funciona como titulo --> */}
        <div className="option4">
          <div
            className="imagen"
            style={{
              backgroundImage:
                "url(" +
                "https://3dymedios.com/Prueba/AP/Recursos/Tips/Cantidades_Totales_de_Herrajes.svg" +
                ")",
            }}
          ></div>
        </div>

        {/* <!-- Por medio de javascript, al leer la información del glb P00, se crean las diferentes indicaciones con la imagen del herraje, nombre y cantidad. --> */}
        <nav className="menu3" ref={menu3}></nav>
      </aside>
    </>
  );
}

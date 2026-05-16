import { useEffect, useState } from "react";
import { useRef } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./PanelHerrajes.css";
import PanelCantidades from "./PanelCantidades/PanelCantidades";

export default function PanelHerrajes() {
  const model = useEnviroment((state) => state.model);
  const PanelShow = useEnviroment((state) => state.PanelShow);
  const NegativePanel = useEnviroment((state) => state.NegativePanel);
  const btnCerrarFalse = useEnviroment((state) => {
    return state.btnCerrarFalse;
  });
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const PanelCantidadesTrue = useEnviroment(
    (state) => state.PanelCantidadesTrue
  );
  const NameTooltip = useEnviroment((state) => state.NameTooltip);

  const items = document.getElementsByClassName("option");
  const items3 = document.getElementsByClassName("option3");
  const menu = useRef(null);
  const refBtnCantidades = useRef(null);
  const refPanel = useRef(null);


  const HandExiste = useEnviroment((state) => state.HandToolExist);
  const HandExisteTrue = useEnviroment((state) => state.HandExistTrue);
  const CloudOneTime = useEnviroment((state) => state.CloudOneTime);
  const CloudOneTimeFalse = useEnviroment((state) => state.CloudOneTimeFalse);
  const StartApp = useEnviroment((state) => state.StartApp);


  const img = document.createElement("img");

  useEffect(() => {
    // Se realiza un recorrido por el modelo para extraer los nombres de las piezas y herrajes.
    // Es necesario que este proceso sea dentro de la funcion susbcribe, para poder trabajar comodamente con la infomacion del modelo, 
    // si no se utiliza de esta manera, no se obtiene la información de manera correcta.
    useEnviroment.subscribe(
      (state) => state.model,
      (value) => {
        //Se realizan dos validaciones, si el paso es el 00, tambien se extrae la infomación que irá en el panel de cantidades
        //si es otro paso diferente, solo se optiene la información para el panel de herrajes necesarios. 
        if (PasoActual === "00") {
          value.traverse((child) => {
            //El elemento item sera el que contendra la imagen y nombre del herraje
            const item = document.createElement("div");
            //imagen 
            const item2 = document.createElement("div");
            //cantidad 
            const item3 = document.createElement("p");

            item2.classList.add("imagen");

            let characters = [];

            if (
              child.name.includes("Scene") ||
              child.name.includes("Capa") ||
              child.name.includes("Camera") ||
              child.name.includes("Text") ||
              child.name.includes("Pieza") ||
              child.name.includes("Collection") ||
              child.name.includes("Plane")
            ) {
              // child.material = textMaterial;
            } else if (child.name.includes("-")) {
              characters = child.name.split("-");

              item.textContent = characters[0];
              item.value = child.name;
              item.classList.add("option");
              item3.textContent = characters[2];

              //Por cada opcion, al evento onclick se llama a la funcion Tootlip
              item.onclick = Tooltip;

              if (!characters[0].includes("Pieza")) {
                item2.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${characters[0]}.jpg)`;
              }
              item.appendChild(item2);
            } else {
              item.textContent = child.name;
              item.value = child.name;
              item.classList.add("option");
              item.onclick = Tooltip;

              if (!characters[0].includes("Pieza")) {
                item2.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${characters[0]}.jpg)`;
              }

              item.appendChild(item2);
            }
            if (item.value != undefined) {
              if (menu.current != undefined) {
                menu.current.appendChild(item);
              }
            }
          });
          let Unicos = [];

          //El algoritmo lo realiza con cada uno de los herrajes, por esta razón, se realiza un barrido para que solo haya
          //una option por herraje, la cual sobresalta todos los objetos con ese nombre en la escena.
          Array.from(items).forEach((element) => {
            if (Unicos.includes(element.innerHTML)) {
              menu.current.removeChild(element);
            } else {
              Unicos.push(element.innerHTML);
            }
          });
        } else {
          value.traverse((child) => {
            //El elemento item sera el que contendra la imagen y nombre del herraje
            const item = document.createElement("div");
            const item2 = document.createElement("div");
            const item3 = document.createElement("div");
            item2.classList.add("imagen");

            //La variable caracteres, funciona para crear un arreglo donde se guardara el nombre del objeto dividido por guiones, un ejemplo de esto es  Tarugo_20030001-05. Donde la posision 0 del arreglo es Tarugo_20030001, y la posicion 1 es 05.
            let characters;

            //Si el objeto contiene alguna de las siguientes palabras, se ignora este, ya que no es necesario que posea un tooltip
            if (
              child.name.includes("Scene") ||
              child.name.includes("Capa") ||
              child.name.includes("Camera") ||
              child.name.includes("Texto") ||
              child.name.includes("Puerta") ||
              child.name.includes("Cajon") ||
              child.name.includes("Pieza")
            ) {
              // child.material = textMaterial;
            } else if (child.name.includes("-")) {
              //Se valida si el paso actual corresponde al 00, si es el caso, se crea otra logica diferente, ya que este paso posee la información de la cantidad de herrajes, lo cual no se puede agregar en los tooltips de los herrajes necesarios
              if (PasoActual == "00") {
                //Si el objeto contiene un guion, se divide el nombre del objeto por guiones, y se guarda en el arreglo characters
                characters = child.name.split("-");

                //Al elemento item en su propiedad textContent se le asigna el nombre del objeto, en este caso el nombre del herraje
                item.textContent = characters[0];

                //lo mismo se realiza a la propiedad del valor
                item.value = child.name;

                //se agrega la clase option a item, para que este se pueda agregar al menu de herrajes necesarios
                item.classList.add("option");

                //el elemento item3 contendra el texto que indica la cantidad total de elementos que hay de ese herraje
                item3.textContent = characters[2];

                //se agrega la clase cantidad al item3, ya que este sera el texto que dice la cantidad de herrajes, pero solo se agrega al menu Catidad_Herrajes
                item3.classList.add("cantidad");

                //Se brinda una funcion onclick al elemento, para que al hacer click en el herraje, se pueda resaltar el herraje en la vista 3D
                item.onclick = Tooltip;

                //Se realiza una condicion, para todo elemento que no contenga la palabra Pieza,Cajon o Puerta, se le buscara su respectiva imagen en el servidor
                if (
                  characters[0].includes("Pieza") ||
                  characters[0].includes("_Cajon") ||
                  characters[0].includes("Puerta")
                ) {
                  item2.style.backgroundImage = `url(./textures/ImagenesPiezas/${characters[0]}.jpg)`;
                } else {
                  item2.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${characters[0]}.jpg)`;
                }
                item.appendChild(item2);

                if (item3.textContent != "") {
                  item.appendChild(item3);
                }

                //En caso contrario de que el paso no sea el 00, se creara una logica, donde los tootips que se crearan son de aquellos herrajes que poseen en su seguna posicion del arreglo characters, un numeral, esto quiere decir que son herrajes animados durante ese paso.
              } else {
                characters = child.name.split("-");

                //Se realiza la validación de los elementos que poseean el numeral, para que no se agreguen al menu de herrajes necesarios
                if (characters[1].includes("#")) {
                  item.textContent = characters[0];
                  item.value = child.name;
                  item.classList.add("option");
                  item.onclick = Tooltip;

                  if (
                    characters[0].includes("Pieza") ||
                    characters[0].includes("_Cajon") ||
                    characters[0].includes("Puerta")
                  ) {
                    item2.style.backgroundImage = `url(./textures/ImagenesPiezas/${characters[0]}.jpg)`;
                  } else {
                    item2.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${characters[0]}.jpg)`;
                  }

                  item.appendChild(item2);
                }
              }
            } else if (child.name.includes("-")) {
              // child.material = textMaterial;
              //Por ultimo, la opción donde se ignoran todos esos elementos que no poseen guiones, ni numeral, ni tampoco son herrajes necesarios
            } else {
              item.textContent = child.name;
              item.value = child.name;
              item.classList.add("option");
              item.onclick = Tooltip;
              if (
                child.name.includes("Pieza") ||
                characters[0].includes("_Cajon") ||
                characters[0].includes("Puerta") ||
                characters[0].includes("Plane")
              ) {
                item2.style.backgroundImage = `url(./textures/ImagenesPiezas/${child.name}.jpg)`;
              } else {
                item2.style.backgroundImage = `url(https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${child.name}.jpg)`;
              }
              item.appendChild(item2);
            }

            if (item.value != undefined) {
              if (menu.current != undefined) {
                menu.current.appendChild(item);
              }
            }

            //Proceso para eliminar aquellos tootips que se repiten en el menu de herrajes necesarios
            let Unicos = [];
            Array.from(items).forEach((element) => {
              if (Unicos.includes(element.innerHTML)) {
                menu.current.removeChild(element);
              } else {
                Unicos.push(element.innerHTML);
              }
            });
          });
        }
      }
    );
    
    //Dependiendo del panel de herrajes, el cual señala los necesarios en el paso esta lleno o vacio, aparece un tooltip diferente,
    //apuntara al boton de Cantidade_totales.
    //Si el panel esta vacio, aparecera una mano apuntando al boton, si no lo esta aprecera una burburja indicando que cualquiera de las
    //opciones se puede seleccionar.

    // Todo esto se realiza cuando el aplicativo inicia.
    if (PasoActual == "00") {
      if(StartApp==true){
        if (items[0] == null) {
          img.src =
            "https://3dymedios.com/Prueba/AP/Recursos/Iconos/hand_tool.svg";
          if (HandExiste == false) {
            refBtnCantidades.current.appendChild(img);
          }
        } else {
          if (items[0] != null) {
            img.src =
              "https://3dymedios.com/Prueba/AP/Recursos/Iconos/07_Localizar_Herrajes.svg";
            items[0].appendChild(img);
          }
        }
      }
    } else {
      if(StartApp==true){
        if (items[0] == null) {
          img.src =
            "https://3dymedios.com/Prueba/AP/Recursos/Iconos/hand_tool.svg";
          if (HandExiste == false) {
            refBtnCantidades.current.appendChild(img);
            HandExisteTrue();
          }
        } else {
          img.src =
          "https://3dymedios.com/Prueba/AP/Recursos/Iconos/07_Localizar_Herrajes.svg";
          items[0].appendChild(img);
        }
      }
    }
    
  }, [model,PasoActual,HandExiste,StartApp]);

  //La burbujas indicadas en la funcion anterior, solo se activan una sola vez.
  useEffect(() => {
    if (PanelShow == true) {
      if (CloudOneTime == true) {
        setTimeout(() => {
          if (document.querySelector(".menu .option img") == null) {
            document.querySelector("#cantidades .imagen img").style.opacity = 1;
          } else {
            document.querySelector(".menu .option img").style.opacity = 1;
          }
        }, 0);
        setTimeout(() => {
          if (document.querySelector(".menu .option img") == null) {
            document.querySelector("#cantidades .imagen img").style.opacity = 0;
          } else {
            document.querySelector(".menu .option img").style.opacity = 0;
          }
        }, 5000);
        CloudOneTimeFalse();
      }
    } 
  }, [PanelShow]);

  //Si se clickea el boton de Cantidades, se activara dicho panel.
  const ShowPanelCantidades = () => {
    PanelCantidadesTrue();
  };

  function Tooltip() {
    NegativePanel();
    btnCerrarFalse();
    //Se guarda el nombre del herraje seleccionado, en un global state, para ser utilizado en el componente Model.js,
    // para de esta manera, poder identifcar que herraje debe ser resaltado. 
    NameTooltip(this.value);
  }

  return (
    <>
      <aside className={`panel ${PanelShow ? "is-active" : ""}`} ref={refPanel}>
        <nav className="menu" ref={menu}></nav>

        {/* <!-- Boton que activa el panel de cantiades --> */}
        <div id="cantidades" className="option4" >
          {/* <!-- Imagen utilizada por defecto como titulo --> */}
          <div
            ref={refBtnCantidades}
            className="imagen"
            style={{ 
              backgroundImage:
                "url(" +
                "https://3dymedios.com/Prueba/AP/Recursos/Tips/Cantidades_Totales_de_Herrajes.svg" +
                ")",
            }}
            onClick={ShowPanelCantidades}
          ></div>
        </div>
      </aside>
    </>
  );
}

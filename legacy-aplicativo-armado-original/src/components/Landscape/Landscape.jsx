import useEnviroment from "../../hooks/useEnviroment";
import "./Landscape.css"

//El aplicativo en dispositivos moviles, si es orientado de manera horizontal, se muestran los renders del mueble. 
export default function Landscape() {

    const id = useEnviroment((state) => state.id);
    const Cliente = useEnviroment((state) => state.Cliente);

    return <>
        <div id="landscape">
            <div style={{ backgroundImage: "url(" + `https://3dymedios.com/Prueba/AP/${Cliente}/${id}/renders/render1.jpg` + ")" }}></div>
            <div style={{ backgroundImage: "url(" + `https://3dymedios.com/Prueba/AP/${Cliente}/${id}/renders/render2.jpg` + ")" }}></div>
        </div>


    </>
}
import useEnviroment from "../../hooks/useEnviroment";
import { getAssetPath } from "../../../../lib/assets.js";

// El aplicativo en dispositivos moviles, si es orientado de manera horizontal, se muestran los renders del mueble. 
export default function Landscape() {
    const id = useEnviroment((state) => state.id);

    return (
        <div className="hidden -z-[100] max-[320px]:flex max-[320px]:fixed max-[320px]:inset-0 max-[320px]:bg-white max-[320px]:z-[990000] max-[320px]:w-full max-[320px]:h-screen max-[320px]:text-[120%] max-[320px]:items-center max-[320px]:justify-center">
            <div 
                className="max-[320px]:w-[200px] max-[320px]:h-[200px] bg-cover bg-no-repeat m-[5px]" 
                style={{ backgroundImage: `url(${getAssetPath(`/${id}/renders/render1.jpg`)})`, backgroundSize: '100% 100%' }}
            ></div>
            <div 
                className="max-[320px]:w-[200px] max-[320px]:h-[200px] bg-cover bg-no-repeat m-[5px]" 
                style={{ backgroundImage: `url(${getAssetPath(`/${id}/renders/render2.jpg`)})`, backgroundSize: '100% 100%' }}
            ></div>
        </div>
    );
}
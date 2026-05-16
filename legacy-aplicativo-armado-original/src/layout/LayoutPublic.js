import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

//Layout utilizado para el resto de rutas.
const LayoutPublic = ()=>{
    return (
        <>
        {/* <Navbar/> */}
        <main>
            <Outlet/>
        </main>
        </>
    )
}
export default LayoutPublic;
import { createHashRouter,createBrowserRouter } from "react-router-dom";
import LayoutPublic from "../layout/LayoutPublic.js";
import Home from "../pages/Home.js";
import App, { loaderPost } from "../pages/App.js";
import Notfound from "../pages/NotFound.js";

//Se usa un hastaRouter para el correcto funcionamiento de las urls.
export const router = createHashRouter([
    {
        //Se poseen dos rutas que poseen un layout 
        path: "/",
        element: <LayoutPublic />,
        errorElement: <Notfound/>,
        children: [
            //Ruta Home
            {
                index: true,
                element: <Home />,
            },
            //Ruta del mueble, la cual posee toda la funcionalidad
            {
                path: "/:id",
                element: <App />,

                //Utilizado para manipular la informacion brindada por los params
                loader:loaderPost,
        
            },
        ],
    },
    
]);

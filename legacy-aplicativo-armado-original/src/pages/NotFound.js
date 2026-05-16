import { useRouteError, Link } from "react-router-dom";

const Notfound = () =>{
    const error = useRouteError();
    console.log(error);

    //Muestra cualquier error que suceda en el aplicativo
    return (
        <div>
            <h1>404</h1>
            <p>Page not found</p>
            <p>{error.statusText || error.message}</p>
            <Link to="/">Go back to home</Link>
        </div>
    );
}
export default Notfound;
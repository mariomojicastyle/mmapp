import { NavLink } from "react-router-dom";

export default function Navbar(){

    //Navbar para pruebas.
    return <>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <NavLink className="navbar-brand" to="/">Home</NavLink>
                <NavLink className="navbar-brand" to="/#/">Referencia</NavLink> 
            </div>
        </nav>
    
    </>
};
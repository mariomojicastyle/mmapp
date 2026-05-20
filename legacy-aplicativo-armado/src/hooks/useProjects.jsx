// src/hooks/useProjects.jsx (CÓDIGO COMPLETO)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para obtener los datos de la tabla 'Projects'
    const fetchProjects = async () => {
        setLoading(true);
        setError(null);

        // La seguridad la maneja la RLS que configuraste en Supabase
        const { data, error } = await supabase
            .from('Projects') // <-- Nombre de la tabla
            .select('id, name'); // Solo necesitamos las columnas necesarias

        if (error) {
            console.error('Error fetching projects:', error);
            setError(error.message);
            setProjects([]); // Limpiar proyectos en caso de error
        } else {
            setProjects(data || []); // Usar array vacío si data es null
        }
        setLoading(false);
    };

    useEffect(() => {
        // Ejecutar la función de fetching al montar el componente
        fetchProjects();
        // Nota: No se necesita una función de limpieza para esta llamada GET simple.
    }, []); // El array vacío asegura que se ejecute solo al montar

    // Retornamos los datos y el estado para que el DashboardPage los use
    return { projects, loading, error, refetch: fetchProjects };
};
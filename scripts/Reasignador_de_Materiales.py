import bpy
import re

def reasignar_materiales_duplicados():
    # Expresión regular para identificar el sufijo de Blender (ej. .001, .002)
    patron_sufijo = re.compile(r'\.\d{3}$')
    
    # Contador para saber cuántos se reemplazaron
    reemplazos = 0

    # 1. Recorrer todos los objetos en la escena
    for obj in bpy.data.objects:
        # Verificar si el objeto tiene ranuras de materiales (meshes, curvas, etc.)
        if hasattr(obj.data, 'materials'):
            for slot in obj.material_slots:
                if slot.material:
                    nombre_actual = slot.material.name
                    
                    # Si el nombre del material termina en .00x
                    if patron_sufijo.search(nombre_actual):
                        # Extraer el nombre base (quitando los últimos 4 caracteres)
                        nombre_base = nombre_actual[:-4]
                        
                        # 2. Verificar si el material original ya existe en el archivo
                        if nombre_base in bpy.data.materials:
                            # Asignar el material original a la ranura
                            slot.material = bpy.data.materials[nombre_base]
                            reemplazos += 1
                            print(f"Reasignado: {nombre_actual} -> {nombre_base} en {obj.name}")

    # 3. Limpieza: Eliminar de la base de datos los materiales duplicados que ya no tienen usuarios
    materiales_eliminados = 0
    for mat in bpy.data.materials:
        if mat.users == 0:
            bpy.data.materials.remove(mat)
            materiales_eliminados += 1
            
    print(f"--- Proceso Completado ---")
    print(f"Materiales reasignados: {reemplazos}")
    print(f"Materiales huérfanos eliminados: {materiales_eliminados}")

# Ejecutar la función
reasignar_materiales_duplicados()
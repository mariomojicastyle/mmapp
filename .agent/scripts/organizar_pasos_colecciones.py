import bpy
import re
import mathutils

# --- CONFIGURACIÓN DE COLECCIONES Y OBJETOS (SOBREESCRITURAS MANUALES) ---
# Si deseas que un objeto específico o grupo de objetos vaya a una colección específica
# de forma manual, colócalo aquí. Esto tiene prioridad sobre el mapeo automático por proximidad.
# Puedes usar:
# 1. El nombre exacto del objeto (ej: "Pieza_07-1")
# 2. Un prefijo usando "prefix:" al inicio (ej: "prefix:Tornillo_0004705")
# 3. Una expresión regular usando "regex:" al inicio (ej: "regex:Tarugo_.*-2$")
MAPEO_COLECCIONES = {
    "P01": [
        "Pieza_07-1",  # Ejemplo de sobreescritura
        "Tuerca_0004674-2",
        "Tuerca_0004674-4",
        "Corredera_350_20080001-4",
        "Corredera_350_20080001-6",
        "prefix:Tarugo_20030001-2",
        "prefix:Tarugo_20030001-15",
        "prefix:Tornillo_0004705-5",
        "prefix:Tornillo_0004705-17",
        "prefix:Tornillo_0004705-32",
        "prefix:Tornillo_0004705-57",
        "prefix:Tornillo_0004705-76",
        "prefix:Tornillo_0004705-81",
        "prefix:Tornillo_0004705-106",
        "prefix:Tornillo_0004705-122",
    ],
    "P02": [
        "Pieza_06-1",
        "prefix:Tarugo_20030001-6",
        "prefix:Tarugo_20030001-29",
        "prefix:Tornillo_0004705-7",
        "prefix:Tornillo_0004705-9",
        "prefix:Tornillo_0004705-10",
        "prefix:Tornillo_0004705-11",
        "prefix:Tornillo_0004705-25",
        "prefix:Tornillo_0004705-27",
        "prefix:Tornillo_0004705-28",
        "prefix:Tornillo_0004705-40",
        "prefix:Tornillo_0004705-47",
        "prefix:Tornillo_0004705-52",
        "prefix:Tornillo_0004705-59",
        "prefix:Tornillo_0004705-89",
        "prefix:Tornillo_0004705-102",
        "prefix:Tornillo_0004705-107",
        "prefix:Tornillo_0004705-112",
        "prefix:Tornillo_0004705-120",
        "prefix:Corredera_350_20080001-2",
        "prefix:Corredera_350_20080001-9",
        "prefix:Corredera_350_20080001-14",
        "prefix:Corredera_350_20080001-15",
    ],
    "P03": [],
    "P04": [],
    "P05": [],
    "P06": [],
    "P07": [],
    "P08": []
}

# --- MAPEO AUTOMÁTICO DE PIEZAS DE MADERA A PASOS ---
# Define a qué paso pertenece cada número de pieza de madera (Pieza_XX)
# Basado en el guión oficial de armado (guiones_armado.md)
MAPEO_PIEZAS_PASOS = {
    # Paso 1: Piezas 01, 04, 09
    1: "P01", 4: "P01", 9: "P01",
    # Paso 2: Piezas 03, 05, 10, 12, 20
    3: "P02", 5: "P02", 10: "P02", 12: "P02", 20: "P02",
    # Paso 3: Piezas 02, 06, 07, 08, 19
    2: "P03", 6: "P03", 7: "P03", 8: "P03", 19: "P03",
    # Paso 4: Pieza 24 (Fondo)
    24: "P04",
    # Paso 5: Pieza 21 (Puertas)
    21: "P05",
    # Paso 7: Piezas 11, 13, 14, 15, 23 (Cajones)
    11: "P07", 13: "P07", 14: "P07", 15: "P07", 23: "P07"
}

def obtener_o_crear_coleccion(nombre_col):
    """Crea una colección si no existe y la vincula a la escena activa."""
    if nombre_col not in bpy.data.collections:
        nueva_col = bpy.data.collections.new(nombre_col)
        bpy.context.scene.collection.children.link(nueva_col)
        print(f"Colección creada: {nombre_col}")
        return nueva_col
    return bpy.data.collections.get(nombre_col)

def mover_objeto_a_coleccion(obj, coleccion_destino):
    """Mueve un objeto a la colección destino, eliminándolo de sus colecciones anteriores."""
    if obj.name not in coleccion_destino.objects:
        coleccion_destino.objects.link(obj)
        
    for col in list(obj.users_collection):
        if col != coleccion_destino:
            col.objects.unlink(obj)

def obtener_centro_geometria(obj):
    """Calcula el centro del bounding box del objeto en coordenadas del mundo."""
    try:
        bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        return sum(bbox, mathutils.Vector()) / 8
    except Exception:
        return obj.matrix_world.translation

def calcular_distancia_minima_bbox(hardware_obj, wood_obj):
    """Calcula la distancia mínima desde el centro del hardware a las esquinas del bbox de la madera."""
    hw_center = obtener_centro_geometria(hardware_obj)
    try:
        wood_bbox = [wood_obj.matrix_world @ mathutils.Vector(corner) for corner in wood_obj.bound_box]
        distancias = [(hw_center - corner).length for corner in wood_bbox]
        return min(distancias)
    except Exception:
        # Caída de respaldo si no tiene bound_box
        return (hw_center - wood_obj.matrix_world.translation).length

def coincide_patron(obj_name, patron):
    """Verifica si el nombre de un objeto coincide con un patrón manual."""
    if patron.startswith("prefix:"):
        return obj_name.startswith(patron[7:])
    elif patron.startswith("regex:"):
        return bool(re.match(patron[6:], obj_name))
    else:
        return obj_name == patron

def organizar_objetos():
    print("\n" + "="*50)
    print("=== INICIANDO ORGANIZACIÓN AUTOMÁTICA Y PROXIMIDAD ===")
    print("="*50)

    # 1. Asegurar la existencia de colecciones P01 a P08
    colecciones_pasos = {}
    for i in range(1, 9):
        nombre_paso = f"P{i:02d}"
        colecciones_pasos[nombre_paso] = obtener_o_crear_coleccion(nombre_paso)

    # 2. Separar objetos de tipo MESH en maderas (Wood) y herrajes (Hardware)
    maderas = []
    herrajes = []
    
    # Llevar control de qué objetos ya fueron asignados manualmente
    asignados_manualmente = set()
    mapeo_final = {} # obj.name -> nombre_coleccion

    # Determinar asignaciones manuales primero
    for nombre_paso, patrones in MAPEO_COLECCIONES.items():
        if not patrones:
            continue
        for obj in bpy.data.objects:
            if obj.type != 'MESH':
                continue
            for patron in patrones:
                if coincide_patron(obj.name, patron):
                    mapeo_final[obj.name] = nombre_paso
                    asignados_manualmente.add(obj.name)
                    break

    # Clasificar los objetos no asignados manualmente
    for obj in bpy.data.objects:
        if obj.type != 'MESH':
            continue
        if obj.name in asignados_manualmente:
            continue
            
        # Determinar si es una madera (Pieza_XX)
        # Admite formatos: Pieza_01, Pieza 01, Pieza_01-1, Pieza_01.001
        es_madera = bool(re.search(r'Pieza[_\s]*\d+', obj.name, re.IGNORECASE))
        if es_madera:
            maderas.append(obj)
        else:
            herrajes.append(obj)

    # 3. Mapear maderas automáticamente basándose en su número de pieza
    maderas_mapeadas = []
    for obj in maderas:
        match = re.search(r'Pieza[_\s]*(\d+)', obj.name, re.IGNORECASE)
        if match:
            num_pieza = int(match.group(1))
            paso_destino = MAPEO_PIEZAS_PASOS.get(num_pieza)
            if paso_destino:
                mapeo_final[obj.name] = paso_destino
                maderas_mapeadas.append(obj)
                print(f"  [Auto Madera] {obj.name} (Pieza {num_pieza}) -> {paso_destino}")
            else:
                print(f"  [Aviso] Madera {obj.name} (Pieza {num_pieza}) no tiene paso asignado en el guión.")
        else:
            print(f"  [Aviso] No se pudo extraer número de pieza para: {obj.name}")

    # 4. Mapear herrajes por proximidad espacial a las maderas ya mapeadas
    # Solo usaremos como referencia de proximidad las maderas que logramos mapear a algún paso
    if maderas_mapeadas:
        for hw in herrajes:
            closest_wood = None
            min_dist = float('inf')
            
            for wood in maderas_mapeadas:
                dist = calcular_distancia_minima_bbox(hw, wood)
                if dist < min_dist:
                    min_dist = dist
                    closest_wood = wood
            
            if closest_wood:
                paso_destino = mapeo_final[closest_wood.name]
                mapeo_final[hw.name] = paso_destino
                print(f"  [Auto Herraje] {hw.name} -> {paso_destino} (más cercano a {closest_wood.name}, dist: {min_dist:.3f}m)")
            else:
                print(f"  [Aviso] Herraje {hw.name} no encontró madera cercana.")
    else:
        print("  [Aviso] No se mapearon maderas, omitiendo asignación de herrajes por proximidad.")

    # 5. Ejecutar el movimiento físico de los objetos en Blender
    conteos = {f"P{i:02d}": 0 for i in range(1, 9)}
    for obj_name, nombre_paso in mapeo_final.items():
        obj = bpy.data.objects.get(obj_name)
        if obj:
            col_dest = colecciones_pasos[nombre_paso]
            mover_objeto_a_coleccion(obj, col_dest)
            conteos[nombre_paso] += 1

    # 6. Reporte Final
    print("\n" + "="*50)
    print("=== RESUMEN DE ORGANIZACIÓN POR COLECCIÓN ===")
    print("="*50)
    for paso, count in conteos.items():
        print(f"  Colección {paso}: {count} objetos")
    print(f"Total de objetos organizados: {len(mapeo_final)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    organizar_objetos()

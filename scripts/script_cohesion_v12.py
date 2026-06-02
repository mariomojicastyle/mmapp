import bpy
import re
from mathutils import Vector

# ==========================================
# CONFIGURACIÓN DEL SCRIPT
# ==========================================

NUMERACION_AUTOMATICA = True
UMBRAL_CENTROS = 0.02 
PALABRAS_IGNORADAS = ["mdp", "balance"]
TOLERANCIA_DIMENSION = 0.001 # 1 milímetro de tolerancia para comparar tamaños

# ==========================================
# FUNCIONES DE UTILIDAD
# ==========================================

def get_mesh_center(obj):
    if not obj or obj.type != 'MESH':
        return None
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox_corners, Vector()) / 8.0
    return center

def get_dimensions(obj):
    """ Retorna una tupla con las dimensiones del objeto ordenadas (para evitar problemas de rotación X/Y) y redondeadas """
    if not obj or obj.type != 'MESH':
        return (0.0, 0.0, 0.0)
    # Redondeamos a milímetros para evitar falsos negativos por micro-diferencias de flotantes
    dims = [round(d, 3) for d in obj.dimensions]
    # Ordenar las dimensiones asume que una pieza de 50x40 es igual a una de 40x50. 
    # Si quieres que la orientación importe estrictamente, quita el sorted()
    dims.sort() 
    return tuple(dims)

def es_nombre_principal(nombre):
    nombre_lower = nombre.lower()
    for ignorar in PALABRAS_IGNORADAS:
        if ignorar in nombre_lower:
            return False
    return True

def determinar_nombre_base(nombres_en_grupo):
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
        return min(candidatos, key=len)
    return "Pieza_Desconocida"

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL OPTIMIZADA V12 ---")
    
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    print(f"Calculando proximidad para {len(mallas)} mallas...")
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        centro_actual = get_mesh_center(actual)
        
        grupo = [actual]
        vecinos_a_remover = []
        for otra in mallas_pendientes:
            centro_otra = get_mesh_center(otra)
            if centro_actual and centro_otra:
                distancia = (centro_actual - centro_otra).length
                if distancia <= UMBRAL_CENTROS:
                    grupo.append(otra)
                    vecinos_a_remover.append(otra)
        
        for vecino in vecinos_a_remover:
            mallas_pendientes.remove(vecino)
            
        grupos_fisicos.append(grupo)

    print(f"Se identificaron {len(grupos_fisicos)} piezas físicas distintas en el espacio.")

    piezas_finales_dict = {}

    for idx, grupo in enumerate(grupos_fisicos):
        nombres_capas = [obj.name.split('.')[0] for obj in grupo]
        nombre_base = determinar_nombre_base(nombres_capas)
        
        es_identica = nombre_base.startswith("_")
        if not es_identica:
            nombre_base = re.sub(r'[\s\-]*\d+$', '', nombre_base).strip()
        else:
            nombre_base = nombre_base[1:].strip()
            
        bpy.ops.object.select_all(action='DESELECT')
        activo = grupo[0]
        for obj in grupo:
            obj.select_set(True)
            if es_nombre_principal(obj.name):
                activo = obj
                
        bpy.context.view_layer.objects.active = activo
        
        if len(grupo) > 1:
            try:
                bpy.ops.object.join()
            except RuntimeError as e:
                print(f"Error uniendo grupo {nombre_base}: {e}")
                continue
        
        obj_unido = bpy.context.view_layer.objects.active
        centro_final = get_mesh_center(obj_unido)
        dims_finales = get_dimensions(obj_unido)
        
        if nombre_base not in piezas_finales_dict:
            piezas_finales_dict[nombre_base] = []
        piezas_finales_dict[nombre_base].append({"obj": obj_unido, "centro": centro_final, "identica": es_identica, "dims": dims_finales})

    print("Unión de mallas completada.")

    print("\n--- APLICANDO NOMENCLATURA ---")
    
    for nombre_base, lista_piezas in piezas_finales_dict.items():
        lista_piezas.sort(key=lambda item: item["centro"].z if item["centro"] else 0)
        
        es_identica = lista_piezas[0]["identica"]
        es_fondo = "fondo" in nombre_base.lower()
        
        # --- LÓGICA ESPECIAL PARA FONDOS ---
        if es_fondo:
            # Agrupar los fondos por dimensiones
            grupos_por_dimension = {}
            for info in lista_piezas:
                dims = info["dims"]
                if dims not in grupos_por_dimension:
                    grupos_por_dimension[dims] = []
                grupos_por_dimension[dims].append(info)
            
            # Si hay diferentes tamaños de fondo, les asignamos sub-nombres (Fondo-1, Fondo-2)
            # para no mezclar fondos de distintos tamaños en el despiece.
            multiples_tamanos = len(grupos_por_dimension) > 1
            
            for index_tamano, (dims, piezas_mismo_tamano) in enumerate(grupos_por_dimension.items()):
                # Determinar el nombre base para este tamaño de fondo
                base_tamano = f"{nombre_base}-{index_tamano+1}" if multiples_tamanos else nombre_base
                
                for info in piezas_mismo_tamano:
                    obj = info["obj"]
                    # Forzamos a que compartan el mismo nombre para que sean idénticas en la plataforma
                    obj.name = base_tamano
                    obj.data.name = base_tamano
                    print(f"✅ Fondo (Dims {dims}) nombrado: {base_tamano} (Malla: {obj.name})")
                    
            continue # Saltar la lógica normal
            
        # --- LÓGICA NORMAL (No Fondos) ---
        for i, info in enumerate(lista_piezas):
            obj = info["obj"]
            
            if NUMERACION_AUTOMATICA and not es_identica:
                nuevo_nombre = f"{nombre_base}-{i+1}"
            else:
                nuevo_nombre = nombre_base
                
            obj.name = nuevo_nombre
            obj.data.name = nuevo_nombre
            print(f"✅ Pieza final nombrada: {nuevo_nombre} (Malla: {obj.name})")

    print("\n✅ SCRIPT V12 FINALIZADO CON ÉXITO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()

import bpy
import re
from mathutils import Vector

# ==========================================
# CONFIGURACIÓN DEL SCRIPT
# ==========================================

NUMERACION_AUTOMATICA = True
UMBRAL_CENTROS = 0.03 
PALABRAS_IGNORADAS = ["mdp", "balance"]
PREFIJO_PADRE = "Pieza "

# Removido "mesh" a petición del usuario. (Él corregirá el origen en Grasshopper)
HERRAJES_KEYWORDS = ["tarugo", "tornillo", "tuerca", "soporte", "puntilla", "grapa", "deslizador", "perfil", "corredera", "bisagra", "caja", "perno"]

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
    if not obj or obj.type != 'MESH':
        return (0.0, 0.0, 0.0)
    dims = [round(d, 3) for d in obj.dimensions]
    dims.sort() 
    return tuple(dims)

def es_nombre_principal(nombre):
    nombre_lower = nombre.lower()
    for ignorar in PALABRAS_IGNORADAS:
        if ignorar in nombre_lower:
            return False
    return True

def es_herraje(nombre_base):
    nombre_lower = nombre_base.lower()
    for kw in HERRAJES_KEYWORDS:
        if kw in nombre_lower:
            return True
    return False

def determinar_nombre_base(nombres_en_grupo):
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
        return min(candidatos, key=len)
    return "Pieza_Desconocida"

def bbox_contains(obj_main, obj_sub, margin=0.01):
    """ Verifica si el obj_sub está completamente contenido dentro del bounding box del obj_main. """
    bb_main = [obj_main.matrix_world @ Vector(corner) for corner in obj_main.bound_box]
    bb_sub = [obj_sub.matrix_world @ Vector(corner) for corner in obj_sub.bound_box]
    
    min_m = Vector((min(v.x for v in bb_main), min(v.y for v in bb_main), min(v.z for v in bb_main)))
    max_m = Vector((max(v.x for v in bb_main), max(v.y for v in bb_main), max(v.z for v in bb_main)))
    
    min_s = Vector((min(v.x for v in bb_sub), min(v.y for v in bb_sub), min(v.z for v in bb_sub)))
    max_s = Vector((max(v.x for v in bb_sub), max(v.y for v in bb_sub), max(v.z for v in bb_sub)))
    
    min_m -= Vector((margin, margin, margin))
    max_m += Vector((margin, margin, margin))
    
    return (min_s.x >= min_m.x and max_s.x <= max_m.x and
            min_s.y >= min_m.y and max_s.y <= max_m.y and
            min_s.z >= min_m.z and max_s.z <= max_m.z)

def should_group(actual, otra):
    n1 = actual.name.split('.')[0].strip()
    n2 = otra.name.split('.')[0].strip()
    
    # REGLA 1: Por distancia de Centros (Núcleo estable de V12 para unir Capas de la misma tabla)
    c1 = get_mesh_center(actual)
    c2 = get_mesh_center(otra)
    if c1 and c2:
        if (c1 - c2).length <= UMBRAL_CENTROS:
            # Prevenir que dos piezas principales distintas (ej. Lateral y Cubierta) se unan
            # si accidentalmente sus centros están cerca.
            if es_nombre_principal(n1) and es_nombre_principal(n2) and n1 != n2:
                return False
            return True
            
    # REGLA 2: Por Contención (Para atrapar fragmentos rotos o recortes como el círculo de MDP)
    # Si tienen el mismo nombre base (ej. Frente y Frente.001) y uno está contenido físicamente en el otro.
    if n1 == n2:
        if bbox_contains(actual, otra) or bbox_contains(otra, actual):
            return True
            
    return False

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL V16 (AVANZADA) ---")
    
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        
        # NORMA DE HERRAJES: Si es herraje, ignora la cohesión con otros
        nombre_actual = actual.name.split('.')[0]
        if es_herraje(nombre_actual):
            grupos_fisicos.append([actual])
            continue
            
        grupo = [actual]
        vecinos_a_remover = []
        for otra in mallas_pendientes:
            nombre_otra = otra.name.split('.')[0]
            
            if es_herraje(nombre_otra):
                continue
                
            # APLICAMOS LA LÓGICA DE UNIÓN AVANZADA
            if should_group(actual, otra):
                grupo.append(otra)
                vecinos_a_remover.append(otra)
        
        for vecino in vecinos_a_remover:
            mallas_pendientes.remove(vecino)
            
        grupos_fisicos.append(grupo)

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

    print("\n--- APLICANDO NOMENCLATURA INTELIGENTE ---")
    
    contador_global = 1
    
    for nombre_base, lista_piezas in piezas_finales_dict.items():
        lista_piezas.sort(key=lambda item: item["centro"].z if item["centro"] else 0)
        es_identica = lista_piezas[0]["identica"]
        
        modo_herraje = es_herraje(nombre_base)
        
        for i, info in enumerate(lista_piezas):
            obj = info["obj"]
            
            if NUMERACION_AUTOMATICA and not es_identica:
                nombre_logico = f"{nombre_base}-{i+1}"
            else:
                nombre_logico = nombre_base
                
            if modo_herraje:
                obj.name = nombre_logico
                obj.data.name = nombre_logico
                print(f"🔩 Herraje - Padre: {obj.name} | Hijo: {obj.data.name}")
            else:
                obj.name = f"{PREFIJO_PADRE}{contador_global:02d}"
                obj.data.name = nombre_logico
                print(f"🪵 Lámina  - Padre: {obj.name} | Hijo: {obj.data.name}")
                contador_global += 1

    print("\n✅ SCRIPT V16 FINALIZADO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()

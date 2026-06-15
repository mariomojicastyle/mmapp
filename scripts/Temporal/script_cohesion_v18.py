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
    # Prioridad 1: Herrajes
    herrajes = [n for n in nombres_en_grupo if es_herraje(n)]
    if herrajes:
        return min(herrajes, key=len)
        
    # Prioridad 2: Piezas principales
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
        return min(candidatos, key=len)
        
    return "Pieza_Desconocida"

def bbox_overlap(obj1, obj2, margin=0.01):
    bb1 = [obj1.matrix_world @ Vector(corner) for corner in obj1.bound_box]
    bb2 = [obj2.matrix_world @ Vector(corner) for corner in obj2.bound_box]
    
    min1 = Vector((min(v.x for v in bb1), min(v.y for v in bb1), min(v.z for v in bb1)))
    max1 = Vector((max(v.x for v in bb1), max(v.y for v in bb1), max(v.z for v in bb1)))
    
    min2 = Vector((min(v.x for v in bb2), min(v.y for v in bb2), min(v.z for v in bb2)))
    max2 = Vector((max(v.x for v in bb2), max(v.y for v in bb2), max(v.z for v in bb2)))
    
    min1 -= Vector((margin, margin, margin))
    max1 += Vector((margin, margin, margin))
    
    return (min1.x <= max2.x and max1.x >= min2.x and
            min1.y <= max2.y and max1.y >= min2.y and
            min1.z <= max2.z and max1.z >= min2.z)

def bbox_contains(obj_main, obj_sub, margin=0.01):
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
    
    # REGLA 1: Por distancia de Centros (Núcleo estable de V12)
    c1 = get_mesh_center(actual)
    c2 = get_mesh_center(otra)
    if c1 and c2:
        if (c1 - c2).length <= UMBRAL_CENTROS:
            if es_nombre_principal(n1) and es_nombre_principal(n2) and n1 != n2:
                return False
            return True
            
    # REGLA 2: Por Contención Geométrica Total
    # Si un objeto está físicamente dentro de la caja virtual del otro, se unen.
    # No importa si tienen nombres distintos (ej. "Frente de cajon" y "MDP").
    # Esto garantiza atrapar huecos circulares y fragmentos rotos.
    if bbox_contains(actual, otra, margin=0.01) or bbox_contains(otra, actual, margin=0.01):
        return True
            
    return False

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL V18 (MÁXIMA PRECISIÓN) ---")
    
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    # ---------------------------------------------------------
    # FASE 1: RECONSTRUCCIÓN DE HERRAJES
    # ---------------------------------------------------------
    herrajes_iniciales = [m for m in mallas_pendientes if es_herraje(m.name.split('.')[0])]
    for actual in herrajes_iniciales:
        if actual not in mallas_pendientes:
            continue
            
        mallas_pendientes.remove(actual)
        grupo = [actual]
        vecinos_a_remover = []
        nombre_base_actual = actual.name.split('.')[0].strip()
        
        for otra in mallas_pendientes:
            nombre_otra = otra.name.split('.')[0].strip().lower()
            if nombre_otra.startswith("mesh") or otra.name.split('.')[0].strip() == nombre_base_actual:
                if bbox_overlap(actual, otra, margin=0.02):
                    grupo.append(otra)
                    vecinos_a_remover.append(otra)
                    
        for v in vecinos_a_remover:
            mallas_pendientes.remove(v)
            
        grupos_fisicos.append(grupo)

    # ---------------------------------------------------------
    # FASE 2: COHESIÓN DE LÁMINAS DE MADERA
    # ---------------------------------------------------------
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        grupo = [actual]
        vecinos_a_remover = []
        
        for otra in mallas_pendientes:
            if should_group(actual, otra):
                grupo.append(otra)
                vecinos_a_remover.append(otra)
        
        for vecino in vecinos_a_remover:
            mallas_pendientes.remove(vecino)
            
        grupos_fisicos.append(grupo)

    # ---------------------------------------------------------
    # FASE 3: FUSIÓN Y NOMENCLATURA
    # ---------------------------------------------------------
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

    print("\n✅ SCRIPT V18 FINALIZADO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()

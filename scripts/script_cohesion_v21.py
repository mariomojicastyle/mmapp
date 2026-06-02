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
    herrajes = [n for n in nombres_en_grupo if es_herraje(n)]
    if herrajes:
        return min(herrajes, key=len)
        
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

def bbox_combined_dimensions(obj1, obj2):
    bb1 = [obj1.matrix_world @ Vector(corner) for corner in obj1.bound_box]
    bb2 = [obj2.matrix_world @ Vector(corner) for corner in obj2.bound_box]
    
    all_corners = bb1 + bb2
    min_v = Vector((min(v.x for v in all_corners), min(v.y for v in all_corners), min(v.z for v in all_corners)))
    max_v = Vector((max(v.x for v in all_corners), max(v.y for v in all_corners), max(v.z for v in all_corners)))
    
    dims = max_v - min_v
    return tuple(sorted([dims.x, dims.y, dims.z]))

def forman_paralelepipedo(obj1, obj2):
    """
    Evalúa si la unión de dos piezas da como resultado una lámina plana PURA.
    """
    dim_comb = bbox_combined_dimensions(obj1, obj2)
    dim1 = tuple(sorted(obj1.dimensions))
    dim2 = tuple(sorted(obj2.dimensions))
    
    # 1. TOLERANCIA ESTRICTA DE GROSOR: 
    # El grosor combinado no puede crecer más de 5 MILÍMETROS respecto a la pieza original.
    # Esto asegura que el Círculo solo se una a la Puerta (con la que está a ras, crecimiento 0mm)
    # y jamás se una al Lateral (con el que tiene un desfase que engrosaría la pieza a más de 30mm).
    max_grosor_original = max(dim1[0], dim2[0])
    if dim_comb[0] > max_grosor_original + 0.005: 
        return False
        
    # 2. Las dimensiones de Largo y Ancho deben mantenerse iguales a la pieza base
    def match_2_largest(d_main, d_test):
        return (abs(d_main[1] - d_test[1]) <= 0.02 and 
                abs(d_main[2] - d_test[2]) <= 0.02)
                
    return match_2_largest(dim_comb, dim1) or match_2_largest(dim_comb, dim2)

def should_group(actual, otra):
    n1 = actual.name.split('.')[0].strip()
    n2 = otra.name.split('.')[0].strip()
    
    # REGLA 1: Por distancia de Centros
    c1 = get_mesh_center(actual)
    c2 = get_mesh_center(otra)
    if c1 and c2:
        if (c1 - c2).length <= UMBRAL_CENTROS:
            if es_nombre_principal(n1) and es_nombre_principal(n2) and n1 != n2:
                return False
            return True
            
    # REGLA 2: "Norma del Paralelepípedo de Ejes Paralelos"
    # Margen de 3cm para detectar contacto, pero protegido por la estricta tolerancia de grosor.
    if bbox_overlap(actual, otra, margin=0.03):
        if forman_paralelepipedo(actual, otra):
            return True
            
    return False

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL V21 (EJES PARALELOS ESTRICTOS) ---")
    
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

    print("\n✅ SCRIPT V21 FINALIZADO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()

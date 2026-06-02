import bpy
import re
from mathutils import Vector

# ==========================================
# CONFIGURACIÓN DEL SCRIPT
# ==========================================

NUMERACION_AUTOMATICA = True
# AUMENTAMOS EL UMBRAL A 0.03 (3cm) PARA QUE EL MDP DE LA CUBIERTA ALCANCE A UNIRSE
UMBRAL_CENTROS = 0.03 
PALABRAS_IGNORADAS = ["mdp", "balance"]
PREFIJO_PADRE = "Pieza "

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

def determinar_nombre_base(nombres_en_grupo):
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
        return min(candidatos, key=len)
    return "Pieza_Desconocida"

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL (PASO 1 V13) ---")
    
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    # LÍNEA QUE GENERABA LA FALLA (El Umbral):
    # En V12 el umbral era 0.02. Para la mayoría de piezas era suficiente, pero para
    # piezas más gruesas o separadas (como la Cubierta), 2cm se quedaba corto y dejaba el MDP separado.
    # Al aumentar a 0.03, garantizamos que las piezas gruesas se agrupen bien.
    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        centro_actual = get_mesh_center(actual)
        
        grupo = [actual]
        vecinos_a_remover = []
        for otra in mallas_pendientes:
            centro_otra = get_mesh_center(otra)
            if centro_actual and centro_otra:
                # AQUÍ OCURRE LA MAGIA GEOMÉTRICA
                distancia = (centro_actual - centro_otra).length
                if distancia <= UMBRAL_CENTROS:
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

    print("\n--- APLICANDO NOMENCLATURA GLOBAL ---")
    
    contador_global = 1
    
    for nombre_base, lista_piezas in piezas_finales_dict.items():
        lista_piezas.sort(key=lambda item: item["centro"].z if item["centro"] else 0)
        es_identica = lista_piezas[0]["identica"]
        
        for i, info in enumerate(lista_piezas):
            obj = info["obj"]
            
            # Padre: Secuencia Global
            obj.name = f"{PREFIJO_PADRE}{contador_global:02d}"
            
            # Hijo: Nombre Lógico Base
            if NUMERACION_AUTOMATICA and not es_identica:
                nombre_hijo = f"{nombre_base}-{i+1}"
            else:
                nombre_hijo = nombre_base
                
            obj.data.name = nombre_hijo
            
            print(f"✅ Nombrado - Padre: {obj.name} | Hijo: {obj.data.name}")
            contador_global += 1

    print("\n✅ SCRIPT V13 (PASO 1 AJUSTADO) FINALIZADO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()

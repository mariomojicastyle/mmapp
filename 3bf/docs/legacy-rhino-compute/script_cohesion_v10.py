import bpy
from mathutils import Vector

# ==========================================
# CONFIGURACIÓN DEL SCRIPT
# ==========================================

# MODO_NOMBRADO:
# False -> Solo une las piezas (cohesión) y las nombra con su nombre base, sin numerarlas iterativamente. Útil si quieres renombrarlas a mano luego.
# True -> Une y numera secuencialmente (ej. Posterior de cajon-1, Posterior de cajon-2).
NUMERACION_AUTOMATICA = True

# UMBRAL_CENTROS: 
# Distancia máxima en metros entre los centros geométricos para considerar que varias mallas son capas de LA MISMA PIEZA.
# 0.02 = 2 centímetros. Es perfecto porque el balance y la cara principal están a milímetros del núcleo.
UMBRAL_CENTROS = 0.02 

# PALABRAS A IGNORAR PARA EL NOMBRE FINAL
# Estas palabras se descartan al decidir cómo se llamará la pieza unida.
PALABRAS_IGNORADAS = ["mdp", "balance"]


# ==========================================
# FUNCIONES DE UTILIDAD
# ==========================================

def get_mesh_center(obj):
    """ Calcula el centro geométrico de la malla basado en su Bounding Box global. """
    if not obj or obj.type != 'MESH':
        return None
    # Usamos los 8 puntos del bounding box en coordenadas globales
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox_corners, Vector()) / 8.0
    return center

def es_nombre_principal(nombre):
    """ Evalúa si el nombre es el principal (no es MDP ni contiene balance). """
    nombre_lower = nombre.lower()
    for ignorar in PALABRAS_IGNORADAS:
        if ignorar in nombre_lower:
            return False
    return True

def determinar_nombre_base(nombres_en_grupo):
    """ De una lista de nombres de capas, deduce el nombre principal del mueble. """
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
         # Si hay varios válidos (ej. si vinieran duplicados), tomamos el más corto por seguridad
        return min(candidatos, key=len)
    
    # Fallback: si por alguna razón todo se ignoró (ej. un grupo que solo tiene MDP)
    return "Pieza_Desconocida"

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL OPTIMIZADA ---")
    
    # 1. Obtener todos los objetos malla visibles y deseleccionarlos
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    # 2. Agrupación por Centros Geométricos (Clustering Espacial)
    # Ya no medimos vértice a vértice, sino el centro del Bounding Box.
    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    print(f"Calculando proximidad para {len(mallas)} mallas...")
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        centro_actual = get_mesh_center(actual)
        
        # Iniciar un nuevo grupo físico
        grupo = [actual]
        
        # Buscar qué otras mallas tienen su centro casi en el mismo punto
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

    # 3. Fusión y Deducción de Nombres
    piezas_finales_dict = {} # Diccionario para agrupar por nombre base y luego numerar

    for idx, grupo in enumerate(grupos_fisicos):
        nombres_capas = [obj.name.split('.')[0] for obj in grupo] # Limpiamos sufijos .001 de Blender
        nombre_base = determinar_nombre_base(nombres_capas)
        
        # Seleccionar para unir
        bpy.ops.object.select_all(action='DESELECT')
        activo = grupo[0]
        for obj in grupo:
            obj.select_set(True)
            # Preferimos que el objeto activo sea el de la cara principal si es posible
            if es_nombre_principal(obj.name):
                activo = obj
                
        bpy.context.view_layer.objects.active = activo
        
        # Unir las mallas
        if len(grupo) > 1:
            try:
                bpy.ops.object.join()
            except RuntimeError as e:
                print(f"Error uniendo grupo {nombre_base}: {e}")
                continue
        
        obj_unido = bpy.context.view_layer.objects.active
        centro_final = get_mesh_center(obj_unido)
        
        # Guardar en el diccionario para la etapa final de nombrado
        if nombre_base not in piezas_finales_dict:
            piezas_finales_dict[nombre_base] = []
        piezas_finales_dict[nombre_base].append({"obj": obj_unido, "centro": centro_final})

    print("Unión de mallas completada.")

    # 4. Nomenclatura Ordenada (El Mejor de los Dos Mundos)
    print("\n--- APLICANDO NOMENCLATURA ---")
    
    for nombre_base, lista_piezas in piezas_finales_dict.items():
        # Ordenamos las piezas físicamente en el eje Z (de abajo hacia arriba)
        # Si quisieras otro orden, puedes cambiar 'centro.z' por 'centro.x'
        lista_piezas.sort(key=lambda item: item["centro"].z if item["centro"] else 0)
        
        # Verificar el indicador "_" al inicio (Piezas Idénticas)
        es_identica = nombre_base.startswith("_")
        # Quitamos el guion bajo inicial para dejar el nombre limpio, o lo dejamos si lo prefieres.
        # Aquí lo quitamos para que quede "Pieza 02" en vez de "_Pieza 02"
        nombre_limpio = nombre_base[1:].strip() if es_identica else nombre_base
        
        for i, info in enumerate(lista_piezas):
            obj = info["obj"]
            
            # Si tiene el indicador "_", ignoramos la numeración iterativa
            if NUMERACION_AUTOMATICA and not es_identica:
                nuevo_nombre = f"{nombre_limpio}-{i+1}"
            else:
                # Al dejar el mismo nombre en el bucle, Blender le pondrá .001, .002 automáticamente
                nuevo_nombre = nombre_limpio
                
            obj.name = nuevo_nombre
            obj.data.name = nuevo_nombre
            print(f"✅ Pieza final nombrada: {nuevo_nombre} (Malla: {obj.name})")

    print("\n✅ SCRIPT FINALIZADO CON ÉXITO.")
    bpy.ops.object.select_all(action='DESELECT')

# Ejecutar el proceso
ejecutar_cohesion()

import bpy
import math
import mathutils
import os

def analyze_rigidity(emitter_prefix="Plane"):
    """
    Script de diagnóstico para analizar si las piezas 'Peça 06' y 'Peça 07'
    se comportan como un sólido rígido durante la animación.
    
    Analiza a través del rango de frames:
    1. La distancia entre Peça 06 y Peça 07 (debe ser constante).
    2. La desviación angular entre sus ejes locales (deben mantenerse paralelas).
    3. La distancia de cada una al centro de giro (Peça 10).
    
    Puede ejecutarse en dos estados:
    - Estado Procedural: Con los Geometry Nodes activos.
    - Estado Horneado: Después de correr el script de bake.
    """
    scene = bpy.context.scene
    start_frame = scene.frame_start
    end_frame = scene.frame_end
    
    # Intentar obtener los objetos reales
    obj_06 = bpy.data.objects.get("Peça 06")
    obj_07 = bpy.data.objects.get("Peça 07")
    obj_10 = bpy.data.objects.get("Peça 10")
    
    # Verificar si estamos analizando Geometry Nodes (evaluados) o animación horneada
    emitter_objs = [obj for obj in bpy.data.objects if obj.name.startswith(emitter_prefix)]
    has_active_gn = False
    if emitter_objs:
        for emitter in emitter_objs:
            for mod in emitter.modifiers:
                if mod.type == 'NODES' and mod.show_viewport:
                    has_active_gn = True
                    break
                    
    print(f"\n==================================================")
    print(f"ANÁLISIS DE RIGIDEZ Y DESVIACIÓN")
    print(f"Modo detectado: {'PROCEDURAL (Geometry Nodes Activo)' if has_active_gn else 'HORNEADO (Animación Directa)'}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    if not has_active_gn and (not obj_06 or not obj_07):
        print("ERROR: No se encontraron los objetos 'Peça 06' o 'Peça 07' en la escena para análisis horneado.")
        return
        
    log_data = []
    
    # Guardar el frame actual para restaurarlo al final
    original_frame = scene.frame_current
    
    try:
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            mat_06 = None
            mat_07 = None
            mat_10 = None
            
            if has_active_gn:
                # Buscar transformaciones en el Depsgraph (instancias evaluadas de Geometry Nodes)
                depsgraph = bpy.context.evaluated_depsgraph_get()
                eval_emitters = [o.evaluated_get(depsgraph) for o in emitter_objs]
                
                for inst in depsgraph.object_instances:
                    if inst.is_instance and inst.parent in eval_emitters:
                        orig = inst.object.original
                        if orig.name == "Peça 06":
                            mat_06 = inst.matrix_world.copy()
                        elif orig.name == "Peça 07":
                            mat_07 = inst.matrix_world.copy()
                        elif orig.name == "Peça 10":
                            mat_10 = inst.matrix_world.copy()
            else:
                # Leer transformaciones directamente de los objetos horneados
                if obj_06:
                    mat_06 = obj_06.matrix_world.copy()
                if obj_07:
                    mat_07 = obj_07.matrix_world.copy()
                if obj_10:
                    mat_10 = obj_10.matrix_world.copy()
            
            if mat_06 is None or mat_07 is None:
                continue
                
            # 1. Extraer posiciones globales
            pos_06 = mat_06.translation
            pos_07 = mat_07.translation
            pos_10 = mat_10.translation if mat_10 else None
            
            # 2. Calcular distancia entre laterales
            dist_06_07 = (pos_06 - pos_07).length
            
            # 3. Calcular distancias relativas a Peça 10 (centro/pivote)
            dist_06_10 = (pos_06 - pos_10).length if pos_10 else 0.0
            dist_07_10 = (pos_07 - pos_10).length if pos_10 else 0.0
            
            # 4. Calcular desviación angular (usando el eje Z local de las piezas)
            # En la matriz 3x3 de rotación, la columna 2 es el eje Z local
            z_axis_06 = mat_06.to_3x3().col[2].normalized()
            z_axis_07 = mat_07.to_3x3().col[2].normalized()
            
            # Calcular el ángulo entre los dos ejes locales Z
            dot_prod = max(-1.0, min(1.0, z_axis_06.dot(z_axis_07)))
            angle_rad = math.acos(dot_prod)
            angle_deg = math.degrees(angle_rad)
            
            # Si el ángulo es cercano a 180° (debido a espejado por rotación en edit mode),
            # calculamos la desviación respecto a ser perfectamente opuestas/paralelas
            dev_angle = min(angle_deg, abs(180.0 - angle_deg))
            
            log_data.append({
                'frame': frame,
                'dist_06_07': dist_06_07,
                'dist_06_10': dist_06_10,
                'dist_07_10': dist_07_10,
                'dev_angle': dev_angle,
                'pos_06': pos_06.copy(),
                'pos_07': pos_07.copy()
            })
            
        if not log_data:
            print("ERROR: No se pudieron capturar datos de animación para las piezas indicadas.")
            return
            
        # Analizar fluctuaciones
        distances = [d['dist_06_07'] for d in log_data]
        min_dist = min(distances)
        max_dist = max(distances)
        var_dist = max_dist - min_dist
        
        dev_angles = [d['dev_angle'] for d in log_data]
        max_dev_angle = max(dev_angles)
        
        print("\n--- REPORTE DETALLADO POR FRAME ---")
        print(f"{'Frame':<8} | {'Dist 06-07 (m)':<15} | {'Var Dist (mm)':<13} | {'Desv Ángulo (°)':<15} | {'Dist a P10 (L/R) (m)':<25}")
        print("-" * 85)
        
        ref_dist = log_data[0]['dist_06_07'] # Distancia de referencia inicial
        
        for d in log_data:
            frame = d['frame']
            dist = d['dist_06_07']
            var_mm = (dist - ref_dist) * 1000.0 # Variación en milímetros respecto a la referencia
            angle = d['dev_angle']
            p10_info = f"{d['dist_06_10']:.4f} / {d['dist_07_10']:.4f}" if obj_10 else "N/A"
            
            # Resaltar si hay desviación significativa (> 0.5mm o > 0.1 grados)
            warning = ""
            if abs(var_mm) > 0.5 or angle > 0.1:
                warning = " <-- ¡DESALINEADO!"
                
            print(f"{frame:<8} | {dist:<15.5f} | {var_mm:<13.2f} | {angle:<15.4f} | {p10_info:<25} {warning}")
            
        print("-" * 85)
        print("\n--- RESUMEN FINAL ---")
        print(f"Variación total de distancia entre laterales: {var_dist * 1000.0:.3f} mm")
        print(f"Máxima desviación angular (paralelismo): {max_dev_angle:.4f}°")
        
        if var_dist * 1000.0 > 1.0 or max_dev_angle > 0.2:
            print("\n❌ VERDICTO: El sistema NO se comporta como un cuerpo rígido. Hay desalineación física detectable.")
        else:
            print("\n✅ VERDICTO: El sistema se comporta como un cuerpo rígido perfecto. No hay desalineación en Blender.")
            
    finally:
        scene.frame_set(original_frame)
        print(f"==================================================\n")

if __name__ == "__main__":
    analyze_rigidity(emitter_prefix="Plane")

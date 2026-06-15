import bpy
import os

def debug_instances():
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    log_path = r"C:\Desarrollo\mmapp\scripts\debug_log.txt"
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("=== DEBUG: LISTANDO TODAS LAS INSTANCIAS EN EL DEPSGRAPH ===\n")
        f.write(f"Rango de frames: {scene.frame_start} a {scene.frame_end}\n")
        f.write(f"Frame actual: {scene.frame_current}\n\n")
        
        f.write("Objetos en bpy.data.objects:\n")
        for obj in bpy.data.objects:
            f.write(f" - {obj.name} (tipo: {obj.type}, visible: {not obj.hide_viewport})\n")
        f.write("\n")
        
        count = 0
        for inst in depsgraph.object_instances:
            count += 1
            is_inst = inst.is_instance
            p_name = inst.parent.name if inst.parent else "None"
            p_orig_name = inst.parent.original.name if (inst.parent and inst.parent.original) else "None"
            obj_name = inst.object.name if inst.object else "None"
            obj_orig_name = inst.object.original.name if (inst.object and inst.object.original) else "None"
            
            f.write(f"Instancia #{count}:\n")
            f.write(f"  - is_instance: {is_inst}\n")
            f.write(f"  - Objeto Evaluado: {obj_name}\n")
            f.write(f"  - Objeto Original: {obj_orig_name}\n")
            f.write(f"  - Parent Evaluado: {p_name}\n")
            f.write(f"  - Parent Original: {p_orig_name}\n")
            f.write(f"  - Matrix Translation: {inst.matrix_world.to_translation()}\n\n")
            
        f.write(f"Total de instancias encontradas en object_instances: {count}\n")
        
    print(f"Log de depuración guardado con éxito en: {log_path}")

if __name__ == "__main__":
    debug_instances()

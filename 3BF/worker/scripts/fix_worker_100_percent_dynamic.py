import re

def fix_worker_pure_dynamic():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Sustituir la lógica de duplicación fija por posicionamiento 100% dinámico desde Rhino 8
    dynamic_duplicate_logic = """
        # Obtener las posiciones Y reales calculadas dinámicamente por Rhino 8 desde las piezas contenedoras
        tapa_luz_y_positions = []
        lat_izq_cajon_y_positions = []

        for m in real_meshes:
            if "Tapa Luz" in m["name"]:
                tapa_luz_y_positions.append(m["position"][1])
            elif "Lateral Izq Cajon" in m["name"]:
                lat_izq_cajon_y_positions.append(m["position"][1])

        tapa_luz_y_positions.sort(reverse=True)
        lat_izq_cajon_y_positions.sort(reverse=True)

        final_meshes = []
        for m in real_meshes:
            if "Frente de Cajon" in m["name"]:
                if tapa_luz_y_positions:
                    # Generar los 3 frentes usando las posiciones Y dinámicas devueltas por Rhino 8
                    offset_frente = m["position"][1] - tapa_luz_y_positions[0]
                    for y_tapa in tapa_luz_y_positions:
                        m_copy = dict(m)
                        m_copy["position"] = [m["position"][0], y_tapa + offset_frente, m["position"][2]]
                        final_meshes.append(m_copy)
                else:
                    final_meshes.append(m)
            elif "Lateral Der Cajon" in m["name"]:
                if lat_izq_cajon_y_positions:
                    # Generar los 3 laterales derechos sincronizados dinámicamente con los izquierdos
                    for y_lat in lat_izq_cajon_y_positions:
                        m_copy = dict(m)
                        m_copy["position"] = [m["position"][0], y_lat, m["position"][2]]
                        final_meshes.append(m_copy)
                else:
                    final_meshes.append(m)
            else:
                final_meshes.append(m)

        real_meshes = final_meshes
"""

    start_str = "# Duplicar Frentes de Cajón y Laterales Der Cajón"
    if start_str in code:
        idx_start = code.find(start_str)
        idx_end = code.find("return JSONResponse(content={", idx_start)
        code = code[:idx_start] + dynamic_duplicate_logic + "\n    " + code[idx_end:]
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py actualizado con posicionamiento 100% dinámico derivado de Rhino 8.")

if __name__ == "__main__":
    fix_worker_pure_dynamic()

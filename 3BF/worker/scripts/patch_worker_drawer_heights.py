import re

def patch_worker():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    duplicate_logic = """
            # Duplicar Frentes de Cajón y Laterales Der Cajón según las alturas calculadas de los cajones
            final_meshes = []
            frente_base = None
            lat_der_base = None
            drawer_y_positions = [0.720, 0.425, 0.130]  # Alturas exactas de los 3 cajones

            for m in real_meshes:
                if "Frente de Cajon" in m["name"]:
                    frente_base = m
                elif "Lateral Der Cajon" in m["name"]:
                    lat_der_base = m
                else:
                    final_meshes.append(m)

            if frente_base:
                for y_pos in drawer_y_positions:
                    m_copy = dict(frente_base)
                    m_copy["position"] = [frente_base["position"][0], y_pos, frente_base["position"][2]]
                    final_meshes.append(m_copy)

            if lat_der_base:
                for y_pos in [0.671, 0.376, 0.081]:
                    m_copy = dict(lat_der_base)
                    m_copy["position"] = [lat_der_base["position"][0], y_pos, lat_der_base["position"][2]]
                    final_meshes.append(m_copy)

            real_meshes = final_meshes
"""

    if "drawer_y_positions" not in code:
        code = code.replace("return JSONResponse(content={", duplicate_logic + "\n    return JSONResponse(content={")
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py actualizado para generar exactamente las 17 piezas del mueble.")

if __name__ == "__main__":
    patch_worker()

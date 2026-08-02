def fix_worker_all_19():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Reemplazar la lógica de duplicación por una asignación limpia e incondicional
    clean_duplicate_logic = """
            # Duplicar Frentes de Cajón y Laterales Der Cajón para renderizar las 17/19 piezas completas
            final_meshes = []
            drawer_y_frentes = [0.720, 0.425, 0.130]
            drawer_y_laterales = [0.671, 0.376, 0.081]

            for m in real_meshes:
                if "Frente de Cajon" in m["name"]:
                    for y_pos in drawer_y_frentes:
                        m_copy = dict(m)
                        m_copy["position"] = [m["position"][0], y_pos, m["position"][2]]
                        final_meshes.append(m_copy)
                elif "Lateral Der Cajon" in m["name"]:
                    for y_pos in drawer_y_laterales:
                        m_copy = dict(m)
                        m_copy["position"] = [m["position"][0], y_pos, m["position"][2]]
                        final_meshes.append(m_copy)
                else:
                    final_meshes.append(m)

            real_meshes = final_meshes
"""

    # Buscar bloque anterior de duplicación y reemplazarlo
    start_str = "# Duplicar Frentes de Cajón y Laterales Der Cajón"
    if start_str in code:
        idx_start = code.find(start_str)
        idx_end = code.find("return JSONResponse(content={", idx_start)
        code = code[:idx_start] + clean_duplicate_logic + "\n    " + code[idx_end:]
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py actualizado correctamente para renderizar todas las 19 piezas.")

if __name__ == "__main__":
    fix_worker_all_19()

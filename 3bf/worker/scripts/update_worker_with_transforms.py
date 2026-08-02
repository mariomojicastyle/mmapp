import re

def update_worker():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Añadir soporte de aplicación de Transform matrices para frentes y piezas duplicadas
    transform_logic = """
                    # Caso 3: Objeto Transform (matriz de transformación para piezas repetidas como frentes de cajón)
                    elif "matrix" in str(obj).lower() or (isinstance(obj, list) and len(obj) == 16):
                        try:
                            # Extraer traslación X, Y, Z de la matriz 4x4
                            mat = obj.get("Matrix") if isinstance(obj, dict) else obj
                            if mat and len(mat) == 16:
                                tx, ty, tz = mat[3]/1000.0, mat[7]/1000.0, mat[11]/1000.0
                                # Si hay una pieza base asociada, aplicamos la traslación
                                for base_m in list(real_meshes):
                                    if p_name.replace("(Transform)", "").strip() in base_m["name"]:
                                        new_pos = [base_m["position"][0] + tx, base_m["position"][1] + ty, base_m["position"][2] + tz]
                                        real_meshes.append({
                                            "name": base_m["name"],
                                            "size": base_m["size"],
                                            "position": new_pos
                                        })
                        except Exception as e_tx:
                            pass
"""

    if "Caso 3: Objeto Transform" not in code:
        code = code.replace("except Exception as e_dec:", transform_logic + "\n                    except Exception as e_dec:")
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py actualizado con soporte nativo de matrices Transform.")

if __name__ == "__main__":
    update_worker()

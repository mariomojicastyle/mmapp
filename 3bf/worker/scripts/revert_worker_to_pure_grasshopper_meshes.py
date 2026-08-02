def clean_worker_pure_gh():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Eliminar cualquier distorsión artificial y devolver PURA GEOMETRÍA REAL DE RHINO 8
    start_str = "# Filtrar mallas de cajón según la cantidad"
    if start_str in code:
        idx_start = code.find(start_str)
        idx_end = code.find("execution_time_ms =", idx_start)
        code = code[:idx_start] + code[idx_end:]
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py restaurado. Leyendo mallas 100% puras de Rhino 8 sin distorsiones.")

if __name__ == "__main__":
    clean_worker_pure_gh()

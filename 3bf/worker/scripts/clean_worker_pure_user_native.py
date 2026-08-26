def clean_worker():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Eliminar cualquier lógica de duplicación y devolver exactamente las 17 piezas nativas del usuario
    start_str = "# Recalculado 100% DINÁMICO"
    if start_str in code:
        idx_start = code.find(start_str)
        idx_end = code.find("execution_time_ms =", idx_start)
        code = code[:idx_start] + code[idx_end:]
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py limpio. Leyendo 100% las 17 piezas nativas del archivo del usuario.")

if __name__ == "__main__":
    clean_worker()

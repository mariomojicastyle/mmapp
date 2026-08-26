import re

def fix_parameter_binding():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. Actualizar ComputeParams para soportar el sub-objeto parameters de Next.js
    old_class = """class ComputeParams(BaseModel):
    model_id: str = "Cajon_Experimento_Viktor"
    ancho: float = 1200.0
    alto: float = 800.0
    profundidad: float = 400.0
    cant_cajones: int = 3
    apertura_mm: float = 0.0"""

    new_class = """class ComputeParams(BaseModel):
    model_id: str = "Cajon_Experimento_Viktor"
    ancho: float = 1200.0
    alto: float = 800.0
    profundidad: float = 400.0
    cant_cajones: int = 3
    apertura_mm: float = 0.0
    parameters: dict = {}"""

    # 2. Extraer parámetros dinámicamente desde parameters o nivel superior
    old_extract = """    ancho = params.ancho
    alto = params.alto
    prof = params.profundidad
    cant_cajones = params.cant_cajones
    apertura_mm = params.apertura_mm"""

    new_extract = """    p = params.parameters or {}
    ancho = float(p.get("ancho", params.ancho))
    alto = float(p.get("alto", params.alto))
    prof = float(p.get("profundidad", params.profundidad))
    cant_cajones = int(p.get("cant_cajones", params.cant_cajones))
    apertura_mm = float(p.get("apertura_cajones", p.get("apertura_mm", params.apertura_mm)))
    print(f"[3BF Worker] Parámetros extraídos de la web -> Ancho:{ancho}, Alto:{alto}, Profundidad:{prof}, Cajones:{cant_cajones}, Apertura:{apertura_mm}", flush=True)"""

    code = code.replace(old_class, new_class)
    code = code.replace(old_extract, new_extract)

    with open(worker_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("  [OK] 3bf_worker.py actualizado para vincular correctamente todos los sliders de la interfaz web.")

if __name__ == "__main__":
    fix_parameter_binding()

def update_worker_inputs():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Reemplazar payload_rc para enviar variantes de nombres de entradas de sliders
    old_payload = """            payload_rc = {
                "algo": b64_algo,
                "pointer": None,
                "values": [
                    {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
                    {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
                    {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                    {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(cant_cajones))}]}},
                    {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}}
                ]
            }"""

    new_payload = """            payload_rc = {
                "algo": b64_algo,
                "pointer": None,
                "values": [
                    {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
                    {"ParamName": "Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
                    {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
                    {"ParamName": "Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
                    {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                    {"ParamName": "Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                    {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(cant_cajones))}]}},
                    {"ParamName": "RH_IN:Cantidad de Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(cant_cajones))}]}},
                    {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}},
                    {"ParamName": "RH_IN:Abrir cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}}
                ]
            }"""

    code = code.replace(old_payload, new_payload)

    with open(worker_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("  [OK] 3bf_worker.py actualizado con mapeo flexible de sliders.")

if __name__ == "__main__":
    update_worker_inputs()

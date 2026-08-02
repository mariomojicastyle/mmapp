import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import rhino3dm
import os

# Configurar servidor local de RhinoCompute (Rhino 8)
compute_rhino3d.Util.url = "http://localhost:5000/"

def evaluate_gh_file(gh_filepath, params_dict):
    print(f"=== Enviando .gh real a Rhino 8 RhinoCompute (http://localhost:5000) ===")
    print(f"Archivo: {gh_filepath}")
    
    if not os.path.exists(gh_filepath):
        print("Error: Archivo no encontrado.")
        return

    try:
        trees = []
        for name, value in params_dict.items():
            param_tree = gh.DataTree(name)
            param_tree.Append([0], [str(value)])
            trees.append(param_tree)
            
        print(f"Parametros enviados a Rhino 8: {params_dict}")
        result = gh.EvaluateDefinition(gh_filepath, trees)
        print("[Rhino 8 Success] Respuesta obtenida de RhinoCompute:")
        if result and "values" in result:
            print(f"Se recibieron {len(result['values'])} salidas resultantes de Grasshopper:")
            for val in result["values"]:
                param_name = val.get("ParamName", "Desconocido")
                inner_tree = val.get("InnerTree", {})
                print(f"  * Output Name: '{param_name}' | Elementos en DataTree: {len(inner_tree)}")
        else:
            print(result)
        return result
    except Exception as e:
        print(f"Error al evaluar en RhinoCompute: {e}")
        return None

if __name__ == "__main__":
    gh_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh"
    params = {
        "RH_IN:Ancho": 800,
        "RH_IN:Alto": 1000,
        "RH_IN:Profundidad": 500,
        "RH_IN:Cantidada de Cajones": 4,
        "RH_IN:Abrir Cajones": 150
    }
    evaluate_gh_file(gh_file, params)

import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import base64

compute_rhino3d.Util.url = "http://localhost:5000/"

def test_native_gh():
    gh_file = r"C:\Desarrollo\mmapp\temporal\sphere_from_params.gh"
    print(f"=== Evaluando archivo nativo sin plugins: {gh_file} ===")
    
    with open(gh_file, "rb") as f:
        gh_data = f.read()
        
    b64_algo = base64.b64encode(gh_data).decode("utf-8")
    
    t1 = gh.DataTree("RH_IN:Radius")
    t1.Append([0], [25.0])
    
    try:
        res = gh.EvaluateDefinition(b64_algo, [t1])
        print("RESULTADO NATIVO:", res)
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    test_native_gh()

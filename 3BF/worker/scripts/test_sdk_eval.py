import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import base64

compute_rhino3d.Util.url = "http://localhost:5000/"

def test_sdk():
    gh_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh"
    
    with open(gh_file, "rb") as f:
        gh_data = f.read()
        
    b64_algo = base64.b64encode(gh_data).decode("utf-8")
    
    t1 = gh.DataTree("RH_IN:Ancho")
    t1.Append([0], [800.0])
    
    t2 = gh.DataTree("RH_IN:Alto")
    t2.Append([0], [1000.0])
    
    try:
        res = gh.EvaluateDefinition(b64_algo, [t1, t2])
        print("RESULTADO SDK:", res)
    except Exception as e:
        print("ERROR SDK:", e)

if __name__ == "__main__":
    test_sdk()

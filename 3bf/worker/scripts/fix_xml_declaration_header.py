import base64
import requests

def fix_header():
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(dst, "r", encoding="utf-8") as f:
        content = f.read()
        
    if not content.startswith("<?xml"):
        content = '<?xml version="1.0" encoding="utf-8"?>\n' + content
        
    with open(dst, "w", encoding="utf-8") as f:
        f.write(content)
        
    b64_algo = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io tras corregir header XML:", res.status_code)

if __name__ == "__main__":
    fix_header()

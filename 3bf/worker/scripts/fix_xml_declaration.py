ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
with open(ghx_file, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("<?xml version='1.0' encoding='utf-8'?>", '<?xml version="1.0" encoding="utf-8"?>')

with open(ghx_file, "w", encoding="utf-8") as f:
    f.write(text)

print("[OK] Header XML corregido con comillas dobles en Cajon_Experimento_Viktor_RhinoCompute.ghx")

import base64
import requests

# Construir XML .ghx básico de Grasshopper con RH_IN:Ancho y RH_OUT:Geometria
ghx_valid_xml = """<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<Archive version="7.0">
  <archive_header>
    <compact>false</compact>
    <shortly>false</shortly>
    <author>Mario Mojica</author>
  </archive_header>
  <chunk name="Data">
    <items count="1">
      <item name="Name" type="System.String">3BF_Test_Definition</item>
    </items>
    <chunks count="1">
      <chunk name="Definition">
        <chunks count="1">
          <chunk name="DefinitionObjects">
            <items count="1">
              <item name="ObjectCount" type="System.Int32">2</item>
            </items>
            <chunks count="2">
              <chunk name="Object" index="0">
                <items count="3">
                  <item name="Name" type="System.String">Number Slider</item>
                  <item name="NickName" type="System.String">RH_IN:Ancho</item>
                  <item name="Description" type="System.String">Ancho paramétrico</item>
                </items>
              </chunk>
              <chunk name="Object" index="1">
                <items count="3">
                  <item name="Name" type="System.String">Geometry</item>
                  <item name="NickName" type="System.String">RH_OUT:Geometria</item>
                  <item name="Description" type="System.String">Salida de Geometria</item>
                </items>
              </chunk>
            </chunks>
          </chunk>
        </chunks>
      </chunk>
    </chunks>
  </chunk>
</Archive>"""

def test_custom_ghx():
    b64_str = base64.b64encode(ghx_valid_xml.encode("utf-8")).decode("utf-8")
    
    payload = {
        "algo": b64_str,
        "pointer": None,
        "values": [
            {
                "ParamName": "RH_IN:Ancho",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "1200.0"}]
                }
            }
        ]
    }
    
    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text[:500])

if __name__ == "__main__":
    test_custom_ghx()

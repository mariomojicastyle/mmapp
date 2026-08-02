import xml.etree.ElementTree as ET

def generate_svg():
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 550" width="100%" height="100%" style="background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <!-- Gradients -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
    
    <!-- Shadow Filter -->
    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.06" />
    </filter>
    
    <!-- Arrow Marker -->
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
    <marker id="arrowFeedback" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0d9488" />
    </marker>
  </defs>

  <!-- Title Section -->
  <text x="50" y="45" font-size="22" font-weight="700" fill="#0f172a">3DBimFab (3BF) - Arquitectura de Procesamiento Paramétrico 3D</text>
  <text x="50" y="70" font-size="13" font-weight="400" fill="#64748b">Tema: Tech Ethos (Light Mode) | Flujo Horizontal de Evaluación en Tiempo Real (Grasshopper ➔ Web)</text>

  <!-- Flow Boxes -->
  
  <!-- Step 1: GH -->
  <g transform="translate(50, 110)" filter="url(#dropShadow)">
    <rect width="230" height="240" rx="12" fill="url(#cardGrad)" stroke="#cbd5e1" stroke-width="1.5" />
    <rect width="230" height="40" rx="12" fill="url(#headerGrad)" />
    <rect y="28" width="230" height="12" fill="#0284c7" />
    <text x="15" y="25" font-size="14" font-weight="700" fill="#ffffff">1. Grasshopper (.ghx)</text>
    
    <rect x="15" y="55" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="73" font-size="12" font-weight="600" fill="#1e293b">Entradas RH_IN:</text>
    <text x="25" y="90" font-size="11" fill="#64748b">Sliders (Ancho, Alto, Prof)</text>

    <rect x="15" y="110" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="128" font-size="12" font-weight="600" fill="#1e293b">Salidas RH_OUT:</text>
    <text x="25" y="145" font-size="11" fill="#64748b">Grupos (Frente, TapaLuz...)</text>

    <rect x="15" y="165" width="200" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="25" y="183" font-size="11" font-weight="600" fill="#0f172a">Estructura XML</text>
    <text x="25" y="198" font-size="10" fill="#475569">• Atributos InstanceGuid</text>
    <text x="25" y="213" font-size="10" fill="#475569">• Árbol NickName RH_IN/RH_OUT</text>
  </g>

  <!-- Arrow 1 -> 2 -->
  <path d="M 280 230 L 320 230" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrow)" fill="none" />

  <!-- Step 2: Python Worker -->
  <g transform="translate(320, 110)" filter="url(#dropShadow)">
    <rect width="230" height="240" rx="12" fill="url(#cardGrad)" stroke="#cbd5e1" stroke-width="1.5" />
    <rect width="230" height="40" rx="12" fill="url(#headerGrad)" />
    <rect y="28" width="230" height="12" fill="#0284c7" />
    <text x="15" y="25" font-size="14" font-weight="700" fill="#ffffff">2. Python Worker (:8005)</text>

    <rect x="15" y="55" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="73" font-size="12" font-weight="600" fill="#1e293b">Base64 &amp; XML Parsing</text>
    <text x="25" y="90" font-size="11" fill="#64748b">Lectura de algo (GHX Base64)</text>

    <rect x="15" y="110" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="128" font-size="12" font-weight="600" fill="#1e293b">InnerTree Payload</text>
    <text x="25" y="145" font-size="11" fill="#64748b">Mapeo RH_IN:Ancho = 1200.0</text>

    <rect x="15" y="165" width="200" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="25" y="183" font-size="11" font-weight="600" fill="#0f172a">Motor FastAPI / Uvicorn</text>
    <text x="25" y="198" font-size="10" fill="#475569">• Servidor asíncrono Python</text>
    <text x="25" y="213" font-size="10" fill="#475569">• Conversión a JSON nativo</text>
  </g>

  <!-- Arrow 2 -> 3 -->
  <path d="M 550 230 L 590 230" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrow)" fill="none" />

  <!-- Step 3: RhinoCompute 8 -->
  <g transform="translate(590, 110)" filter="url(#dropShadow)">
    <rect width="230" height="240" rx="12" fill="url(#cardGrad)" stroke="#cbd5e1" stroke-width="1.5" />
    <rect width="230" height="40" rx="12" fill="url(#headerGrad)" />
    <rect y="28" width="230" height="12" fill="#0284c7" />
    <text x="15" y="25" font-size="14" font-weight="700" fill="#ffffff">3. RhinoCompute 8 (:5000)</text>

    <rect x="15" y="55" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="73" font-size="12" font-weight="600" fill="#1e293b">Solver Paramétrico</text>
    <text x="25" y="90" font-size="11" fill="#64748b">Rhino 8 Commercial Engine</text>

    <rect x="15" y="110" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="128" font-size="12" font-weight="600" fill="#1e293b">Recálculo BRep / Box</text>
    <text x="25" y="145" font-size="11" fill="#64748b">Generación 15 piezas reales</text>

    <rect x="15" y="165" width="200" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="25" y="183" font-size="11" font-weight="600" fill="#0f172a">Serialización OpenNURBS</text>
    <text x="25" y="198" font-size="10" fill="#475569">• Respuesta HTTP 200 OK</text>
    <text x="25" y="213" font-size="10" fill="#475569">• Formato archive3dm / json</text>
  </g>

  <!-- Arrow 3 -> 4 -->
  <path d="M 820 230 L 860 230" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrow)" fill="none" />

  <!-- Step 4: Decode -->
  <g transform="translate(860, 110)" filter="url(#dropShadow)">
    <rect width="230" height="240" rx="12" fill="url(#cardGrad)" stroke="#cbd5e1" stroke-width="1.5" />
    <rect width="230" height="40" rx="12" fill="url(#headerGrad)" />
    <rect y="28" width="230" height="12" fill="#0284c7" />
    <text x="15" y="25" font-size="14" font-weight="700" fill="#ffffff">4. Descodificador C++</text>

    <rect x="15" y="55" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="73" font-size="12" font-weight="600" fill="#1e293b">rhino3dm.Decode</text>
    <text x="25" y="90" font-size="11" fill="#64748b">C++ OpenNURBS Binding</text>

    <rect x="15" y="110" width="200" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="128" font-size="12" font-weight="600" fill="#1e293b">BoundingBox (X,Y,Z)</text>
    <text x="25" y="145" font-size="11" fill="#64748b">Dimensiones &amp; Centros (m)</text>

    <rect x="15" y="165" width="200" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="25" y="183" font-size="11" font-weight="600" fill="#0f172a">Estructura real_meshes</text>
    <text x="25" y="198" font-size="10" fill="#475569">• Arreglo JSON de piezas</text>
    <text x="25" y="213" font-size="10" fill="#475569">• Mapeo de ejes (X, Z, Y)</text>
  </g>

  <!-- Arrow 4 -> 5 -->
  <path d="M 1090 230 L 1130 230" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrow)" fill="none" />

  <!-- Step 5: Web Viewer -->
  <g transform="translate(1130, 110)" filter="url(#dropShadow)">
    <rect width="220" height="240" rx="12" fill="url(#cardGrad)" stroke="#cbd5e1" stroke-width="1.5" />
    <rect width="220" height="40" rx="12" fill="url(#accentGrad)" />
    <rect y="28" width="220" height="12" fill="#0d9488" />
    <text x="15" y="25" font-size="14" font-weight="700" fill="#ffffff">5. Three.js Viewer (:3005)</text>

    <rect x="15" y="55" width="190" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="73" font-size="12" font-weight="600" fill="#1e293b">React Three Fiber</text>
    <text x="25" y="90" font-size="11" fill="#64748b">Instanciación THREE.Mesh</text>

    <rect x="15" y="110" width="190" height="45" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    <text x="25" y="128" font-size="12" font-weight="600" fill="#1e293b">EdgesGeometry CAD</text>
    <text x="25" y="145" font-size="11" fill="#64748b">Bordes limpios Tech Ethos</text>

    <rect x="15" y="165" width="190" height="60" rx="6" fill="#f0fdf4" stroke="#bbf7d0" />
    <text x="25" y="183" font-size="11" font-weight="700" fill="#15803d">Mueble 3D Vivo</text>
    <text x="25" y="198" font-size="10" fill="#166534">• Renderizado en tiempo real</text>
    <text x="25" y="213" font-size="10" fill="#166534">• Interacción con Sliders</text>
  </g>

  <!-- Interactive Loop Path (Bottom) -->
  <path d="M 1240 360 L 1240 430 L 435 430 L 435 360" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="6,6" marker-end="url(#arrowFeedback)" fill="none" />

  <!-- Loop Card -->
  <g transform="translate(680, 400)" filter="url(#dropShadow)">
    <rect x="-170" y="0" width="340" height="45" rx="8" fill="#ffffff" stroke="#0d9488" stroke-width="1.5" />
    <text x="0" y="20" font-size="12" font-weight="700" fill="#0f766e" text-anchor="middle">🔄 Bucle de Interacción en Tiempo Real</text>
    <text x="0" y="36" font-size="11" fill="#334155" text-anchor="middle">Usuario mueve Slider Ancho ➔ Petición POST ➔ Recálculo en 200ms</text>
  </g>

</svg>"""

    with open(r"C:\Desarrollo\mmapp\3BF\3BF_Proceso_Diagrama.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("  [OK] Diagrama vectorial SVG generado en C:\\Desarrollo\\mmapp\\3BF\\3BF_Proceso_Diagrama.svg")

if __name__ == "__main__":
    generate_svg()

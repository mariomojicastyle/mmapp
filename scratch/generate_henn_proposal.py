import os
import base64
import subprocess

# Rutas
base_dir = r"c:\Desarrollo\mmapp"
pub_dir = os.path.join(base_dir, "publicidad")
out_dir = os.path.join(base_dir, "Comercial", "Propuestas")
os.makedirs(out_dir, exist_ok=True)

html_path = os.path.join(out_dir, "Propuesta_Comercial_Moveis_Henn_Mario_Mojica_COP.html")
pdf_path = os.path.join(out_dir, "Propuesta_Comercial_Moveis_Henn_Mario_Mojica_COP.pdf")

# Cargar logotipos en Base64
with open(os.path.join(pub_dir, "Logo_MM_en.svg"), "rb") as f:
    b64_logo_mm = base64.b64encode(f.read()).decode("utf-8")
with open(os.path.join(pub_dir, "Logo_3BF.svg"), "rb") as f:
    b64_logo_3bf = base64.b64encode(f.read()).decode("utf-8")

# HTML Template con CSS moderno Tech Ethos
html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Propuesta Comercial - Móveis Henn & Mario Mojica (3dBimFab)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Prompt:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {{
      size: 1920px 1080px;
      margin: 0;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0F172A;
      color: #1E293B;
      -webkit-font-smoothing: antialiased;
    }}
    .slide {{
      width: 1920px;
      height: 1080px;
      position: relative;
      background: #FFFFFF;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      padding: 60px 80px;
    }}
    /* Fondos y texturas Tech Ethos */
    .bg-grid {{
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(to right, rgba(0, 136, 170, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 136, 170, 0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }}
    .content-layer {{
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      height: 100%;
    }}
    /* Encabezados y barras */
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 2px solid #E2E8F0;
      margin-bottom: 40px;
    }}
    .header-left {{
      display: flex;
      align-items: center;
      gap: 24px;
    }}
    .header-logo-mm {{
      height: 48px;
    }}
    .header-logo-3bf {{
      height: 44px;
    }}
    .header-title-box h3 {{
      font-family: 'Prompt', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.02em;
    }}
    .header-title-box p {{
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
    }}
    .header-badge {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      border-radius: 9999px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      font-size: 14px;
      font-weight: 700;
    }}
    .footer {{
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
    }}
    .footer-highlight {{
      color: #0088AA;
      font-weight: 700;
    }}
    /* Tipografías y Títulos */
    .title-main {{
      font-family: 'Prompt', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
    }}
    .title-sub {{
      font-size: 19px;
      color: #475569;
      font-weight: 400;
      line-height: 1.5;
      max-width: 1200px;
      margin-bottom: 36px;
    }}
    .accent-cyan {{
      color: #0088AA;
    }}
    .accent-blue {{
      color: #1368AA;
    }}
    /* Cápsulas y Badges */
    .pill {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      line-height: 1;
    }}
    .pill-cyan {{
      background: #E0F2FE;
      color: #0369A1;
      border: 1px solid #BAE6FD;
    }}
    .pill-green {{
      background: #DCFCE7;
      color: #15803D;
      border: 1px solid #BBF7D0;
    }}
    .pill-orange {{
      background: #FFEDD5;
      color: #C2410C;
      border: 1px solid #FED7AA;
    }}
    .pill-dark {{
      background: #0F172A;
      color: #FFFFFF;
    }}
    /* Tarjetas y Contenedores */
    .card-grid {{
      display: grid;
      gap: 28px;
    }}
    .grid-3 {{
      grid-template-columns: repeat(3, 1fr);
    }}
    .grid-4 {{
      grid-template-columns: repeat(4, 1fr);
    }}
    .grid-2 {{
      grid-template-columns: repeat(2, 1fr);
    }}
    .card {{
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      position: relative;
    }}
    .card-highlight {{
      border: 2px solid #0088AA;
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      box-shadow: 0 10px 30px -5px rgba(0, 136, 170, 0.12);
    }}
    .card-title {{
      font-family: 'Prompt', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 8px;
    }}
    .card-desc {{
      font-size: 14px;
      color: #64748B;
      line-height: 1.5;
      margin-bottom: 20px;
    }}
    /* Tablas ejecutivas */
    .table-container {{
      width: 100%;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }}
    th {{
      background: #F1F5F9;
      color: #334155;
      font-family: 'Prompt', sans-serif;
      font-size: 14px;
      font-weight: 700;
      padding: 18px 24px;
      border-bottom: 2px solid #CBD5E1;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }}
    td {{
      padding: 18px 24px;
      font-size: 15px;
      color: #1E293B;
      border-bottom: 1px solid #E2E8F0;
      vertical-align: middle;
    }}
    tr:last-child td {{
      border-bottom: none;
    }}
    tr.highlight-row {{
      background: #F0FDF4;
    }}
    .price-tag {{
      font-family: 'Prompt', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
    }}
    .price-strike {{
      font-size: 13px;
      color: #94A3B8;
      text-decoration: line-through;
      margin-right: 6px;
    }}
    .price-offer {{
      color: #15803D;
      font-size: 24px;
      font-weight: 800;
    }}
    .badge-free {{
      background: #22C55E;
      color: #FFFFFF;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }}
    /* Diapositiva 1 - Portada */
    .cover-slide {{
      background: radial-gradient(circle at 85% 20%, rgba(0, 136, 170, 0.08) 0%, transparent 60%),
                  radial-gradient(circle at 15% 85%, rgba(19, 104, 170, 0.06) 0%, transparent 50%),
                  #FFFFFF;
      justify-content: center;
      padding: 100px 120px;
    }}
    .cover-badge {{
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 10px 24px;
      border-radius: 9999px;
      background: #E0F2FE;
      color: #0369A1;
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 32px;
      border: 1px solid #BAE6FD;
      width: fit-content;
    }}
    .cover-title {{
      font-family: 'Prompt', sans-serif;
      font-size: 64px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 24px;
      max-width: 1400px;
    }}
    .cover-subtitle {{
      font-size: 24px;
      color: #475569;
      font-weight: 400;
      line-height: 1.5;
      max-width: 1100px;
      margin-bottom: 60px;
    }}
    .cover-meta-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      padding-top: 40px;
      border-top: 2px solid #E2E8F0;
    }}
    .cover-meta-item h4 {{
      font-size: 13px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }}
    .cover-meta-item p {{
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
    }}
    .cover-meta-item p.sub {{
      font-size: 14px;
      color: #64748B;
      font-weight: 400;
      margin-top: 2px;
    }}
  </style>
</head>
<body>

  <!-- ==================== SLIDE 1: PORTADA ==================== -->
  <section class="slide cover-slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <img src="data:image/svg+xml;base64,{b64_logo_mm}" alt="Mario Mojica" style="height: 64px;">
        <img src="data:image/svg+xml;base64,{b64_logo_3bf}" alt="3dBimFab" style="height: 56px;">
      </div>

      <div class="cover-badge">
        <span>🚀 ALIANZA ESTRATÉGICA & PROGRAMA PILOTO B2B</span>
        <span>•</span>
        <span>SEPTIEMBRE 2026</span>
      </div>

      <h1 class="cover-title">
        Transformación Digital de Ingeniería & <br>
        <span class="accent-cyan">Manuales de Armado 3D Interactivos</span>
      </h1>

      <p class="cover-subtitle">
        Propuesta técnica y comercial de arranque con <strong>3dBimFab</strong> para la automatización paramétrica, reducción del 50% de costos de P&D y optimización de postventa para <strong>Móveis Henn</strong>.
      </p>

      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <h4>Cliente Exclusivo</h4>
          <p>Móveis Henn</p>
          <p class="sub">Mondaí, Santa Catarina, Brasil</p>
        </div>
        <div class="cover-meta-item">
          <h4>Interlocutores Clave</h4>
          <p>Marcos Unnass & Jonas Borck</p>
          <p class="sub">P&D, Engenharia & Equipo de TI/Sistemas</p>
        </div>
        <div class="cover-meta-item">
          <h4>Autor & Desarrollador</h4>
          <p>Mario Mojica</p>
          <p class="sub">Software de Manufactura • 3dBimFab</p>
        </div>
        <div class="cover-meta-item">
          <h4>Alcance Inmediato</h4>
          <p>Paquete Piloto de 10 Muebles</p>
          <p class="sub">Entrega en 30 Días Calendario</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 2: DIAGNÓSTICO OPERACIÓN HENN ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_mm}" class="header-logo-mm">
          <div class="header-title-box">
            <h3>MÓVEIS HENN • DIAGNÓSTICO DE COSTOS & DOLORES</h3>
            <p>Datos validados en reunión de levantamiento técnico con Marcos Unnass (P&D)</p>
          </div>
        </div>
        <div class="header-badge">
          <span>📊 Realidad Operativa Validada</span>
        </div>
      </div>

      <h2 class="title-main">El Costo Real de los Manuales 2D en Henn y la Brecha de Promob</h2>
      <p class="title-sub">
        En nuestra sesión previa relevamos los costos directos de la operación anual de Henn (~80 manuales únicos/año con 2 proyectistas CLT, licencias de software y soporte técnico). El flujo analógico tradicional genera costos ocultos y fricción en planta.
      </p>

      <div class="card-grid grid-3" style="margin-bottom: 30px;">
        <div class="card">
          <span class="pill pill-orange" style="margin-bottom: 16px; width: fit-content;">Costo Operación Actual</span>
          <div style="font-size: 38px; font-family: 'Prompt', sans-serif; font-weight: 800; color: #0F172A; margin-bottom: 8px;">
            R$ 154.090 <span style="font-size: 16px; color: #64748B;">/ año</span>
          </div>
          <p style="font-size: 16px; font-weight: 700; color: #C2410C; margin-bottom: 12px;">
            R$ 1.926,14 BRL (~$ 1.124.204 COP) por manual
          </p>
          <p class="card-desc">
            Suma de 2 salarios CLT + cargas prestacionales (R$ 144.000) + Licencias anuales de SketchUp Pro (R$ 2.400) e InDesign (R$ 3.600) + 10h/mes de soporte técnico postventa.
          </p>
        </div>

        <div class="card">
          <span class="pill pill-cyan" style="margin-bottom: 16px; width: fit-content;">La "Brecha de Datos" de Promob</span>
          <h3 class="card-title">Omisión del 15% de Herrajes</h3>
          <p class="card-desc">
            Promob se ralentiza y satura si modelan herrajes pequeños. En fábrica se omiten cantoneras, esquineras y puntillas, obligando a realizar el <strong>conteo a mano en InDesign</strong>. Esto provoca desajustes en la BOM y quejas de clientes por piezas faltantes.
          </p>
          <div style="margin-top: auto; padding: 12px 16px; background: #F8FAFC; border-radius: 12px; font-size: 13px; color: #475569;">
            🔍 <strong>Consecuencia:</strong> Retrabajo continuo en fábrica y desgaste del equipo de ingeniería.
          </div>
        </div>

        <div class="card card-highlight">
          <span class="pill pill-green" style="margin-bottom: 16px; width: fit-content;">La Solución 3dBimFab</span>
          <h3 class="card-title">ADN Paramétrico 100% Exacto</h3>
          <p class="card-desc">
            Los herrajes y barrenos viven en el modelo paramétrico de <strong>3dBimFab</strong>. El conteo es automático, milimétrico y no sobrecarga el visor WebGL. Se generan los manuales interactivos por voz y se exportan listados estructurados de costos en minutos.
          </p>
          <div style="margin-top: auto; padding: 12px 16px; background: #DCFCE7; border-radius: 12px; font-size: 13px; color: #166534; font-weight: 600;">
            ✨ Cero error humano en listas de empaque y despiece de herrajes.
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 02 / 08 • Ecosistema Tecnológico Mario Mojica</div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 3: LA PLATAFORMA 3dBimFab ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_3bf}" class="header-logo-3bf">
          <div class="header-title-box">
            <h3>3dBimFab • MOTOR DE MANUFACTURA DIGITAL PARAMÉTRICA</h3>
            <p>Plataforma Web-BIM Headless en la Nube (RhinoCompute 8 + Three.js)</p>
          </div>
        </div>
        <div class="header-badge">
          <span>⚡ Demostración en Vivo para Sistemas & P&D</span>
        </div>
      </div>

      <h2 class="title-main">¿Qué es 3dBimFab y Cómo se Conecta con la Operación de Henn?</h2>
      <p class="title-sub">
        3dBimFab reemplaza el dibujo manual desconectado creando un <strong>Gemelo Digital Paramétrico</strong> del mueble. Permite cambiar dimensiones, herrajes y materiales en tiempo real desde el navegador web sin licencias locales ni ralentizaciones.
      </p>

      <div class="card-grid grid-4" style="margin-bottom: 24px;">
        <div class="card">
          <div style="font-size: 28px; margin-bottom: 12px;">🧩</div>
          <h3 class="card-title" style="font-size: 18px;">Bloques Inteligentes</h3>
          <p class="card-desc" style="font-size: 13px;">
            Módulos vivos paramétricos con reglas de perforación DfMA, minifix, tarugos, correderas telescópicas y ranuras que se reconfiguran dinámicamente.
          </p>
        </div>

        <div class="card">
          <div style="font-size: 28px; margin-bottom: 12px;">📊</div>
          <h3 class="card-title" style="font-size: 18px;">Listados para Costeo</h3>
          <p class="card-desc" style="font-size: 13px;">
            Descarga de matrices de despiece (BOM) acordadas con Henn con metros de canto, tableros MDP/MDF y conteo de herrajes para enlazar con TOTVS Datasul.
          </p>
        </div>

        <div class="card">
          <div style="font-size: 28px; margin-bottom: 12px;">💾</div>
          <h3 class="card-title" style="font-size: 18px;">Exportación CAD 3D</h3>
          <p class="card-desc" style="font-size: 13px;">
            Generación y descarga directa de la geometría en formatos estándar de la industria: <strong>DWG, OBJ y GLB</strong> para uso en fábrica y marketing.
          </p>
        </div>

        <div class="card card-highlight">
          <div style="font-size: 28px; margin-bottom: 12px;">📱</div>
          <h3 class="card-title" style="font-size: 18px;">Manual 3D por Voz</h3>
          <p class="card-desc" style="font-size: 13px;">
            Compilación instantánea del manual de armado interactivo en WebGL con audio guiado en Portugués nativo, orbital 360° y telemetría de campo.
          </p>
        </div>
      </div>

      <div style="background: #F1F5F9; border-radius: 16px; padding: 20px 28px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 24px;">🔗</span>
          <div>
            <div style="font-weight: 700; color: #0F172A; font-size: 15px;">Demostración Práctica: Cômoda Ravenna D737</div>
            <div style="font-size: 13px; color: #64748B;">El modelo DWG enviado por Marcos ya está vivo y evaluado paramétricamente en 3dBimFab.</div>
          </div>
        </div>
        <span class="pill pill-cyan">Listo para Probar en Vivo</span>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 03 / 08 • Ecosistema Tecnológico Mario Mojica</div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 4: MATRIZ DE COMPLEJIDAD Y TIEMPOS ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_mm}" class="header-logo-mm">
          <div class="header-title-box">
            <h3>METODOLOGÍA DE INGENIERÍA • CLASIFICACIÓN POR COMPLEJIDAD</h3>
            <p>Estructuración de tiempos y costos de desarrollo basada en horas hombre senior</p>
          </div>
        </div>
        <div class="header-badge">
          <span>⏱️ Estimación Transparente de Esfuerzo</span>
        </div>
      </div>

      <h2 class="title-main">Clasificación por Tipos de Mueble y Tiempos de Desarrollo</h2>
      <p class="title-sub">
        Para garantizar predictibilidad y rigor técnico, clasificamos el catálogo de Henn en 3 niveles de complejidad. Los costos se basan en una tarifa de dedicación de ingeniería senior ($ 20.000.000 COP / mes ➔ <strong>$ 666.667 COP / día</strong>).
      </p>

      <div class="table-container" style="margin-bottom: 24px;">
        <table>
          <thead>
            <tr>
              <th>Tipo de Mueble</th>
              <th>Rango de Piezas</th>
              <th>Días Cargue 3dBimFab</th>
              <th>Valor Comercial 3BF</th>
              <th>Días Manual 3D</th>
              <th>Ejemplos Catálogo Henn</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 700; color: #0F172A;">Mueble Pequeño</div>
                <div style="font-size: 12px; color: #64748B;">Línea Auxiliar / Simple</div>
              </td>
              <td><span class="pill pill-cyan">Máximo 10 piezas</span></td>
              <td><strong>3 días</strong></td>
              <td><span class="price-tag">$ 2.000.000 COP</span></td>
              <td><strong>0.5 días</strong> (~4 horas)</td>
              <td>Criado-Mudo, Nichos, Paneles TV simples, Mesas auxiliares</td>
            </tr>
            <tr class="highlight-row">
              <td>
                <div style="font-weight: 700; color: #0F172A;">Mueble Mediano</div>
                <div style="font-size: 12px; color: #166534; font-weight: 600;">⭐ Promedio Henn (~20 piezas)</div>
              </td>
              <td><span class="pill pill-green">Entre 11 a 24 piezas</span></td>
              <td><strong>5 días</strong></td>
              <td><span class="price-tag">$ 3.333.333 COP</span></td>
              <td><strong>0.8 días</strong> (~6 horas)</td>
              <td>Racks TV, Buffets, Cômodas 4-6 Gavetas (ej. Cômoda Ravenna)</td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700; color: #0F172A;">Mueble Grande</div>
                <div style="font-size: 12px; color: #64748B;">Complejo / Multimódulo</div>
              </td>
              <td><span class="pill pill-orange">Entre 25 y 40 piezas</span></td>
              <td><strong>8 días</strong></td>
              <td><span class="price-tag">$ 5.333.333 COP</span></td>
              <td><strong>1.1 días</strong> (~9 horas)</td>
              <td>Guarda-Roupas 6 Portas, Cozinhas Moduladas completas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px 28px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <span style="font-size: 32px;">💡</span>
          <div>
            <div style="font-weight: 700; color: #0F172A; font-size: 16px;">Sinergia Tecnológica de Alto Rendimiento:</div>
            <div style="font-size: 14px; color: #475569;">
              Al tener el mueble ya modelado en <strong>3dBimFab</strong>, el manual de ensamble se compila en tiempo récord (de 0.5 a 1.1 días), eliminando semanas de dibujo en Illustrator o InDesign.
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 04 / 08 • Ecosistema Tecnológico Mario Mojica</div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 5: COMPARATIVA Y OFERTA -50% ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_mm}" class="header-logo-mm">
          <div class="header-title-box">
            <h3>PROPUESTA COMERCIAL • COMPARATIVA & DESCUENTOS</h3>
            <p>Evolución de costos: Costo Actual Henn vs. Tarifa Estándar -30% vs. Oferta Piloto -50%</p>
          </div>
        </div>
        <div class="header-badge">
          <span>🔥 Oferta Exclusiva de Cierre Inmediato</span>
        </div>
      </div>

      <h2 class="title-main">Comparativa de Valores y Ahorro Directo para Henn</h2>
      <p class="title-sub">
        En la reunión previa garantizamos un ahorro del 30%. Sin embargo, para dar inicio de inmediato a nuestra relación y permitir que Henn compruebe el valor de la tecnología sin riesgo, <strong>ofrecemos un 50% de descuento directo en el desarrollo de manuales</strong>.
      </p>

      <div class="table-container" style="margin-bottom: 28px;">
        <table>
          <thead>
            <tr>
              <th>Categoría de Mueble</th>
              <th>Costo Interno Henn</th>
              <th>Propuesta Estándar (-30%)</th>
              <th style="background: #DCFCE7; color: #166534;">OFERTA PILOTO HENN (-50%)</th>
              <th>Ahorro Unitario Neto</th>
              <th>% Ahorro Real</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 700;">Mueble Pequeño</div>
                <div style="font-size: 12px; color: #64748B;">Hasta 10 piezas</div>
              </td>
              <td>$ 730.733 COP</td>
              <td>$ 511.513 COP</td>
              <td style="background: #F0FDF4;">
                <span class="price-strike">$ 511.513</span>
                <span class="price-offer">$ 333.333 COP</span>
              </td>
              <td><strong style="color: #166534;">+$ 397.400 COP</strong></td>
              <td><span class="pill pill-green">54.4% Ahorro</span></td>
            </tr>
            <tr class="highlight-row">
              <td>
                <div style="font-weight: 700; color: #0F172A;">Mueble Mediano</div>
                <div style="font-size: 12px; color: #166534; font-weight: 600;">Promedio Henn (Ravenna)</div>
              </td>
              <td>$ 1.124.204 COP</td>
              <td>$ 786.943 COP</td>
              <td style="background: #DCFCE7;">
                <span class="price-strike">$ 786.943</span>
                <span class="price-offer">$ 533.333 COP</span>
              </td>
              <td><strong style="color: #166534;">+$ 590.871 COP</strong></td>
              <td><span class="pill pill-green">52.6% Ahorro</span></td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700;">Mueble Grande</div>
                <div style="font-size: 12px; color: #64748B;">25 a 40 piezas</div>
              </td>
              <td>$ 1.517.676 COP</td>
              <td>$ 1.062.373 COP</td>
              <td style="background: #F0FDF4;">
                <span class="price-strike">$ 1.062.373</span>
                <span class="price-offer">$ 733.333 COP</span>
              </td>
              <td><strong style="color: #166534;">+$ 784.343 COP</strong></td>
              <td><span class="pill pill-green">51.7% Ahorro</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-grid grid-3">
        <div style="padding: 16px 20px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase;">Ahorro Promedio por Mueble</div>
          <div style="font-size: 24px; font-weight: 800; color: #15803D; font-family: 'Prompt', sans-serif;">+$ 590.871 COP</div>
          <div style="font-size: 13px; color: #475569;">Más del 50% de economía directa frente al costo actual.</div>
        </div>
        <div style="padding: 16px 20px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase;">Paquete Piloto (10 Medianos)</div>
          <div style="font-size: 24px; font-weight: 800; color: #0088AA; font-family: 'Prompt', sans-serif;">$ 5.333.333 COP</div>
          <div style="font-size: 13px; color: #475569;">Valor total por el desarrollo de 10 manuales 3D completos.</div>
        </div>
        <div style="padding: 16px 20px; background: #DCFCE7; border-radius: 16px; border: 1px solid #BBF7D0;">
          <div style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase;">Ahorro Total para Henn en Piloto</div>
          <div style="font-size: 24px; font-weight: 800; color: #166534; font-family: 'Prompt', sans-serif;">+$ 5.908.710 COP</div>
          <div style="font-size: 13px; color: #166534;">Economía inmediata en el primer mes de trabajo conjunto.</div>
        </div>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 05 / 08 • Ecosistema Tecnológico Mario Mojica</div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 6: BONIFICACIÓN 100% GRATIS 3BF ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_3bf}" class="header-logo-3bf">
          <div class="header-title-box">
            <h3>BENEFICIO HISTÓRICO • CLIENTE PIONERO DE ARRANQUE</h3>
            <p>Aporte tecnológico de co-innovación para el lanzamiento con Móveis Henn</p>
          </div>
        </div>
        <div class="header-badge" style="background: #FEF2F2; border-color: #FECACA; color: #991B1B;">
          <span>🎁 Bonificación 100% Gratuita en 3dBimFab</span>
        </div>
      </div>

      <h2 class="title-main">El Gran Aporte de Co-Innovación: 3dBimFab 100% GRATIS</h2>
      <p class="title-sub">
        Para que el equipo de P&D y Sistemas de Henn pueda explorar a fondo la plataforma sin asumir costos de software, <strong>el cargue y modelado paramétrico de los 10 primeros muebles en 3dBimFab se entrega de manera TOTALMENTE GRATUITA ($0 COP)</strong>.
      </p>

      <div class="card-grid grid-2" style="margin-bottom: 28px;">
        <div class="card" style="border-left: 6px solid #EF4444;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="pill pill-orange">Valor Real en el Mercado</span>
            <span style="font-size: 14px; color: #64748B; font-weight: 600;">Ingeniería de Modelado Paramétrico</span>
          </div>
          <div style="font-size: 42px; font-family: 'Prompt', sans-serif; font-weight: 800; color: #0F172A; margin-bottom: 8px;">
            $ 33.333.330 <span style="font-size: 18px; color: #64748B;">COP</span>
          </div>
          <p style="font-size: 15px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
            Correspondiente a 50 días de ingeniería senior (5 días × 10 muebles medianos a $666.667 COP/día = $3.333.333 COP por mueble).
          </p>
          <div style="background: #FEF2F2; padding: 12px 16px; border-radius: 12px; font-size: 13px; color: #991B1B; font-weight: 600;">
            Costo comercial habitual que Henn NO tendrá que pagar.
          </div>
        </div>

        <div class="card card-highlight" style="border-left: 6px solid #22C55E;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="pill pill-green">OFERTA PIONERA HENN</span>
            <span class="badge-free">100% BONIFICADO</span>
          </div>
          <div style="font-size: 42px; font-family: 'Prompt', sans-serif; font-weight: 800; color: #15803D; margin-bottom: 8px;">
            $ 0 <span style="font-size: 18px; color: #15803D;">COP (GRATUITO)</span>
          </div>
          <p style="font-size: 15px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
            Henn obtiene 10 gemelos digitales paramétricos vivos en la nube para probar iteraciones, exportar 3D y generar listados de costos sin pagar por el desarrollo del software.
          </p>
          <div style="background: #DCFCE7; padding: 12px 16px; border-radius: 12px; font-size: 13px; color: #166534; font-weight: 700;">
            ✨ Henn solo invierte en el valor reducido de los manuales 3D.
          </div>
        </div>
      </div>

      <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 20px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 18px; font-weight: 800; color: #0F172A; font-family: 'Prompt', sans-serif;">
            Inversión Neta Total para Henn en el Piloto de 10 Productos:
          </div>
          <div style="font-size: 14px; color: #64748B;">
            10 Muebles en 3dBimFab ($0 COP) + 10 Manuales 3D al 50% ($533.333 COP c/u)
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 36px; font-weight: 800; color: #0088AA; font-family: 'Prompt', sans-serif;">
            $ 5.333.333 COP
          </div>
          <div style="font-size: 13px; color: #166534; font-weight: 700;">
            Ahorro Total Consolidado en Tecnología: +$ 39.242.040 COP
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 06 / 08 • Ecosistema Tecnológico Mario Mojica</div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 7: LOS 4 ENTREGABLES ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_mm}" class="header-logo-mm">
          <div class="header-title-box">
            <h3>PAQUETE DE ENTREGABLES • VALOR TÉCNICO COMPLETO</h3>
            <p>Compromisos formales de entrega para cada uno de los 10 productos seleccionados</p>
          </div>
        </div>
        <div class="header-badge">
          <span>📦 4 Entregables de Alto Impacto</span>
        </div>
      </div>

      <h2 class="title-main">Los 4 Entregables Incluidos en el Acuerdo Piloto</h2>
      <p class="title-sub">
        Cada uno de los 10 muebles no es un dibujo aislado, sino un activo tecnológico integral que sirve simultáneamente a Ingeniería, Costos, Producción, Marketing y Postventa.
      </p>

      <div class="card-grid grid-2" style="gap: 24px; margin-bottom: 24px;">
        <div class="card">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 9999px; background: #E0F2FE; display: flex; align-items: center; justify-content: center; font-size: 20px;">1</div>
            <h3 class="card-title" style="margin: 0; font-size: 20px;">Gemelo Digital en 3dBimFab (Iteraciones & Costeo)</h3>
          </div>
          <p class="card-desc">
            Acceso a la plataforma web para los 10 muebles. El equipo de P&D de Henn podrá:
          </p>
          <ul style="font-size: 14px; color: #475569; line-height: 1.6; padding-left: 20px;">
            <li>Realizar <strong>iteraciones de diseño y cambios de cotas</strong> dimensionales en vivo.</li>
            <li>Descargar <strong>listados paramétricos de materiales</strong> estructurados y acordados con Henn para alimentar sus matrices de costos y enlace con TOTVS Datasul.</li>
          </ul>
        </div>

        <div class="card">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 9999px; background: #DCFCE7; display: flex; align-items: center; justify-content: center; font-size: 20px;">2</div>
            <h3 class="card-title" style="margin: 0; font-size: 20px;">Archivos CAD 3D Universales (DWG / OBJ / GLB)</h3>
          </div>
          <p class="card-desc">
            Geometría limpia y optimizada lista para descarga en los formatos estándar de la fábrica:
          </p>
          <ul style="font-size: 14px; color: #475569; line-height: 1.6; padding-left: 20px;">
            <li>Archivo 3D en formato <strong>DWG / OBJ</strong> para reutilización en ingeniería interna y Promob.</li>
            <li>Archivo <strong>GLB ligero con mapeo UV</strong> y materiales asignados para catálogo digital.</li>
          </ul>
        </div>

        <div class="card card-highlight">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 9999px; background: #0088AA; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800;">3</div>
            <h3 class="card-title" style="margin: 0; font-size: 20px; color: #0088AA;">Manual de Armado 3D Digital Interactivo (Producto Estrella)</h3>
          </div>
          <p class="card-desc">
            Experiencia interactiva WebGL de ensamble para el cliente final y montadores autorizados:
          </p>
          <ul style="font-size: 14px; color: #475569; line-height: 1.6; padding-left: 20px;">
            <li>Asistencia paso a paso con <strong>locución por voz en Portugués Brasileño nativo</strong>.</li>
            <li>Rotación 360°, zoom milimétrico en smartphone y <strong>telemetría de postventa</strong>.</li>
            <li>Cero descargas: abre al instante en el navegador web móvil del cliente.</li>
          </ul>
        </div>

        <div class="card">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 9999px; background: #FFEDD5; display: flex; align-items: center; justify-content: center; font-size: 20px;">4</div>
            <h3 class="card-title" style="margin: 0; font-size: 20px;">Manual Impreso de 1 Página (PDF de Empaque)</h3>
          </div>
          <p class="card-desc">
            Plantilla gráfica física ultra-simplificada para incluir dentro de la caja plana:
          </p>
          <ul style="font-size: 14px; color: #475569; line-height: 1.6; padding-left: 20px;">
            <li>Diagramación de 1 sola página lista para imprenta con <strong>Código QR autogenerado</strong>.</li>
            <li>El usuario escanea el QR en la caja y accede de inmediato al manual interactivo por voz.</li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 07 / 08 • Ecosistema Tecnológico Mario Mojica</div>
      </div>
    </div>
  </section>

  <!-- ==================== SLIDE 8: CONDICIONES, PAGOS Y FIRMAS ==================== -->
  <section class="slide">
    <div class="bg-grid"></div>
    <div class="content-layer">
      <div class="header">
        <div class="header-left">
          <img src="data:image/svg+xml;base64,{b64_logo_mm}" class="header-logo-mm">
          <div class="header-title-box">
            <h3>CONDICIONES COMERCIALES • CRONOGRAMA & DATOS DE PAGO</h3>
            <p>Esquema de contratación seguro, hitos de pago y datos bancarios para cierre inmediato</p>
          </div>
        </div>
        <div class="header-badge">
          <span>🤝 Contrato de Arranque / Piloto</span>
        </div>
      </div>

      <h2 class="title-main">Condiciones de Contratación y Cronograma de Ejecución</h2>

      <div class="card-grid grid-3" style="margin-bottom: 24px;">
        <div class="card">
          <span class="pill pill-cyan" style="margin-bottom: 12px; width: fit-content;">Hito 1: Formalización</span>
          <div style="font-size: 24px; font-weight: 800; color: #0F172A; font-family: 'Prompt', sans-serif;">20% Anticipo</div>
          <p style="font-size: 18px; font-weight: 700; color: #0088AA; margin-bottom: 8px;">$ 1.066.667 COP</p>
          <p class="card-desc" style="margin-bottom: 0;">
            A la firma de la orden de trabajo para asignación prioritaria de recursos técnicos e inicio del modelado de los 10 productos.
          </p>
        </div>

        <div class="card">
          <span class="pill pill-green" style="margin-bottom: 12px; width: fit-content;">Hito 2: Entrega Final</span>
          <div style="font-size: 24px; font-weight: 800; color: #0F172A; font-family: 'Prompt', sans-serif;">80% Saldo Final</div>
          <p style="font-size: 18px; font-weight: 700; color: #15803D; margin-bottom: 8px;">$ 4.266.666 COP</p>
          <p class="card-desc" style="margin-bottom: 0;">
            A la entrega a entera satisfacción y validación técnica por parte del equipo de P&D de los 10 manuales interactivos y entregables.
          </p>
        </div>

        <div class="card">
          <span class="pill pill-dark" style="margin-bottom: 12px; width: fit-content;">Plazo de Ejecución</span>
          <div style="font-size: 24px; font-weight: 800; color: #0F172A; font-family: 'Prompt', sans-serif;">30 Días Calendario</div>
          <p style="font-size: 15px; font-weight: 600; color: #475569; margin-bottom: 8px;">Entregas Parciales Semanales</p>
          <p class="card-desc" style="margin-bottom: 0;">
            Validaciones progresivas de 2 a 3 manuales por semana para permitir revisión y feedback continuo sin cuellos de botella.
          </p>
        </div>
      </div>

      <!-- Datos Bancarios & Bloque de Firmas -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 28px; margin-bottom: 16px;">
        <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 16px; padding: 20px 24px;">
          <h4 style="font-family: 'Prompt', sans-serif; font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>🏦</span> Información Bancaria Oficial para Transferencias
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
            <div>
              <span style="color: #64748B;">Beneficiario:</span>
              <div style="font-weight: 700; color: #0F172A;">Mario Mojica</div>
            </div>
            <div>
              <span style="color: #64748B;">Documento / NIT:</span>
              <div style="font-weight: 700; color: #0F172A;">C.C. 16.946.046</div>
            </div>
            <div>
              <span style="color: #64748B;">Banco Nacional (Colombia):</span>
              <div style="font-weight: 700; color: #0F172A;">Bancolombia</div>
            </div>
            <div>
              <span style="color: #64748B;">Tipo & Número de Cuenta:</span>
              <div style="font-weight: 700; color: #0F172A;">Ahorros: [Completar Número]</div>
            </div>
            <div>
              <span style="color: #64748B;">Transferencias Internacionales (SWIFT):</span>
              <div style="font-weight: 700; color: #0F172A;">[Completar Código SWIFT]</div>
            </div>
            <div>
              <span style="color: #64748B;">Email de Facturación & Soporte:</span>
              <div style="font-weight: 700; color: #0088AA;">mariomojica.style@gmail.com</div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="flex: 1; border: 1px dashed #94A3B8; border-radius: 16px; padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="font-size: 12px; color: #64748B; font-weight: 600;">POR EL PRESTADOR</div>
            <div style="margin: 20px 0; font-family: 'Prompt', sans-serif; font-size: 16px; font-weight: 700; color: #0F172A;">Mario Mojica</div>
            <div style="font-size: 12px; color: #64748B; border-top: 1px solid #CBD5E1; padding-top: 8px;">Software de Manufactura • 3dBimFab</div>
          </div>

          <div style="flex: 1; border: 1px dashed #94A3B8; border-radius: 16px; padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="font-size: 12px; color: #64748B; font-weight: 600;">POR EL CLIENTE</div>
            <div style="margin: 20px 0; font-family: 'Prompt', sans-serif; font-size: 16px; font-weight: 700; color: #0F172A;">Móveis Henn</div>
            <div style="font-size: 12px; color: #64748B; border-top: 1px solid #CBD5E1; padding-top: 8px;">Aceptación Propuesta Piloto</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Propuesta Comercial Exclusiva • Móveis Henn</div>
        <div>Página 08 / 08 • Ecosistema Tecnológico Mario Mojica • WhatsApp: +57 311 764 6907</div>
      </div>
    </div>
  </section>

</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generado exitosamente en: {html_path}")

# Compilar a PDF con Chrome Headless
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if os.path.exists(chrome_path):
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--print-to-pdf-no-header",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    print("Compilando PDF con Chrome Headless...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024.0
        print(f"✅ PDF generado exitosamente en: {pdf_path} ({size_kb:.1f} KB)")
    else:
        print(f"❌ Error al compilar PDF: {result.stderr}")
else:
    print("Chrome no encontrado en la ruta esperada.")

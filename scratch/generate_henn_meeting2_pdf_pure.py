import os
import subprocess
import shutil
import base64

# ==============================================================================
# LEER LOGOTIPOS NATIVOS EN SVG DESDE LA CARPETA PUBLICIDAD
# ==============================================================================
with open(r'c:\Desarrollo\mmapp\publicidad\Logo_MM_en.svg', 'rb') as f:
    mm_b64 = base64.b64encode(f.read()).decode('utf-8')

with open(r'c:\Desarrollo\mmapp\publicidad\Logo_3BF.svg', 'rb') as f:
    tbf_b64 = base64.b64encode(f.read()).decode('utf-8')

img_mm_src = f"data:image/svg+xml;base64,{mm_b64}"
img_3bf_src = f"data:image/svg+xml;base64,{tbf_b64}"

# ==============================================================================
# CSS Y ESTILOS COMPARTIDOS (Tech Ethos Light Theme + Logotipos Oficiales)
# ==============================================================================
header_css = """
    @page { size: A4 portrait; margin: 8mm 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 9.5px;
      line-height: 1.38;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      margin-bottom: 0px;
    }
    .brand-logos {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-img-mm {
      height: 32px;
      width: auto;
      display: block;
    }
    .logo-divider {
      width: 1px;
      height: 26px;
      background: #CBD5E1;
    }
    .logo-img-3bf {
      height: 28px;
      width: auto;
      display: block;
    }
    .client-header-block {
      text-align: right;
    }
    .client-name {
      font-size: 15px;
      font-weight: 900;
      color: #0088aa;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .client-area {
      font-size: 8px;
      color: #64748B;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 1px;
    }
    .header-cyan-bar {
      height: 2.5px;
      background: #0088aa;
      width: 100%;
      margin-bottom: 9px;
      border-radius: 2px;
    }
    .title-banner {
      background: #F8FAFC;
      border-left: 4px solid #0088aa;
      border-top: 1px solid #E2E8F0;
      border-right: 1px solid #E2E8F0;
      border-bottom: 1px solid #E2E8F0;
      border-radius: 0 6px 6px 0;
      padding: 7px 12px;
      margin-bottom: 9px;
    }
    .banner-title {
      font-size: 12px;
      font-weight: 900;
      color: #0F172A;
      margin: 0 0 2px 0;
      letter-spacing: -0.2px;
    }
    .banner-sub {
      font-size: 9px;
      color: #0088aa;
      font-weight: 700;
      margin: 0;
    }
    .meta-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 9px;
      display: grid;
      grid-template-columns: 1.2fr 1.8fr 1fr;
      font-size: 9px;
      gap: 8px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 7px;
      margin-bottom: 9px;
    }
    .kpi-card {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 6px 9px;
    }
    .kpi-card.highlight {
      background: #ECFEFF;
      border-color: #A5F3FC;
    }
    .kpi-card.success {
      background: #ECFDF5;
      border-color: #A7F3D0;
    }
    .kpi-title { font-size: 8px; font-weight: bold; color: #64748B; text-transform: uppercase; }
    .kpi-value { font-size: 14px; font-weight: 900; color: #0F172A; margin: 2px 0 1px; }
    .kpi-sub { font-size: 8px; color: #64748B; }
    
    h3 {
      font-size: 9.5px;
      font-weight: 800;
      color: #0F172A;
      margin: 7px 0 3px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-left: 2.5px solid #0088aa;
      padding-left: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 7px;
      font-size: 8.5px;
    }
    th {
      background: #F1F5F9;
      color: #0F172A;
      font-weight: 700;
      padding: 3.5px 5px;
      border: 1px solid #E2E8F0;
      text-align: left;
    }
    td {
      padding: 3px 5px;
      border: 1px solid #E2E8F0;
      color: #334155;
    }
    .total-row {
      background: #F8FAFC;
      font-weight: 800;
      color: #0F172A;
    }
    .box-container {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 6px 9px;
      margin-bottom: 7px;
    }
    .box-title {
      font-weight: 800;
      color: #0088aa;
      font-size: 9px;
      margin-bottom: 2px;
    }
    .box-text {
      font-size: 8.5px;
      color: #334155;
      margin: 0 0 2px 0;
    }
    ul {
      margin: 2px 0 3px 14px;
      padding: 0;
    }
    li {
      margin-bottom: 1.5px;
      font-size: 8.5px;
      color: #334155;
    }
    .footer {
      margin-top: 7px;
      border-top: 1px solid #E2E8F0;
      padding-top: 4px;
      font-size: 7.5px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
"""

# ==============================================================================
# 1. HTML PORTUGUÊS DO BRASIL (100% PURO COM LOGOTIPOS REAIS)
# ==============================================================================
html_pt = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ata de Reunião Técnica & Levantamento de Custos - Móveis Henn</title>
  <style>
{header_css}
  </style>
</head>
<body>
  <div class="top-header">
    <div class="brand-logos">
      <img src="{img_mm_src}" alt="Mario Mojica Logo" class="logo-img-mm" />
      <div class="logo-divider"></div>
      <img src="{img_3bf_src}" alt="3dBimFab Logo" class="logo-img-3bf" />
    </div>
    <div class="client-header-block">
      <div class="client-name">Móveis Henn</div>
      <div class="client-area">ENGENHARIA DE PRODUTO & P&D INDUSTRIAL</div>
    </div>
  </div>

  <div class="header-cyan-bar"></div>

  <div class="title-banner">
    <div class="banner-title">Levantamento de Custos de P&D, Manuais 3D & Validação 3dBimFab</div>
    <div class="banner-sub">Ata Proativa & Memória Técnica: Análise Operacional, Gargalo Promob e Proposta de Economia (-30%)</div>
  </div>

  <div class="meta-box">
    <div><strong>Cliente:</strong> Móveis Henn (P&D / Engenharia)</div>
    <div><strong>Participantes:</strong> Marcos Unnass (P&D) & Mario Mojica (CEO)</div>
    <div><strong>Data da Sessão:</strong> 28 de Agosto de 2026 (53 min)</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Custo Atual Operação Henn</div>
      <div class="kpi-value">R$ 154.090,91</div>
      <div class="kpi-sub">Média: R$ 1.926,14 / manual (80 manuais/ano)</div>
    </div>

    <div class="kpi-card highlight">
      <div class="kpi-title">Proposta Mario Mojica (-30%)</div>
      <div class="kpi-value" style="color: #0088aa;">R$ 107.863,64</div>
      <div class="kpi-sub">R$ 1.348,30 / manual 3D interativo + QR</div>
    </div>

    <div class="kpi-card success">
      <div class="kpi-title" style="color: #059669;">Economia Líquida Anual</div>
      <div class="kpi-value" style="color: #059669;">+R$ 46.227,27</div>
      <div class="kpi-sub">Economia de +R$ 577,84 por cada produto</div>
    </div>
  </div>

  <h3>1. Matriz de Custos Auditada de P&D (Base 80 Manuais/Ano)</h3>
  <table>
    <thead>
      <tr>
        <th>Item / Recurso</th>
        <th>Detalhamento da Operação Henn</th>
        <th style="text-align: center;">Qtd</th>
        <th style="text-align: right;">Custo Unitário (R$)</th>
        <th style="text-align: right;">Total Anual (R$)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Equipe de P&D</strong></td>
        <td>Projetistas Técnicos CLT + Encargos Sociais</td>
        <td style="text-align: center;">2 pessoas</td>
        <td style="text-align: right;">R$ 6.000,00 /mês</td>
        <td style="text-align: right; font-weight: bold;">R$ 144.000,00</td>
      </tr>
      <tr>
        <td><strong>Software 3D</strong></td>
        <td>Licenças Anuais SketchUp Pro / Studio</td>
        <td style="text-align: center;">2 licenças</td>
        <td style="text-align: right;">R$ 1.200,00 /ano</td>
        <td style="text-align: right;">R$ 2.400,00</td>
      </tr>
      <tr>
        <td><strong>Software 2D</strong></td>
        <td>Licenças Anuais Adobe CC / InDesign</td>
        <td style="text-align: center;">2 licenças</td>
        <td style="text-align: right;">R$ 1.800,00 /ano</td>
        <td style="text-align: right;">R$ 3.600,00</td>
      </tr>
      <tr>
        <td><strong>Suporte & SAC</strong></td>
        <td>Correções técnicas e retrabalho de montagem</td>
        <td style="text-align: center;">10 h/mês</td>
        <td style="text-align: right;">R$ 34,09 /hora</td>
        <td style="text-align: right;">R$ 4.090,91</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" style="text-align: right;">TOTAL CUSTO ANUAL ATUAL DA HENN:</td>
        <td style="text-align: right; font-size: 9.5px;">R$ 154.090,91</td>
      </tr>
      <tr class="total-row" style="background: #ECFEFF; color: #0088aa;">
        <td colspan="4" style="text-align: right;">PROPOSTA MARIO MOJICA (-30% ECONOMIA GARANTIDA):</td>
        <td style="text-align: right; font-size: 9.5px;">R$ 107.863,64</td>
      </tr>
    </tbody>
  </table>

  <h3>2. Tabela Ponderada por Complexidade de Produto</h3>
  <table>
    <thead>
      <tr>
        <th>Faixa de Peças / Categoria</th>
        <th style="text-align: center;">Fator</th>
        <th style="text-align: right;">Custo Henn Atual</th>
        <th style="text-align: right;">Proposta Mario (-30%)</th>
        <th style="text-align: right;">Economia Henn</th>
        <th>Exemplos no Catálogo Henn</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pequeno:</strong> Até 10 peças (~1 dia)</td>
        <td style="text-align: center;">0.65x</td>
        <td style="text-align: right;">R$ 1.251,99</td>
        <td style="text-align: right; font-weight: bold; color: #0088aa;">R$ 876,39</td>
        <td style="text-align: right; color: #059669;">+R$ 375,60</td>
        <td>Criado-mudo, nichos, painéis simples</td>
      </tr>
      <tr style="background: #F0FDFA;">
        <td><strong>Médio:</strong> 11 a 24 peças (~1.5 dias / Média Henn)</td>
        <td style="text-align: center;">1.00x</td>
        <td style="text-align: right;">R$ 1.926,14</td>
        <td style="text-align: right; font-weight: bold; color: #0088aa;">R$ 1.348,30</td>
        <td style="text-align: right; color: #059669;">+R$ 577,84</td>
        <td><strong>Cômoda Ravena</strong>, racks, buffets</td>
      </tr>
      <tr>
        <td><strong>Grande:</strong> 25 a 40 peças (~2 dias)</td>
        <td style="text-align: center;">1.35x</td>
        <td style="text-align: right;">R$ 2.600,28</td>
        <td style="text-align: right; font-weight: bold; color: #0088aa;">R$ 1.820,20</td>
        <td style="text-align: right; color: #059669;">+R$ 780,09</td>
        <td>Roupeiro 6 portas, cozinhas moduladas</td>
      </tr>
    </tbody>
  </table>

  <h3>3. Diagnóstico Técnico: Gargalo Promob ➔ SketchUp e Solução 3dBimFab</h3>
  <div class="box-container">
    <div class="box-title">🚨 O Gargalo Atual Identificado:</div>
    <div class="box-text">
      O Promob torna-se excessivamente lento quando são inseridas ferragens menores (cantoneiras, pregos de fundo, parafusos secundários). Por essa razão, a engenharia da Henn omite até 15% das ferragens no Promob e finaliza no SketchUp e InDesign, gerando contagem manual humana e risco de divergência na lista de materiais (BOM).
    </div>
    <div class="box-title" style="margin-top: 4px;">💡 A Solução Paramétrica com 3dBimFab & Modelagem Digital:</div>
    <div class="box-text">
      O motor <strong>3dBimFab</strong> gerencia os modelos por <em>instâncias paramétricas leves</em>, automatizando o cálculo matemático de ferragens em tempo real sem sobrecarregar o 3D Web. Isso garante um <strong>Gêmeo Digital 100% exato</strong> com eliminação total do erro de contagem manual. Como diferencial estratégico frente a softwares de assinatura fechada, a Móveis Henn mantém a <strong>posse e propriedade perpétua de seus arquivos e modelos 3D</strong>, assegurando total soberania sobre seus projetos.
    </div>
  </div>

  <h3>4. Próximos Passos & Cronograma Oficial</h3>
  <ul>
    <li><strong>Envio de Arquivos Cômoda Ravena:</strong> Marcos enviará os arquivos DWG, SketchUp (com explosões) e InDesign para modelagem 3D.</li>
    <li><strong>Alinhamento com Marketing:</strong> Marcos conversará com a equipe de Marketing (responsável pelos vídeos de montagem no showroom) para integrar os manuais 3D à estratégia visual junto à diretoria (Rudgeri Henkel).</li>
    <li><strong>Férias de Marcos:</strong> 03 a 11 de Setembro de 2026.</li>
    <li><strong>Desenvolvimento do Piloto:</strong> Mario Mojica configurará o modelo 3dBimFab e o Manual 3D Interativo com assistência por voz.</li>
    <li><strong>Apresentação em Tempo Real (Pós 15 de Setembro):</strong> Reunião ao vivo com Marcos Unnass, Jonas Borck e um especialista da <strong>área de Sistemas/TI da Henn</strong> para validação técnica e início do <strong>Piloto de 3 meses</strong>.</li>
  </ul>

  <div class="footer">
    <div><strong>Mario Mojica</strong> | mariomojica.com | 3dBimFab Engine</div>
    <div>Documento Técnico Confidencial B2B | Móveis Henn | 28/08/2026</div>
  </div>
</body>
</html>"""

# ==============================================================================
# 2. HTML ESPAÑOL (100% PURO COM LOGOTIPOS REAIS)
# ==============================================================================
html_es = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acta de Reunión Técnica & Levantamiento de Costos - Móveis Henn</title>
  <style>
{header_css}
  </style>
</head>
<body>
  <div class="top-header">
    <div class="brand-logos">
      <img src="{img_mm_src}" alt="Mario Mojica Logo" class="logo-img-mm" />
      <div class="logo-divider"></div>
      <img src="{img_3bf_src}" alt="3dBimFab Logo" class="logo-img-3bf" />
    </div>
    <div class="client-header-block">
      <div class="client-name">Móveis Henn</div>
      <div class="client-area">INGENIERÍA DE PRODUCTO & I+D INDUSTRIAL</div>
    </div>
  </div>

  <div class="header-cyan-bar"></div>

  <div class="title-banner">
    <div class="banner-title">Levantamiento de Costos de P&D, Manuales 3D & Validación 3dBimFab</div>
    <div class="banner-sub">Acta Proactiva & Memoria Técnica: Análisis Operacional, Cuello de Botella Promob y Propuesta de Ahorro (-30%)</div>
  </div>

  <div class="meta-box">
    <div><strong>Cliente:</strong> Móveis Henn (P&D / Ingeniería)</div>
    <div><strong>Participantes:</strong> Marcos Unnass (P&D) & Mario Mojica (CEO)</div>
    <div><strong>Fecha de la Sesión:</strong> 28 de Agosto de 2026 (53 min)</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Costo Actual Operación Henn</div>
      <div class="kpi-value">R$ 154.090,91</div>
      <div class="kpi-sub">Promedio: R$ 1.926,14 / manual (80 manuales/año)</div>
    </div>

    <div class="kpi-card highlight">
      <div class="kpi-title">Propuesta Mario Mojica (-30%)</div>
      <div class="kpi-value" style="color: #0088aa;">R$ 107.863,64</div>
      <div class="kpi-sub">R$ 1.348,30 / manual 3D interactivo + QR</div>
    </div>

    <div class="kpi-card success">
      <div class="kpi-title" style="color: #059669;">Ahorro Neto Anual</div>
      <div class="kpi-value" style="color: #059669;">+R$ 46.227,27</div>
      <div class="kpi-sub">Ahorro de +R$ 577,84 por cada producto</div>
    </div>
  </div>

  <h3>1. Matriz de Costos Auditada de P&D (Base 80 Manuales/Año)</h3>
  <table>
    <thead>
      <tr>
        <th>Ítem / Recurso</th>
        <th>Detalle de la Operación Henn</th>
        <th style="text-align: center;">Cant</th>
        <th style="text-align: right;">Costo Unitario (R$)</th>
        <th style="text-align: right;">Total Anual (R$)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Equipo de P&D</strong></td>
        <td>Proyectistas Técnicos CLT + Cargas Sociales</td>
        <td style="text-align: center;">2 personas</td>
        <td style="text-align: right;">R$ 6.000,00 /mes</td>
        <td style="text-align: right; font-weight: bold;">R$ 144.000,00</td>
      </tr>
      <tr>
        <td><strong>Software 3D</strong></td>
        <td>Licencias Anuales SketchUp Pro / Studio</td>
        <td style="text-align: center;">2 licencias</td>
        <td style="text-align: right;">R$ 1.200,00 /año</td>
        <td style="text-align: right;">R$ 2.400,00</td>
      </tr>
      <tr>
        <td><strong>Software 2D</strong></td>
        <td>Licencias Anuales Adobe CC / InDesign</td>
        <td style="text-align: center;">2 licencias</td>
        <td style="text-align: right;">R$ 1.800,00 /año</td>
        <td style="text-align: right;">R$ 3.600,00</td>
      </tr>
      <tr>
        <td><strong>Soporte & SAC</strong></td>
        <td>Correcciones técnicas y retrabajo de ensamble</td>
        <td style="text-align: center;">10 h/mes</td>
        <td style="text-align: right;">R$ 34,09 /hora</td>
        <td style="text-align: right;">R$ 4.090,91</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" style="text-align: right;">TOTAL COSTO ANUAL ACTUAL DE HENN:</td>
        <td style="text-align: right; font-size: 9.5px;">R$ 154.090,91</td>
      </tr>
      <tr class="total-row" style="background: #ECFEFF; color: #0088aa;">
        <td colspan="4" style="text-align: right;">PROPUESTA MARIO MOJICA (-30% AHORRO GARANTIZADO):</td>
        <td style="text-align: right; font-size: 9.5px;">R$ 107.863,64</td>
      </tr>
    </tbody>
  </table>

  <h3>2. Tabla Ponderada por Complejidad de Producto</h3>
  <table>
    <thead>
      <tr>
        <th>Rango de Piezas / Categoría</th>
        <th style="text-align: center;">Factor</th>
        <th style="text-align: right;">Costo Henn Actual</th>
        <th style="text-align: right;">Propuesta Mario (-30%)</th>
        <th style="text-align: right;">Ahorro Henn</th>
        <th>Ejemplos en Catálogo Henn</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pequeño:</strong> Hasta 10 piezas (~1 día)</td>
        <td style="text-align: center;">0.65x</td>
        <td style="text-align: right;">R$ 1.251,99</td>
        <td style="text-align: right; font-weight: bold; color: #0088aa;">R$ 876,39</td>
        <td style="text-align: right; color: #059669;">+R$ 375,60</td>
        <td>Mesas de noche, nichos, paneles simples</td>
      </tr>
      <tr style="background: #F0FDFA;">
        <td><strong>Mediano:</strong> 11 a 24 piezas (~1.5 días / Promedio Henn)</td>
        <td style="text-align: center;">1.00x</td>
        <td style="text-align: right;">R$ 1.926,14</td>
        <td style="text-align: right; font-weight: bold; color: #0088aa;">R$ 1.348,30</td>
        <td style="text-align: right; color: #059669;">+R$ 577,84</td>
        <td><strong>Cómoda Ravena</strong>, racks, buffets</td>
      </tr>
      <tr>
        <td><strong>Grande:</strong> 25 a 40 piezas (~2 días)</td>
        <td style="text-align: center;">1.35x</td>
        <td style="text-align: right;">R$ 2.600,28</td>
        <td style="text-align: right; font-weight: bold; color: #0088aa;">R$ 1.820,20</td>
        <td style="text-align: right; color: #059669;">+R$ 780,09</td>
        <td>Ropero 6 puertas, cocinas moduladas</td>
      </tr>
    </tbody>
  </table>

  <h3>3. Diagnóstico Técnico: Cuello de Botella Promob ➔ SketchUp y Solución 3dBimFab</h3>
  <div class="box-container">
    <div class="box-title">🚨 El Cuello de Botella Actual Identificado:</div>
    <div class="box-text">
      Promob se vuelve excesivamente lento cuando se insertan herrajes menores (cantoneras, puntillas de espaldar, tornillos secundarios). Por esta razón, la ingeniería de Henn omite hasta un 15% de los herrajes en Promob y finaliza en SketchUp e InDesign, generando conteo manual humano y riesgo de discrepancias en la lista de materiales (BOM).
    </div>
    <div class="box-title" style="margin-top: 4px;">💡 La Solución Paramétrica con 3dBimFab & Modelado Digital:</div>
    <div class="box-text">
      El motor <strong>3dBimFab</strong> gestiona los modelos mediante <em>instancias paramétricas ligeras</em>, automatizando el cálculo matemático de herrajes en tiempo real sin sobrecargar el 3D Web. Esto garantiza un <strong>Gemelo Digital 100% exacto</strong> con eliminación total del error de conteo manual. Como diferencial estratégico frente a plataformas de suscripción cerrada, Móveis Henn mantiene la <strong>posesión y propiedad perpetua de sus archivos y modelos 3D</strong>, garantizando total soberanía sobre sus proyectos.
    </div>
  </div>

  <h3>4. Próximos Pasos & Cronograma Oficial</h3>
  <ul>
    <li><strong>Envío de Archivos Cómoda Ravena:</strong> Marcos enviará los archivos DWG, SketchUp (con explosiones) e InDesign para modelado 3D.</li>
    <li><strong>Alineación con Marketing:</strong> Marcos dialogará con el equipo de Marketing (responsable de los videos de montaje en el showroom) para integrar los manuales 3D a la estrategia visual ante la directiva (Rudgeri Henkel).</li>
    <li><strong>Vacaciones de Marcos:</strong> 03 al 11 de Septiembre de 2026.</li>
    <li><strong>Desarrollo del Piloto:</strong> Mario Mojica configurará el modelo 3dBimFab y el Manual 3D Interactivo con asistencia por voz.</li>
    <li><strong>Presentación en Tiempo Real (Post 15 de Septiembre):</strong> Reunión en vivo con Marcos Unnass, Jonas Borck y un especialista del <strong>área de Sistemas/TI de Henn</strong> para validación técnica e inicio del <strong>Piloto de 3 meses</strong>.</li>
  </ul>

  <div class="footer">
    <div><strong>Mario Mojica</strong> | mariomojica.com | 3dBimFab Engine</div>
    <div>Documento Técnico Confidencial B2B | Móveis Henn | 28/08/2026</div>
  </div>
</body>
</html>"""

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# Escribir HTMLs temporales
tmp_html_pt = r'c:\Desarrollo\mmapp\temporal\Ata_Reuniao_Henn_Custos_PT.html'
tmp_html_es = r'c:\Desarrollo\mmapp\temporal\Ata_Reuniao_Henn_Custos_ES.html'

with open(tmp_html_pt, 'w', encoding='utf-8') as f:
    f.write(html_pt)
with open(tmp_html_es, 'w', encoding='utf-8') as f:
    f.write(html_es)

pdf_pt_dst = r'c:\Desarrollo\mmapp\Clientes\Henn\reuniones\2026-08-28_Reunion_02_Levantamiento_Costos_Moveis_Henn_PT.pdf'
pdf_es_dst = r'c:\Desarrollo\mmapp\Clientes\Henn\reuniones\2026-08-28_Reunion_02_Levantamiento_Costos_Moveis_Henn_ES.pdf'

cmd_pt = f'"{edge_path}" --headless --disable-gpu --print-to-pdf="{pdf_pt_dst}" --no-pdf-header-footer "{tmp_html_pt}"'
cmd_es = f'"{edge_path}" --headless --disable-gpu --print-to-pdf="{pdf_es_dst}" --no-pdf-header-footer "{tmp_html_es}"'

subprocess.run(cmd_pt, shell=True, check=True)
subprocess.run(cmd_es, shell=True, check=True)

print('Compiled official PDFs with real SVG logos successfully!')

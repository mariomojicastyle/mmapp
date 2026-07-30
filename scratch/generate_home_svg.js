const fs = require('fs');
const path = require('path');

const outputPath = 'C:\\Desarrollo\\mmapp\\Publicaciones\\09_Graficas_Home_3D.svg';

// Helper SVG Defs for logosymbol & grid pattern/lines
const svgDefs = `
<defs>
  <!-- Gradient Accent -->
  <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#00F2FE"/>
    <stop offset="100%" stop-color="#0088AA"/>
  </linearGradient>

  <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#EF4444"/>
    <stop offset="100%" stop-color="#DC2626"/>
  </linearGradient>

  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#38BDF8"/>
    <stop offset="100%" stop-color="#0284C7"/>
  </linearGradient>

  <!-- Drop Shadow Filters -->
  <filter id="shadowSoft" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.06"/>
  </filter>
  <filter id="shadowCard" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#000000" flood-opacity="0.08"/>
  </filter>
  <filter id="shadowDark" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="14" stdDeviation="28" flood-color="#000000" flood-opacity="0.25"/>
  </filter>

  <!-- Official Mario Mojica Logosymbol -->
  <g id="logosimbolo">
    <path d="M 0,-16 L 14,12 L 5,12 L 0,-2 L -5,12 L -14,12 Z" fill="#0088AA"/>
    <circle cx="0" cy="-6" r="3" fill="#00F2FE"/>
  </g>
</defs>
`;

// Helper function to build grid lines for background
function buildGridLines(width, height, isDark = false) {
  let lines = '';
  const fineColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,136,170,0.04)';
  const mainColor = isDark ? 'rgba(0,242,254,0.08)' : 'rgba(0,136,170,0.09)';

  // 40px grid
  for (let x = 0; x <= width; x += 40) {
    const isMain = x % 200 === 0;
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${isMain ? mainColor : fineColor}" stroke-width="${isMain ? 1.5 : 0.8}"/>`;
  }
  for (let y = 0; y <= height; y += 40) {
    const isMain = y % 200 === 0;
    lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${isMain ? mainColor : fineColor}" stroke-width="${isMain ? 1.5 : 0.8}"/>`;
  }
  return `<g class="grid-bg">${lines}</g>`;
}

// -------------------------------------------------------------
// PAGE 1: Métricas y Comparativa (El Problema vs La Solución)
// -------------------------------------------------------------
function generatePage1() {
  return `
  <g id="page_1_content" transform="translate(0, 0)">
    <!-- Background -->
    <rect width="1080" height="1080" fill="#F8FAFC" rx="0"/>
    ${buildGridLines(1080, 1080, false)}

    <!-- Top Badge -->
    <rect x="390" y="45" width="300" height="32" rx="16" fill="#E0F2FE"/>
    <text x="540" y="66" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#0284C7" text-anchor="middle" letter-spacing="1">MÉTRICAS CLAVE Y COMPARATIVA</text>

    <!-- Page Title -->
    <text x="540" y="115" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#0F172A" text-anchor="middle">Manual de papel vs. Manual Interactivo 3D</text>

    <!-- 4 METRICS BANNER (ROW) -->
    <g transform="translate(40, 150)">
      <!-- Metric 1 -->
      <g transform="translate(0, 0)">
        <rect width="235" height="160" rx="16" fill="#FFFFFF" filter="url(#shadowSoft)"/>
        <circle cx="117.5" cy="45" r="24" fill="#E0F2FE"/>
        <!-- Trending Down Icon -->
        <path d="M107.5 40 L113.5 46 L117.5 42 L127.5 52 M121.5 52 L127.5 52 L127.5 46" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <text x="117.5" y="100" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0088AA" text-anchor="middle">-60%</text>
        <text x="117.5" y="125" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="#64748B" text-anchor="middle">Reducción de reclamos por armado</text>
      </g>

      <!-- Metric 2 -->
      <g transform="translate(255, 0)">
        <rect width="235" height="160" rx="16" fill="#FFFFFF" filter="url(#shadowSoft)"/>
        <circle cx="117.5" cy="45" r="24" fill="#E0F2FE"/>
        <!-- Phone Off Icon -->
        <path d="M107.5 37 L127.5 57 M111.5 41 C110.5 43 110.5 47 114.5 51 C118.5 55 122.5 55 124.5 54 M123.5 47 L126.5 50" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <text x="117.5" y="100" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0088AA" text-anchor="middle">-45%</text>
        <text x="117.5" y="125" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="#64748B" text-anchor="middle">Llamadas a soporte evitadas</text>
      </g>

      <!-- Metric 3 -->
      <g transform="translate(510, 0)">
        <rect width="235" height="160" rx="16" fill="#FFFFFF" filter="url(#shadowSoft)"/>
        <circle cx="117.5" cy="45" r="24" fill="#E0F2FE"/>
        <!-- Check Circle Icon -->
        <circle cx="117.5" cy="45" r="11" stroke="#0088AA" stroke-width="2.5" fill="none"/>
        <path d="M112.5 45 L116 48.5 L122.5 42" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <text x="117.5" y="100" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0088AA" text-anchor="middle">82%</text>
        <text x="117.5" y="125" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="#64748B" text-anchor="middle">Tasa de finalización de armado</text>
      </g>

      <!-- Metric 4 -->
      <g transform="translate(765, 0)">
        <rect width="235" height="160" rx="16" fill="#FFFFFF" filter="url(#shadowSoft)"/>
        <circle cx="117.5" cy="45" r="24" fill="#E0F2FE"/>
        <!-- Smile Icon -->
        <circle cx="117.5" cy="45" r="11" stroke="#0088AA" stroke-width="2.5" fill="none"/>
        <circle cx="113.5" cy="42" r="1.5" fill="#0088AA"/>
        <circle cx="121.5" cy="42" r="1.5" fill="#0088AA"/>
        <path d="M112.5 48 C114.5 51 120.5 51 122.5 48" stroke="#0088AA" stroke-width="2" stroke-linecap="round" fill="none"/>
        <text x="117.5" y="100" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0088AA" text-anchor="middle">71.9%</text>
        <text x="117.5" y="125" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="#64748B" text-anchor="middle">Experiencia y opiniones positivas</text>
      </g>
    </g>

    <!-- COMPARATIVE SECTION (2 LARGE CARDS) -->
    <g transform="translate(40, 350)">
      <!-- CARD LEFT: EL PROBLEMA -->
      <g transform="translate(0, 0)">
        <rect width="485" height="660" rx="24" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="2" filter="url(#shadowCard)"/>
        
        <!-- Header -->
        <g transform="translate(40, 50)">
          <path d="M15 3 L27 24 L3 24 Z" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="15" y1="11" x2="15" y2="17" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="15" cy="20.5" r="1.5" fill="#DC2626"/>
          <text x="42" y="19" font-family="Inter, sans-serif" font-size="24" font-weight="800" fill="#DC2626">El Problema</text>
        </g>

        <!-- Item 1 -->
        <g transform="translate(40, 130)">
          <circle cx="20" cy="20" r="18" fill="#FEE2E2"/>
          <path d="M14 14 L26 26 M26 14 L14 26" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#991B1B">Manuales impresos confusos e imposibles de seguir</text>
        </g>

        <!-- Item 2 -->
        <g transform="translate(40, 250)">
          <circle cx="20" cy="20" r="18" fill="#FEE2E2"/>
          <path d="M14 14 L26 26 M26 14 L14 26" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#991B1B">Herrajes imposibles de distinguir entre sí</text>
        </g>

        <!-- Item 3 -->
        <g transform="translate(40, 370)">
          <circle cx="20" cy="20" r="18" fill="#FEE2E2"/>
          <path d="M14 14 L26 26 M26 14 L14 26" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#991B1B">Sin feedback del cliente final sobre el proceso</text>
        </g>

        <!-- Item 4 -->
        <g transform="translate(40, 490)">
          <circle cx="20" cy="20" r="18" fill="#FEE2E2"/>
          <path d="M14 14 L26 26 M26 14 L14 26" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#991B1B">Soporte telefónico saturado por dudas de armado</text>
        </g>
      </g>

      <!-- CARD RIGHT: LA SOLUCIÓN (AZUL CORPORATIVO #0088AA / #0284C7) -->
      <g transform="translate(515, 0)">
        <rect width="485" height="660" rx="24" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="2" filter="url(#shadowCard)"/>
        
        <!-- Header -->
        <g transform="translate(40, 50)">
          <path d="M12 2 C8 2 5 5 5 9 C5 12 7 14 9 16 L9 19 L15 19 L15 16 C17 14 19 12 19 9 C19 5 16 2 12 2 Z" fill="none" stroke="#0088AA" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="9" y1="22" x2="15" y2="22" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round"/>
          <text x="36" y="19" font-family="Inter, sans-serif" font-size="24" font-weight="800" fill="#0088AA">La Solución</text>
        </g>

        <!-- Item 1 -->
        <g transform="translate(40, 130)">
          <circle cx="20" cy="20" r="18" fill="#E0F2FE"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#0284C7" stroke-width="2"/>
          <path d="M15 20 L19 24 L25 16" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#0369A1">Guía 3D rotativa paso a paso con animaciones</text>
        </g>

        <!-- Item 2 -->
        <g transform="translate(40, 250)">
          <circle cx="20" cy="20" r="18" fill="#E0F2FE"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#0284C7" stroke-width="2"/>
          <path d="M15 20 L19 24 L25 16" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#0369A1">Resaltado interactivo de cada herraje por toque</text>
        </g>

        <!-- Item 3 -->
        <g transform="translate(40, 370)">
          <circle cx="20" cy="20" r="18" fill="#E0F2FE"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#0284C7" stroke-width="2"/>
          <path d="M15 20 L19 24 L25 16" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#0369A1">Analíticas y reseñas automatizadas por mueble</text>
        </g>

        <!-- Item 4 -->
        <g transform="translate(40, 490)">
          <circle cx="20" cy="20" r="18" fill="#E0F2FE"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#0284C7" stroke-width="2"/>
          <path d="M15 20 L19 24 L25 16" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <text x="56" y="26" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#0369A1">Asistente de voz multilingüe integrado (TTS)</text>
        </g>
      </g>
    </g>

    <!-- Footer Logosymbol -->
    <use href="#logosimbolo" x="1000" y="1030" transform="scale(1.2)"/>
  </g>
  `;
}

// -------------------------------------------------------------
// PAGE 2: Todo lo que necesitas en un solo manual (6 Grid Cards)
// -------------------------------------------------------------
function generatePage2() {
  return `
  <g id="page_2_content" transform="translate(1110, 0)">
    <!-- Background -->
    <rect width="1080" height="1080" fill="#F8FAFC" rx="0"/>
    ${buildGridLines(1080, 1080, false)}

    <!-- Top Badge -->
    <rect x="420" y="55" width="240" height="32" rx="16" fill="#E0F2FE"/>
    <text x="540" y="76" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#0284C7" text-anchor="middle" letter-spacing="1">FUNCIONALIDADES CORE</text>

    <!-- Title & Subtitle -->
    <text x="540" y="135" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0F172A" text-anchor="middle">Todo lo que necesitas en un solo manual</text>
    <text x="540" y="170" font-family="Inter, sans-serif" font-size="16" font-weight="500" fill="#64748B" text-anchor="middle">Cada detalle pensado para reducir fricción y elevar la experiencia del cliente final.</text>

    <!-- 6 CARDS GRID (3 cols x 2 rows) -->
    <g transform="translate(40, 220)">
      <!-- ROW 1 -->

      <!-- Card 1: TTS -->
      <g transform="translate(0, 0)">
        <rect width="310" height="360" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>
        <rect x="35" y="35" width="56" height="56" rx="16" fill="#E0F2FE"/>
        <!-- Voice Icon -->
        <path d="M55 53 C55 48 60 45 65 45 C70 45 75 48 75 53 M65 59 C61 59 58 65 65 65 C72 65 69 59 65 59 Z" fill="none" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M78 50 C81 53 81 57 78 60" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <text x="35" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Audio Guía Multilingüe (TTS)</text>
        <text x="35" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="35" dy="0">Locución profesional en español</tspan>
          <tspan x="35" dy="24">e inglés generada por IA. Tu</tspan>
          <tspan x="35" dy="24">cliente solo escucha y arma,</tspan>
          <tspan x="35" dy="24">sin necesidad de leer.</tspan>
        </text>
      </g>

      <!-- Card 2: AR -->
      <g transform="translate(345, 0)">
        <rect width="310" height="360" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>
        <rect x="35" y="35" width="56" height="56" rx="16" fill="#E0F2FE"/>
        <!-- Cube AR Icon -->
        <path d="M63 48 L73 53 L73 65 L63 70 L53 65 L53 53 Z M53 53 L63 58 L73 53 M63 58 L63 70" fill="none" stroke="#0088AA" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M49 49 L49 45 L53 45 M73 45 L77 45 L77 49 M77 69 L77 73 L73 73 M53 73 L49 73 L49 69" stroke="#0088AA" stroke-width="2" stroke-linecap="round" fill="none"/>
        <text x="35" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Realidad Aumentada Nativa</text>
        <text x="35" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="35" dy="0">El cliente proyecta el mueble en</tspan>
          <tspan x="35" dy="24">su casa desde el navegador. Sin</tspan>
          <tspan x="35" dy="24">apps, sin descargas, sin</tspan>
          <tspan x="35" dy="24">fricción.</tspan>
        </text>
      </g>

      <!-- Card 3: Herrajes -->
      <g transform="translate(690, 0)">
        <rect width="310" height="360" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>
        <rect x="35" y="35" width="56" height="56" rx="16" fill="#E0F2FE"/>
        <!-- Hammer Icon -->
        <path d="M54 52 L62 44 L68 50 L60 58 Z M62 44 L70 47 L67 55 M57 55 L70 68" fill="none" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="35" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Identificador de Herrajes</text>
        <text x="35" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="35" dy="0">Cada tornillo, perno y bisagra se</tspan>
          <tspan x="35" dy="24">resalta visualmente con</tspan>
          <tspan x="35" dy="24">cantidad exacta por paso de</tspan>
          <tspan x="35" dy="24">armado.</tspan>
        </text>
      </g>

      <!-- ROW 2 -->

      <!-- Card 4: Branding -->
      <g transform="translate(0, 400)">
        <rect width="310" height="360" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>
        <rect x="35" y="35" width="56" height="56" rx="16" fill="#E0F2FE"/>
        <!-- Palette Icon -->
        <circle cx="63" cy="63" r="14" stroke="#0088AA" stroke-width="2.5" fill="none"/>
        <circle cx="58" cy="58" r="2" fill="#0088AA"/>
        <circle cx="68" cy="58" r="2" fill="#0088AA"/>
        <circle cx="56" cy="67" r="2" fill="#0088AA"/>
        <text x="35" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Branding 100% Corporativo</text>
        <text x="35" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="35" dy="0">Tu logo, tus colores, tu identidad.</tspan>
          <tspan x="35" dy="24">El manual se ve como parte de</tspan>
          <tspan x="35" dy="24">tu marca, no de la nuestra.</tspan>
        </text>
      </g>

      <!-- Card 5: QR Code -->
      <g transform="translate(345, 400)">
        <rect width="310" height="360" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>
        <rect x="35" y="35" width="56" height="56" rx="16" fill="#E0F2FE"/>
        <!-- QR Icon -->
        <rect x="52" y="52" width="8" height="8" stroke="#0088AA" stroke-width="2" fill="none"/>
        <rect x="66" y="52" width="8" height="8" stroke="#0088AA" stroke-width="2" fill="none"/>
        <rect x="52" y="66" width="8" height="8" stroke="#0088AA" stroke-width="2" fill="none"/>
        <rect x="66" y="66" width="8" height="8" fill="#0088AA"/>
        <text x="35" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Código QR Autogenerado</text>
        <text x="35" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="35" dy="0">Imprime el QR en la caja del</tspan>
          <tspan x="35" dy="24">producto. El cliente escanea y</tspan>
          <tspan x="35" dy="24">accede al manual al instante.</tspan>
        </text>
      </g>

      <!-- Card 6: PBR -->
      <g transform="translate(690, 400)">
        <rect width="310" height="360" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>
        <rect x="35" y="35" width="56" height="56" rx="16" fill="#E0F2FE"/>
        <!-- Sun PBR Icon -->
        <circle cx="63" cy="63" r="8" stroke="#0088AA" stroke-width="2.5" fill="none"/>
        <path d="M63 48 L63 52 M63 74 L63 78 M48 63 L52 63 M74 63 L78 63 M52 52 L55 55 M71 71 L74 74 M52 74 L55 71 M71 55 L74 52" stroke="#0088AA" stroke-width="2" stroke-linecap="round"/>
        <text x="35" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Escenario 3D Premium (PBR)</text>
        <text x="35" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="35" dy="0">Texturas fotorrealistas de piso y</tspan>
          <tspan x="35" dy="24">paredes con iluminación</tspan>
          <tspan x="35" dy="24">calibrada profesionalmente.</tspan>
        </text>
      </g>
    </g>

    <!-- Footer Logosymbol -->
    <use href="#logosimbolo" x="1000" y="1030" transform="scale(1.2)"/>
  </g>
  `;
}

// -------------------------------------------------------------
// PAGE 3: Toma decisiones basadas en datos reales (Telemetría)
// -------------------------------------------------------------
function generatePage3() {
  return `
  <g id="page_3_content" transform="translate(2220, 0)">
    <!-- Background -->
    <rect width="1080" height="1080" fill="#F8FAFC" rx="0"/>
    ${buildGridLines(1080, 1080, false)}

    <!-- Top Badge -->
    <rect x="40" y="55" width="220" height="32" rx="16" fill="#E0F2FE"/>
    <text x="150" y="76" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#0284C7" text-anchor="middle" letter-spacing="1">DIFERENCIADOR CLAVE</text>

    <!-- Section Title -->
    <text x="40" y="135" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0F172A">Toma decisiones basadas en</text>
    <text x="40" y="175" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0F172A">datos reales de tus clientes</text>

    <!-- LEFT COLUMN: 4 FEATURES LIST -->
    <g transform="translate(40, 240)">
      <!-- Item 1: Funnel -->
      <g transform="translate(0, 0)">
        <rect width="52" height="52" rx="14" fill="#E0F2FE"/>
        <!-- Funnel Icon -->
        <path d="M16 18 L36 18 L27 28 L27 36 L21 34 L21 28 Z" stroke="#0088AA" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <text x="72" y="24" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Embudo de Retención</text>
        <text x="72" y="48" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="72" dy="0">Identifica en qué paso exacto abandonan tus clientes. ¿El paso 8</tspan>
          <tspan x="72" dy="22">tiene 32 abandonos? Audita ese herraje antes de que genere más.</tspan>
        </text>
      </g>

      <!-- Item 2: Completion Rate -->
      <g transform="translate(0, 150)">
        <rect width="52" height="52" rx="14" fill="#E0F2FE"/>
        <!-- Chart Icon -->
        <path d="M16 34 L22 26 L28 30 L36 18" stroke="#0088AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <text x="72" y="24" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Tasa de Finalización</text>
        <text x="72" y="48" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="72" dy="0">Monitorea qué porcentaje de tus clientes termina de armar el</tspan>
          <tspan x="72" dy="22">mueble con éxito.</tspan>
        </text>
      </g>

      <!-- Item 3: Sentiment Analysis -->
      <g transform="translate(0, 290)">
        <rect width="52" height="52" rx="14" fill="#E0F2FE"/>
        <!-- Smile Icon -->
        <circle cx="26" cy="26" r="11" stroke="#0088AA" stroke-width="2.5" fill="none"/>
        <circle cx="22" cy="23" r="1.5" fill="#0088AA"/>
        <circle cx="30" cy="23" r="1.5" fill="#0088AA"/>
        <path d="M21 29 C23 32 29 32 31 29" stroke="#0088AA" stroke-width="2" stroke-linecap="round" fill="none"/>
        <text x="72" y="24" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Análisis de Sentimiento</text>
        <text x="72" y="48" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="72" dy="0">Lee las opiniones reales de tus compradores clasificadas por</tspan>
          <tspan x="72" dy="22">sentimiento positivo, neutral y negativo.</tspan>
        </text>
      </g>

      <!-- Item 4: Device Distribution -->
      <g transform="translate(0, 430)">
        <rect width="52" height="52" rx="14" fill="#E0F2FE"/>
        <!-- Devices Icon -->
        <rect x="15" y="18" width="18" height="14" rx="2" stroke="#0088AA" stroke-width="2" fill="none"/>
        <rect x="27" y="24" width="10" height="14" rx="2" stroke="#0088AA" stroke-width="2" fill="#E0F2FE"/>
        <text x="72" y="24" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Distribución por Dispositivo</text>
        <text x="72" y="48" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="#475569">
          <tspan x="72" dy="0">Conoce si tus clientes usan celular o computadora para optimizar</tspan>
          <tspan x="72" dy="22">la experiencia.</tspan>
        </text>
      </g>
    </g>

    <!-- RIGHT COLUMN: DARK MODE EXECUTIVE DASHBOARD (CARD PREVIEW) -->
    <g transform="translate(560, 220)">
      <rect width="480" height="660" rx="24" fill="#0F172A" filter="url(#shadowDark)"/>

      <!-- Dashboard Header -->
      <circle cx="40" cy="45" r="5" fill="#00F2FE"/>
      <text x="56" y="50" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#94A3B8">Reporte Ejecutivo • Junio 2026</text>

      <!-- Dashboard Metric Card 1: Finalización -->
      <g transform="translate(30, 90)">
        <rect width="420" height="140" rx="16" fill="#1E293B"/>
        <text x="24" y="36" font-family="Inter, sans-serif" font-size="15" font-weight="500" fill="#94A3B8">Tasa de Finalización</text>
        <text x="24" y="80" font-family="Inter, sans-serif" font-size="36" font-weight="800" fill="#00F2FE">82%</text>
        <!-- Progress Bar (82%) -->
        <rect x="24" y="102" width="372" height="10" rx="5" fill="#334155"/>
        <rect x="24" y="102" width="305" height="10" rx="5" fill="url(#brandGrad)"/>
      </g>

      <!-- Dashboard Metric Card 2: Abandonos Paso 8 -->
      <g transform="translate(30, 250)">
        <rect width="420" height="140" rx="16" fill="#1E293B"/>
        <text x="24" y="36" font-family="Inter, sans-serif" font-size="15" font-weight="500" fill="#94A3B8">Abandonos Paso 8</text>
        <text x="24" y="80" font-family="Inter, sans-serif" font-size="36" font-weight="800" fill="#EF4444">32</text>
        <!-- Progress Bar (Red/Coral) -->
        <rect x="24" y="102" width="372" height="10" rx="5" fill="#334155"/>
        <rect x="24" y="102" width="140" height="10" rx="5" fill="url(#redGrad)"/>
      </g>

      <!-- Dashboard Metric Card 3: Sentimiento Positivo -->
      <g transform="translate(30, 410)">
        <rect width="420" height="140" rx="16" fill="#1E293B"/>
        <text x="24" y="36" font-family="Inter, sans-serif" font-size="15" font-weight="500" fill="#94A3B8">Sentimiento Positivo</text>
        <text x="24" y="80" font-family="Inter, sans-serif" font-size="36" font-weight="800" fill="#38BDF8">74%</text>
        <!-- Progress Bar (Blue/Cyan) -->
        <rect x="24" y="102" width="372" height="10" rx="5" fill="#334155"/>
        <rect x="24" y="102" width="275" height="10" rx="5" fill="url(#blueGrad)"/>
      </g>

      <!-- Bottom Caption -->
      <text x="240" y="615" font-family="Inter, sans-serif" font-size="13" font-style="italic" font-weight="400" fill="#64748B" text-anchor="middle">Vista previa del reporte PDF automatizado</text>
    </g>

    <!-- Footer Logosymbol -->
    <use href="#logosimbolo" x="1000" y="1030" transform="scale(1.2)"/>
  </g>
  `;
}

// -------------------------------------------------------------
// PAGE 4: Tu catálogo bajo control absoluto (Portal Exclusivo B2B)
// -------------------------------------------------------------
function generatePage4() {
  return `
  <g id="page_4_content" transform="translate(0, 1110)">
    <!-- Background -->
    <rect width="1080" height="1080" fill="#F8FAFC" rx="0"/>
    ${buildGridLines(1080, 1080, false)}

    <!-- Top Badge -->
    <rect x="40" y="55" width="220" height="32" rx="16" fill="#E0F2FE"/>
    <text x="150" y="76" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#0284C7" text-anchor="middle" letter-spacing="1">PORTAL EXCLUSIVO B2B</text>

    <!-- Section Title -->
    <text x="40" y="135" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#0F172A">Tu catálogo bajo control absoluto</text>

    <!-- LEFT COLUMN: DARK ADMIN INTERFACE PREVIEW -->
    <g transform="translate(40, 220)">
      <rect width="480" height="660" rx="24" fill="#0F172A" filter="url(#shadowDark)"/>

      <!-- Window dots -->
      <circle cx="35" cy="35" r="6" fill="#EF4444"/>
      <circle cx="55" cy="35" r="6" fill="#F59E0B"/>
      <circle cx="75" cy="35" r="6" fill="#00F2FE"/>

      <!-- Sidebar -->
      <rect x="20" y="70" width="60" height="560" rx="12" fill="#1E293B"/>
      <!-- Sidebar icons -->
      <rect x="36" y="95" width="28" height="28" rx="8" fill="#0088AA"/>
      <rect x="36" y="145" width="28" height="28" rx="8" fill="#334155"/>
      <rect x="36" y="195" width="28" height="28" rx="8" fill="#334155"/>
      <rect x="36" y="245" width="28" height="28" rx="8" fill="#334155"/>

      <!-- Admin Box 1: Identidad Visual -->
      <g transform="translate(100, 90)">
        <rect width="170" height="240" rx="16" fill="#1E293B"/>
        <!-- Palette icon -->
        <circle cx="35" cy="35" r="10" fill="#0088AA"/>
        <text x="24" y="75" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Identidad Visual</text>

        <!-- Color dots -->
        <circle cx="35" cy="120" r="14" fill="#0088AA"/>
        <circle cx="75" cy="120" r="14" fill="#0284C7"/>
        <circle cx="115" cy="120" r="14" fill="#F97316"/>
      </g>

      <!-- Admin Box 2: Códigos QR -->
      <g transform="translate(290, 90)">
        <rect width="170" height="240" rx="16" fill="#1E293B"/>
        <!-- QR icon -->
        <rect x="25" y="25" width="20" height="20" rx="4" fill="#0088AA"/>
        <text x="24" y="75" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Códigos QR</text>

        <!-- QR Dashed Frame -->
        <rect x="35" y="105" width="100" height="100" rx="12" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="6,6"/>
        <!-- QR Inner squares -->
        <rect x="55" y="125" width="25" height="25" fill="#00F2FE"/>
        <rect x="85" y="125" width="15" height="15" fill="#00F2FE"/>
        <rect x="55" y="155" width="15" height="15" fill="#00F2FE"/>
        <rect x="75" y="155" width="25" height="25" fill="#00F2FE"/>
      </g>

      <!-- Bottom Card in Admin Preview: Status Banner -->
      <g transform="translate(100, 350)">
        <rect width="360" height="260" rx="16" fill="#1E293B"/>
        <text x="24" y="45" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">Manuales Publicados</text>

        <rect x="24" y="75" width="312" height="40" rx="8" fill="#334155"/>
        <circle cx="44" cy="95" r="6" fill="#00F2FE"/>
        <text x="60" y="100" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#F8FAFC">Mesa Tijuca • Activo (3D PBR)</text>

        <rect x="24" y="130" width="312" height="40" rx="8" fill="#334155"/>
        <circle cx="44" cy="150" r="6" fill="#00F2FE"/>
        <text x="60" y="155" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#F8FAFC">Estantería M00001 • Activo (TTS)</text>

        <rect x="24" y="185" width="312" height="40" rx="8" fill="#334155"/>
        <circle cx="44" cy="205" r="6" fill="#F59E0B"/>
        <text x="60" y="210" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#F8FAFC">Armario RTA • En revisión</text>
      </g>
    </g>

    <!-- RIGHT COLUMN: 4 FEATURE LIST WITH ICONS -->
    <g transform="translate(560, 240)">
      <!-- Item 1: Palette -->
      <g transform="translate(0, 0)">
        <circle cx="28" cy="28" r="24" fill="#E0F2FE"/>
        <!-- Palette icon -->
        <circle cx="28" cy="28" r="11" stroke="#0088AA" stroke-width="2" fill="none"/>
        <circle cx="24" cy="24" r="1.5" fill="#0088AA"/>
        <circle cx="32" cy="24" r="1.5" fill="#0088AA"/>
        <text x="68" y="34" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#1E293B">Personaliza colores, logotipos, textos de ayuda y favicones desde tu panel.</text>
      </g>

      <!-- Item 2: Eye Preview -->
      <g transform="translate(0, 120)">
        <circle cx="28" cy="28" r="24" fill="#E0F2FE"/>
        <!-- Eye icon -->
        <path d="M16 28 C16 28 21 20 28 20 C35 20 40 28 40 28 C40 28 35 36 28 36 C21 36 16 28 16 28 Z" stroke="#0088AA" stroke-width="2" fill="none"/>
        <circle cx="28" cy="28" r="4" fill="#0088AA"/>
        <text x="68" y="34" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#1E293B">Visualiza la previsualización en vivo de tus manuales antes de publicar.</text>
      </g>

      <!-- Item 3: Download QR & PDF -->
      <g transform="translate(0, 240)">
        <circle cx="28" cy="28" r="24" fill="#E0F2FE"/>
        <!-- Download icon -->
        <path d="M28 18 L28 32 M22 26 L28 32 L34 26 M18 36 L38 36" stroke="#0088AA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <text x="68" y="34" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#1E293B">Descarga códigos QR e informes de métricas para tus comités de calidad.</text>
      </g>

      <!-- Item 4: Chat/Fluid communication -->
      <g transform="translate(0, 360)">
        <circle cx="28" cy="28" r="24" fill="#E0F2FE"/>
        <!-- Chat icon -->
        <path d="M18 20 L38 20 L38 32 L26 32 L20 37 L20 32 L18 32 Z" stroke="#0088AA" stroke-width="2" fill="none" stroke-linejoin="round"/>
        <text x="68" y="34" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#1E293B">
          <tspan x="68" dy="0">Comunicación fluida y centralizada. Solicita</tspan>
          <tspan x="68" dy="24">modificaciones técnicas desde la plataforma.</tspan>
        </text>
      </g>
    </g>

    <!-- Footer Logosymbol -->
    <use href="#logosimbolo" x="1000" y="1030" transform="scale(1.2)"/>
  </g>
  `;
}

// -------------------------------------------------------------
// PAGE 5: Integra el manual en 3 simples pasos
// -------------------------------------------------------------
function generatePage5() {
  return `
  <g id="page_5_content" transform="translate(1110, 1110)">
    <!-- Background -->
    <rect width="1080" height="1080" fill="#F8FAFC" rx="0"/>
    ${buildGridLines(1080, 1080, false)}

    <!-- Top Badge -->
    <rect x="420" y="120" width="240" height="32" rx="16" fill="#E0F2FE"/>
    <text x="540" y="141" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#0284C7" text-anchor="middle" letter-spacing="1">PROCESO DE INTEGRACIÓN</text>

    <!-- Title & Subtitle -->
    <text x="540" y="210" font-family="Inter, sans-serif" font-size="38" font-weight="800" fill="#0F172A" text-anchor="middle">Integra el manual en 3 simples pasos</text>
    <text x="540" y="250" font-family="Inter, sans-serif" font-size="18" font-weight="500" fill="#64748B" text-anchor="middle">Sin complicaciones técnicas. Nosotros nos encargamos de todo.</text>

    <!-- Dotted Connecting Line Behind Steps -->
    <line x1="220" y1="460" x2="860" y2="460" stroke="#0088AA" stroke-width="3" stroke-dasharray="8,8"/>

    <!-- 3 STEP CARDS (HORIZONTAL ROW) -->
    <g transform="translate(40, 380)">
      <!-- STEP 1 -->
      <g transform="translate(0, 0)">
        <!-- Circle Badge 1 -->
        <circle cx="150" cy="80" r="40" fill="url(#brandGrad)" filter="url(#shadowSoft)"/>
        <text x="150" y="91" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" text-anchor="middle">1</text>

        <!-- Card Container -->
        <rect y="160" width="300" height="340" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>

        <!-- Title -->
        <text x="150" y="215" font-family="Inter, sans-serif" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">Envíanos tu mueble</text>

        <!-- Subtext -->
        <text x="150" y="260" font-family="Inter, sans-serif" font-size="15" font-weight="400" fill="#64748B" text-anchor="middle">
          <tspan x="150" dy="0">Modelos 3D (3dm, stp, obj,</tspan>
          <tspan x="150" dy="24">fbx, dwg), planos (pdf) y</tspan>
          <tspan x="150" dy="24">fotos de referencia para</tspan>
          <tspan x="150" dy="24">validar acabados y colores.</tspan>
        </text>
      </g>

      <!-- STEP 2 -->
      <g transform="translate(350, 0)">
        <!-- Circle Badge 2 -->
        <circle cx="150" cy="80" r="40" fill="url(#brandGrad)" filter="url(#shadowSoft)"/>
        <text x="150" y="91" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" text-anchor="middle">2</text>

        <!-- Card Container -->
        <rect y="160" width="300" height="340" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>

        <!-- Title -->
        <text x="150" y="215" font-family="Inter, sans-serif" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">Nosotros lo transformamos</text>

        <!-- Subtext -->
        <text x="150" y="260" font-family="Inter, sans-serif" font-size="15" font-weight="400" fill="#64748B" text-anchor="middle">
          <tspan x="150" dy="0">Creamos el modelo 3D</tspan>
          <tspan x="150" dy="24">optimizado, configuramos</tspan>
          <tspan x="150" dy="24">el audio guía y calibramos la</tspan>
          <tspan x="150" dy="24">iluminación PBR.</tspan>
        </text>
      </g>

      <!-- STEP 3 -->
      <g transform="translate(700, 0)">
        <!-- Circle Badge 3 -->
        <circle cx="150" cy="80" r="40" fill="url(#brandGrad)" filter="url(#shadowSoft)"/>
        <text x="150" y="91" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" text-anchor="middle">3</text>

        <!-- Card Container -->
        <rect y="160" width="300" height="340" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadowCard)"/>

        <!-- Title -->
        <text x="150" y="215" font-family="Inter, sans-serif" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">Imprime tu QR y listo</text>

        <!-- Subtext -->
        <text x="150" y="260" font-family="Inter, sans-serif" font-size="15" font-weight="400" fill="#64748B" text-anchor="middle">
          <tspan x="150" dy="0">Descarga el código QR desde</tspan>
          <tspan x="150" dy="24">tu portal, imprímelo en la caja</tspan>
          <tspan x="150" dy="24">y tus clientes acceden al</tspan>
          <tspan x="150" dy="24">instante.</tspan>
        </text>
      </g>
    </g>

    <!-- Footer Logosymbol -->
    <use href="#logosimbolo" x="1000" y="1030" transform="scale(1.2)"/>
  </g>
  `;
}

// -------------------------------------------------------------
// MAIN SVG ASSEMBLY (INKSCAPE MULTI-PAGE FORMAT)
// -------------------------------------------------------------
function buildFullSvg() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="1080"
   height="1080"
   viewBox="0 0 1080 1080"
   version="1.1"
   id="svg_graficas_home"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">

  <sodipodi:namedview
     id="namedview1"
     pagecolor="#ffffff"
     bordercolor="#000000"
     borderopacity="0.25"
     inkscape:showpageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="0"
     inkscape:deskcolor="#d1d1d1"
     inkscape:document-units="px">
    <inkscape:page
       x="0"
       y="0"
       width="1080"
       height="1080"
       id="page1"
       margin="0"
       bleed="0" />
    <inkscape:page
       x="1110"
       y="0"
       width="1080"
       height="1080"
       id="page2" />
    <inkscape:page
       x="2220"
       y="0"
       width="1080"
       height="1080"
       id="page3" />
    <inkscape:page
       x="0"
       y="1110"
       width="1080"
       height="1080"
       id="page4" />
    <inkscape:page
       x="1110"
       y="1110"
       width="1080"
       height="1080"
       id="page5" />
  </sodipodi:namedview>

  ${svgDefs}

  ${generatePage1()}
  ${generatePage2()}
  ${generatePage3()}
  ${generatePage4()}
  ${generatePage5()}

</svg>
`;
}

const finalSvg = buildFullSvg();
fs.writeFileSync(outputPath, finalSvg, 'utf8');
console.log('SVG updated successfully with Corporate Blue palette at:', outputPath);

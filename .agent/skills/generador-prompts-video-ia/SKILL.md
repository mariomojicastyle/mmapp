---
name: generador-prompts-video-ia
description: Experto en dirección de arte cinematográfica y redacción de prompts de ultra-alta calidad para generadores de video con IA (Google Omni Flash, Veo, Sora, Kling, Runway). Garantiza planos cinematográficos, iluminación volumétrica, óptica anamórfica, lenguaje de cámara preciso, cero artefactos, eliminación de rostros cuando se requiera y éxito al primer intento (1-shot success) sin desperdicio de tokens.
---

# 🎬 Generador de Prompts de Video Cinematográfico con IA

## 🎯 Meta
Diseñar, redactar y estructurar prompts de video de grado comercial y cinematográfico (estilo Apple, Porsche, Architectural Digest) para modelos generativos de video IA (Google Omni Flash / Veo / Sora / Kling / Runway Gen-3). Garantiza la más alta fidelidad visual, física de materiales, iluminación volumétrica, lentes ópticos precisos y movimientos de cámara coherentes para lograr un **resultado perfecto a la primera generación (1-shot success)**, optimizando el consumo de tokens y erradicando resultados planos, amorfos o con textos deformados.

---

## 📐 Las 7 Reglas de Oro del Prompting Cinematográfico

Cada vez que el usuario solicite crear un storyboard, guion, escena o prompt para video, el agente DEBE aplicar sin excepción estas 7 capas técnicas:

### 1. Óptica y Cámara (Cinematic Optics)
- **Lentes y Relación de Aspecto:** Especificar siempre la relación (`16:9` o `9:16`), duración (`Xs`), lente (`35mm anamorphic prime lens`, `50mm prime lens`, `macro probe lens`) y profundidad de campo (`shallow depth of field`, `rack focus`, `cinematic bokeh`).
- **Movimiento de Cámara Fluido:** Usar términos de dirección de fotografía real: `smooth slow-motion tracking shot`, `center dolly push-in`, `stately pull-out reveal`, `orbital sweep`, `crane down`.

### 2. Encuadre y Control Humano (Headless / Anti-Glitch Framing)
- Cuando el concepto sea corporativo/B2B o no se requieran rostros: declarar explícitamente `headless camera framing with strictly no visible human faces`, `focusing on hands and workspace desk`, `chest-level framing`, `--no humans` (según el caso).
- **Evitar:** Pedir rostros mirando a cámara o expresiones complejas si no es indispensable, ya que suelen deformar ojos y boca en clips cortos.

### 3. Materialidad Física y Shaders (PBR Textures)
- Reemplazar palabras genéricas ("madera", "metal", "vidrio") por especificaciones físicas que la IA renderiza con trazado de rayos: `scandinavian natural oak with visible timber grain`, `aerospace-grade brushed titanium`, `frosted optical glass with raytraced caustics`, `matte anodized aluminum`, `polished concrete floor with soft ambient reflections`.

### 4. Iluminación y Atmósfera (Volumetric Studio Lighting)
- **Estética de Marca (Tech Ethos):** `Pristine Tech Ethos light theme palette`, `sun-drenched minimalist architectural loft with floor-to-ceiling windows`, `golden morning sunbeams mingling with cool crisp ambient shadows`, `volumetric light dust rays`, `rim lighting`.
- Evitar oscuridad genérica o fondos negros a menos que sea explícitamente un *Obsidian Dark Mode*.

### 5. Efectos Visuales e Hologramas (VFX & Motion Graphics)
- **Transformaciones Fluidas:** En lugar de "aparece un holograma", describir la física de la transición: `magically disintegrating into a luminous swirling vortex of glowing cyan and electric-blue particles`, `expanding laser scan-line`, `reorganizing into razor-sharp wireframe CAD models and glowing semi-transparent glass dashboards with real-time telemetry curves`.
- **Identidad de Marca:** Integrar los colores corporativos: azul cian eléctrico (`#0088aa` / `cyan glow`), ámbar/madera cálida (`warm amber`) y el rojo icónico de marca de **`3dBimFab`**.

### 6. Separación de Texto (Cero Texto Deformado por IA)
- **Regla Crítica:** Los motores de video IA **no saben escribir tipografía pequeña o datos de contacto**. 
- En el prompt de video solo se describen emblemas tridimensionales gigantes o insignias luminosas (`floating 3D emblem "3dBimFab" in precision-milled relief`, `glowing numeric badges "01" and "02"`).
- Los textos complejos, URLs, teléfonos, porcentajes y CTAs se declaran en el guion como **`Texto para CapCut (Overlay Vectorial)`**.

### 7. Motor de Render y Parámetros Finales
- Cerrar siempre el prompt con descriptores de estabilidad de imagen: `high-end commercial grading, 8K resolution, 24fps, rock-solid geometry, photorealistic skin shaders, silent, no dialogue`.

---

## 📋 Estructura Estándar de Salida en Guiones y Storyboards

Para cada escena de video en un guion o solicitud individual, la entrega debe estructurarse en este bloque limpio:

```markdown
### 🎬 Segmento [Número] ([Duración]s) — `[nombre_archivo.mp4]`

- **Locución (ES):** "[Texto exacto de locución con pausas [pausa: X]]"
- **Concepto Visual:** [Explicación narrativa y emocional en español]
- **Prompt Maestro de Video IA (Inglés - Copiar y Pegar):**
```text
[Prompt cinemático en inglés con las 7 capas técnicas aplicadas]
```
- **Texto para CapCut (Overlay Vectorial):** `[TEXTO EN MAYÚSCULAS LIMPIO]`
- **Foley / Efecto de Sonido:** [Descripción del diseño sonoro]
```

---

## 🚫 Lo que NUNCA debe hacerse
- **NUNCA** entregar prompts vagos de 1 sola línea (ej. *"Dos personas dándose la mano en una oficina 3D"*).
- **NUNCA** mezclar estilos contradictorios (ej. ciencia ficción cyberpunk con oficina tradicional de madera).
- **NUNCA** escribir el prompt de video en español (los modelos de difusión de video como Omni Flash, Veo, Sora y Runway procesan y respetan con mucha mayor fidelidad el inglés técnico de cinematografía).
- **NUNCA** forzar a la IA a escribir párrafos de texto dentro del video generado.

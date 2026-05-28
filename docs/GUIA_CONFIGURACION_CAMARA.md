# 📹 Guía de Operación: Configuración de Ángulos de Cámara en Supabase

Esta guía establece el procedimiento estándar para capturar, estructurar y actualizar las coordenadas de la cámara (`cameraPosition` y `cameraTarget`) de forma persistente para cada paso de un manual interactivo 3D.

---

## 🚀 Flujo de Trabajo en 4 Pasos

### Paso 1: Captura de Coordenadas en Caliente
1. Abre el manual 3D en tu navegador local (ej. port 5173).
2. Abre la consola de desarrollo del navegador (**F12**).
3. Utiliza el ratón para rotar, trasladar y hacer zoom en el visor 3D hasta obtener el ángulo óptimo para el paso en el que te encuentras.
4. Observa los logs en la consola del navegador. Verás líneas con el siguiente formato que se imprimen dinámicamente en tiempo real al mover la cámara:
   ```text
   🎥 CÁMARA -> posición: [X, Y, Z] | target: [TX, TY, TZ]
   ```
5. Copia los valores numéricos correspondientes a la **posición** y al **target** del último log impreso.

---

### Paso 2: Identificación del Registro en Supabase
Cada manual de armado 3D dinámico está asociado a un identificador único en la tabla de configuraciones.
* **Tabla de base de datos:** `public.configuraciones_manual`
* **ID de Configuración Activa:** `6a5bcc21-e227-4596-b1e6-3bce6e31a573` (Manual de producción `"M00001"`)
* **ID del Proyecto en Supabase:** `dezaisaunoumhqpssols`

---

### Paso 3: Recuperación y Estructura del JSON `glb_pasos`
Antes de actualizar, debes consultar la estructura actual del campo `glb_pasos` para no sobrescribir configuraciones de otros pasos.

1. Ejecuta la siguiente consulta para obtener el JSON actual:
   ```sql
   SELECT glb_pasos FROM public.configuraciones_manual WHERE id = '6a5bcc21-e227-4596-b1e6-3bce6e31a573';
   ```
2. La estructura del campo `glb_pasos` es un arreglo JSONB como este:
   ```json
   [
     {"step":"00","fileName":"P00.glb","progress":100,"cameraPosition":[-1.855,1.2881,2.4559],"cameraTarget":[-0.3964,-0.5206,0.1974]},
     {"step":"01","fileName":"P01.glb","progress":100,"cameraPosition":[-1.868,0.5159,2.4278],"cameraTarget":[0.0582,-0.2509,0.0717]},
     {"step":"02","fileName":"P02.glb","progress":100},
     {"step":"03","fileName":"P03.glb","progress":100}
   ]
   ```
3. Agrega o edita las llaves `"cameraPosition"` y `"cameraTarget"` en el objeto del paso que estás editando (ej. `"step":"02"`).

---

### Paso 4: Actualización Segura de la Base de Datos (SQL)
Para realizar el `UPDATE` de forma limpia y evitar problemas de parseo sintáctico de comillas simples o dobles en Postgres, **utiliza literales delimitados por dólar (`$$`)**. Esto encapsula el JSON de forma inmune a errores de escape.

Ejecuta el siguiente bloque SQL en el cliente Supabase (usando `execute_sql` o la consola SQL del panel de Supabase):

```sql
UPDATE public.configuraciones_manual 
SET glb_pasos = $$[
  {
    "step": "00",
    "fileName": "P00.glb",
    "progress": 100,
    "cameraPosition": [-1.8550, 1.2881, 2.4559],
    "cameraTarget": [-0.3964, -0.5206, 0.1974]
  },
  {
    "step": "01",
    "fileName": "P01.glb",
    "progress": 100,
    "cameraPosition": [-1.8680, 0.5159, 2.4278],
    "cameraTarget": [0.0582, -0.2509, 0.0717]
  },
  {
    "step": "02",
    "fileName": "P02.glb",
    "progress": 100,
    "cameraPosition": [-1.8164, 0.7570, 1.7456],
    "cameraTarget": [0.0850, -0.3733, 0.1607]
  },
  {
    "step": "03",
    "fileName": "P03.glb",
    "progress": 100
  },
  {
    "step": "04",
    "fileName": "P04.glb",
    "progress": 100
  },
  {
    "step": "05",
    "fileName": "P05.glb",
    "progress": 100
  }
]$$::jsonb 
WHERE id = '6a5bcc21-e227-4596-b1e6-3bce6e31a573';
```

---

## ⚡ Consejos para Futuras Actualizaciones Ultrarrápidas
* **Widget en Vivo:** Puedes visualizar las coordenadas de la cámara en vivo en la esquina superior izquierda de la pantalla usando el widget `CAM POS` en desarrollo.
* **Trazabilidad:** Una vez finalizada la consulta, añade la anotación correspondiente del paso configurado al final de `HISTORICO_DEL_PROYECTO.md` para mantener al equipo sincronizado.

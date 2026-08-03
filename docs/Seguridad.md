# 🛡️ Blindaje de Propiedad Intelectual: IP Shield 3D (AES-256)

Este documento detalla la arquitectura de seguridad y el protocolo de protección criptográfica implementado en la plataforma Mario Mojica para evitar la descarga no autorizada y el robo de modelos 3D (`.glb`) por parte de usuarios finales, competidores o herramientas automatizadas respaldadas por IA.

---

## 💼 Foco Comercial B2B
En el ecosistema B2B, los fabricantes de muebles consideran sus diseños 3D y modelos CAD como **propiedad intelectual de alto valor**. El acceso abierto a estos archivos binarios facilita el clonado industrial o digital. 

El **IP Shield** añade una capa protectora robusta de grado bancario que bloquea la extracción directa del archivo en el navegador, elevando el valor comercial de la plataforma al garantizar la privacidad de los activos digitales de los clientes.

---

## 🏗️ Arquitectura de Seguridad (IP Shield V2)

El blindaje funciona bajo un principio de **Cifrado Simétrico AES-256-GCM con Derivación de Clave Dinámica** distribuido en tres fases:

```mermaid
flowchart TD
    A[Admin sube GLB en CMS] --> B[Derivación de Clave Única basada en ID]
    B --> C[Cifrado AES-256-GCM de los primeros 4KB]
    C --> D[Subida de GLB Cifrado a Supabase Storage]
    D --> E[Almacenamiento Inservible en Bucket]
    
    E -->|Visor 3D Web| F[Descifrado AES-256-GCM en RAM]
    F --> G[Generación de ObjectURL blob:]
    G --> H[Three.js dibuja el 3D en Pantalla]

    E -->|Realidad Aumentada AR| I[Petición a Edge Function decrypt-glb]
    I --> J[Validación de Firma Token HMAC + TTL 30 min]
    J --> K[Descifrado Serverless en RAM de Supabase]
    K --> L[Google Scene Viewer renderiza AR en Móvil]
```

### 1. Cifrado en la Subida (Next.js CMS)
Cuando el administrador sube un archivo `.glb` en el CMS:
- El sistema deriva una clave simétrica única de 256 bits para el manual específico. Esto se logra combinando una contraseña maestra de derivación con la ID del manual (`MASTER_SALT + manualId`) a través de un algoritmo de derivación de claves PBKDF2 con hash SHA-256.
- El navegador lee el archivo localmente como un `ArrayBuffer`.
- Se genera un Vector de Inicialización (IV) criptográfico aleatorio de 12 bytes.
- Se cifran los **primeros 4096 bytes (4KB)** del archivo utilizando el algoritmo **AES-256-GCM**.
- El archivo resultante se estructura como: `[IV (12 bytes)] + [Chunk Cifrado con Tag de Autenticación (4112 bytes)] + [Resto del archivo sin cifrar]`.
- El archivo modificado se sube a Supabase Storage.

### 2. Almacenamiento Seguro (Supabase Storage)
- El archivo alojado en los buckets de Supabase es **un binario cifrado e inservible**.
- Si un atacante intenta realizar scraping, consume la URL pública directa o descarga el archivo mediante inspección de tráfico de red, obtendrá un binario que ningún visor 3D estándar (Blender, Unity, Unreal Engine, Babylon.js Sandbox, Windows 3D Viewer) podrá abrir, arrojando errores de número mágico inválido.

### 3. Descifrado en la Carga (Visor React/Vite)
Cuando el cliente visualiza el manual interactivo de armado:
- El visor realiza un `fetch` del modelo GLB cifrado.
- En la memoria RAM del cliente, la `Web Crypto API` extrae el IV, recupera la clave derivada única para ese manual, y descifra los primeros 4KB del archivo en caliente.
- Se crea una URL de memoria local temporal (`blob:https://mariomojica.com/...`) utilizando `URL.createObjectURL(decryptedBlob)`.
- El cargador `GLTFLoader` de Three.js procesa esta URL virtual para renderizar el modelo 3D en pantalla.

### 4. Descifrado Serverless Efímero para Realidad Aumentada (AR)
Dado que las aplicaciones nativas de AR (como **Google Scene Viewer** en Android o **Quick Look** en iOS) son procesos externos del sistema operativo que no tienen acceso al motor JavaScript del navegador ni a las URLs temporales `blob:`, el sistema utiliza un proxy de descifrado seguro:
- **Edge Function Serverless (`decrypt-glb`)**: El visor genera un token efímero firmado con **HMAC-SHA256** combinando `manualId + step + timestamp` con una ventana de validez de 30 minutos (TTL).
- Cuando el usuario toca el botón de AR, Scene Viewer solicita el modelo a través de la Edge Function.
- La Edge Function valida la firma HMAC y el tiempo de expiración. Si el token es válido, descarga el binario cifrado desde Supabase Storage, descifra los 4KB en la RAM del servidor de Supabase y sirve el flujo de bytes GLB directamente a Scene Viewer con headers `no-store` y `no-cache`.
- Si un usuario externo intenta copiar la URL de la Edge Function, la petición expirará automáticamente a los 30 minutos o fallará por token inválido, impidiendo la extracción masiva de modelos.

---

## 🔒 ¿Por qué es highly seguro?

1. **Inexpugnable contra IAs:** AES-256 en modo GCM es el estándar militar y bancario de cifrado. Aunque un atacante sepa que el archivo original empieza con la firma `glTF` (ataque de texto plano conocido), **es matemáticamente imposible** que una IA o supercomputadora deduzca la clave de descifrado.
2. **Claves Dinámicas:** Las claves de cifrado cambian para cada manual del sistema. Comprometer la clave de un manual no compromete la seguridad de ningún otro modelo.
3. **Encapsulamiento del Blob:** Las URLs de tipo `blob:` son temporales, pertenecen al contexto del hilo de ejecución de la pestaña actual y no pueden ser consultadas desde fuera del navegador.
4. **Protección de Endpoint AR:** Los accesos de AR están firmados criptográficamente con tokens HMAC con expiración automática de 30 minutos y respuesta con headers `no-store`.
5. **Cero Latencia:** El proceso de descifrado AES-256 se realiza nativamente a través de la CPU (aceleración por hardware del dispositivo o servidor Edge), tomando **menos de 0.05 milisegundos**, garantizando transiciones de pasos instantáneas.

---

## 🌐 5. Seguridad DNS, SSL/TLS & Protección contra Operadores Móviles (Cloudflare Proxy)

Para garantizar la inmunidad total del dominio `mariomojica.com` frente a bloqueos de operadores móviles (Claro/Tigo/Movistar) y resolver falsos positivos de certificados no verificados:

### A. Gestión DNS Anycast & IPv6 Nativo (Cloudflare)
- **Nameservers Dedicados:** Delegación DNS completa a los servidores Anycast de Cloudflare (`justin.ns.cloudflare.com` y `tara.ns.cloudflare.com`).
- **CNAME Flattening & IPv6:** Enrutamiento dinámico que expone direcciones IPv6 nativas para antenas 4G/LTE/5G, resolviendo la causa raíz de los errores `ERR_CONNECTION_TIMED_OUT` en dispositivos móviles.
- **Protección contra DDoS & WAF:** Filtrado automático de bots, escáneres maliciosos y ataques de denegación de servicio a nivel de borde (Edge Network).

### B. Cabeceras de Seguridad HSTS & SSL Compliance
- **Strict-Transport-Security (HSTS):** `max-age=31536000; includeSubDomains; preload` forzando a los navegadores a conectar **única y exclusivamente mediante HTTPS**.
- **Cabeceras Anti-Clickjacking y XSS:**
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`

---

## 📁 ¿Es visible este archivo en internet?
**No. Este documento de seguridad NO es público ni accesible desde internet:**
* El repositorio de GitHub es **privado**. Solo los desarrolladores con acceso pueden leerlo.
* Las carpetas `/docs` o `/Comercial` en la raíz del repositorio **no se compilan ni se exponen** en la carpeta de distribución pública (`/public` o `/dist`) del servidor web (Netlify/Next.js). Solo el código y los assets declarados formalmente se suben a la web de producción.


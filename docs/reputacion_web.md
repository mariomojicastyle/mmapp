# 🛡️ Guía de Reputación Web, Whitelisting de Antivirus y Seguridad DNS

Esta guía contiene las instrucciones detalladas paso a paso para categorizar y validar el dominio `mariomojica.com` como seguro frente a antivirus corporativos (McAfee, Norton) y firewalls, además de la configuración recomendada de seguridad DNS.

---

## 1. Disputas y Categorización en Antivirus

### A. McAfee WebAdvisor
Cuando envías un enlace por LinkedIn o abres la web desde redes que usan McAfee, puede aparecer una advertencia de "Sitio no clasificado". Para resolverlo:
1. Accede al portal oficial de verificación de McAfee: [McAfee SiteLookup](https://sitelookup.mcafee.com/).
2. En la opción **Choose Product**, selecciona **McAfee WebAdvisor**.
3. En **Categorization Request**, ingresa `mariomojica.com` y haz clic en **Check URL**.
4. Verás el estado actual del sitio (probablemente "Minimal Risk" o "Uncategorized").
5. Bajo la sección de sugerencia de categorización, selecciona:
   * **Categoría Primaria:** `Business` o `Software/Technology`.
   * **Categoría Secundaria:** `Technical/Business Services` o `General Business`.
6. En el cuadro de comentarios de la disputa, escribe un mensaje formal explicando el propósito del sitio:
   > *"Hello McAfee WebAdvisor Team, our website mariomojica.com hosts the landing page and administration console for a B2B SaaS interactive 3D assembly manual tool for furniture manufacturers. It is a completely legitimate business website, free of ads, spam, phishing, or malware. We kindly request that you review the site and categorize it under Business/Technology. Thank you."*
7. Haz clic en **Submit for Review** y guarda el número de ticket generado. La revisión suele completarse en un plazo de 24 a 72 horas.

---

### B. Norton Safe Web
Norton requiere verificar la propiedad de tu dominio antes de procesar solicitudes de whitelisting:
1. Regístrate o inicia sesión en el portal de partners: [Norton Safe Web Submission Portal](https://safeweb.norton.com/).
2. Haz clic en **Add Site** e ingresa `mariomojica.com`.
3. Selecciona el método de verificación por archivo HTML:
   * Descarga el archivo de verificación provisto por Norton (contendrá un nombre/código similar a `norton_xxxxxxxx.html` o un código hash de unos 40 caracteres).
   * Sobrescribe el archivo de plantilla que hemos creado en [norton_verification.html](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/public/norton_verification.html) con tu código exacto de verificación.
   * Despliega la web para que sea accesible en `https://mariomojica.com/norton_verification.html`.
4. En el portal de Norton, haz clic en **Verify Me**.
5. Tras verificar la propiedad, haz clic en **Rate my site** para solicitar la clasificación como "Safe Site" (Sitio Seguro).

---

### C. VirusTotal
VirusTotal consolida más de 70 motores de seguridad. Es fundamental estar limpio en este agregador:
1. Ve a [VirusTotal](https://www.virustotal.com/) y selecciona la pestaña **URL**.
2. Analiza `https://mariomojica.com` y `https://baserow.mariomojica.com`.
3. Si algún motor menor (como Securly, AlphaMountain, etc.) marca el dominio como sospechoso o malicioso de forma errónea (falso positivo), haz clic en el nombre del motor en el reporte para obtener sus datos de soporte.
4. Envía un correo breve a su equipo de soporte de falsos positivos (ej: `falsepositive@securly.com`) indicando tu dominio y adjuntando el link del reporte de VirusTotal para su corrección rápida.

---

## 2. Configuración de Seguridad DNS (SPF, DKIM, DMARC)

Para evitar que los firewalls de correo de tus clientes corporativos (grandes fabricantes RTA) cataloguen tus emails o los enlaces de `mariomojica.com` como spam o phishing, debes configurar las siguientes directivas en la zona DNS de tu dominio:

### A. SPF (Sender Policy Framework)
Añade o edita un registro tipo **TXT** en la raíz (`@`) de tu dominio. Define qué servidores están autorizados para enviar correos en tu nombre. 
* Si usas por ejemplo Zoho Mail y SendGrid para correos de leads:
  ```txt
  Tipo: TXT
  Nombre: @
  Valor: v=spf1 include:zoho.com include:sendgrid.net -all
  ```
  *(El `-all` final indica que cualquier servidor que no esté explícitamente en la lista debe ser rechazado por defecto, mejorando el puntaje de confianza).*

### B. DKIM (DomainKeys Identified Mail)
El proveedor de correo genera una clave pública que debes añadir como registro TXT. Esto firma digitalmente tus correos.
* Ejemplo (solicita el host y valor exacto desde la consola de tu proveedor de correo):
  ```txt
  Tipo: TXT
  Nombre: zoho._domainkey
  Valor: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA... (clave provista)
  ```

### C. DMARC (Domain-based Message Authentication)
DMARC le dice a los servidores receptores qué hacer si el SPF o DKIM fallan. Añade un registro TXT con subdominio `_dmarc`.
* Registro sugerido para iniciar en modo de **monitoreo seguro** (sin bloquear nada de golpe, solo reportar al email especificado):
  ```txt
  Tipo: TXT
  Nombre: _dmarc
  Valor: v=DMARC1; p=none; rua=mailto:dmarc-reports@mariomojica.com; pct=100
  ```
* Una vez que verifiques que tus correos se envían correctamente sin falsos positivos en los reportes DMARC, cambia la directiva de cuarentena a:
  ```txt
  v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@mariomojica.com; pct=100
  ```

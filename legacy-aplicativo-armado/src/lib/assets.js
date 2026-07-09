const sessionBuster = Date.now();

export const nameAliases = {
  'caja_0007374': 'Caja_minifix',
  'caja_0002715': 'Caja_minifix',
  'caja': 'Caja_minifix',
  'deslizador_007391': 'Deslizador',
  'deslizador_0004696': 'Deslizador',
  'deslizador': 'Deslizador',
  'perno_0007374': 'Perno',
  'perno': 'Perno',
  'tarugo_20030001': 'Tarugo',
  'tarugo_20030': 'Tarugo',
  'tarugo': 'Tarugo',
  'tornillo_0000152': 'Tornillo_2',
  'tornillo_000152': 'Tornillo_1',
  'tornillo_0004705': 'Tornillo_1',
  'tornillo_1': 'Tornillo_1',
  'tornillo_2': 'Tornillo_2',
  'tornillo': 'Tornillo',
  'tuerca_0004674': 'Tuerca',
  'tuerca': 'Tuerca',
  'corredera_350_20080001': 'Rieles',
  'corredera_350': 'Rieles',
  'corredera': 'Rieles'
};

export function resolveAlias(name) {
  if (!name) return name;
  const extIndex = name.lastIndexOf('.');
  const baseName = extIndex !== -1 ? name.substring(0, extIndex) : name;
  const ext = extIndex !== -1 ? name.substring(extIndex) : '';
  const key = baseName.toLowerCase();
  if (nameAliases[key]) {
    return nameAliases[key] + ext;
  }
  return name;
}

export function getAssetPath(path) {
  if (!path) return '';
  // If it's already an absolute URL, return it
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const basename = window.location.pathname.startsWith('/embed/armado') ? '/embed/armado' : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const separator = cleanPath.includes('?') ? '&' : '?';
  return `${basename}${cleanPath}${separator}v=${sessionBuster}`;
}

export function translateHerraje(name, glosario, idioma) {
  if (!name || !glosario || !Array.isArray(glosario) || glosario.length === 0) {
    return name;
  }
  const cleanLang = (idioma || 'es').toLowerCase();
  
  const sanitize = (s) => {
    if (!s) return "";
    return s.toLowerCase()
      .replace(/ç/g, "_")
      .replace(/ã/g, "a")
      .replace(/õ/g, "o")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const nameSan = sanitize(name);
  if (!nameSan) return name;

  // Ordenamos el glosario por longitud del término en pt desc, luego es desc, luego en desc
  // para hacer primero la coincidencia más larga (evitar falsos positivos parciales)
  const sortedGlosario = [...glosario].sort((a, b) => {
    const lenA = Math.max((a.pt || "").length, (a.es || "").length, (a.en || "").length);
    const lenB = Math.max((b.pt || "").length, (b.es || "").length, (b.en || "").length);
    return lenB - lenA;
  });

  for (const entry of sortedGlosario) {
    const ptSan = sanitize(entry.pt);
    const esSan = sanitize(entry.es);
    const enSan = sanitize(entry.en);
    
    // Coincidencia exacta o por prefijo
    const isMatch = (
      (ptSan && (nameSan === ptSan || nameSan.startsWith(ptSan) || ptSan.startsWith(nameSan))) ||
      (esSan && (nameSan === esSan || nameSan.startsWith(esSan) || esSan.startsWith(nameSan))) ||
      (enSan && (nameSan === enSan || nameSan.startsWith(enSan) || enSan.startsWith(nameSan)))
    );
    
    if (isMatch) {
      if (cleanLang === 'en' && entry.en) return entry.en;
      if (cleanLang === 'pt' && entry.pt) return entry.pt;
      if (cleanLang === 'es' && entry.es) return entry.es;
      return entry[cleanLang] || entry.es || entry.pt || entry.en || name;
    }
  }

  return name;
}



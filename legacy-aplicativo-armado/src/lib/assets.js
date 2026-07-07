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


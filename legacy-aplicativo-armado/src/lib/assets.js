const sessionBuster = Date.now();

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

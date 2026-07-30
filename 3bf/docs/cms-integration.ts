export interface Configuracion3BFDB {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion?: string;
  gh_file_url: string;
  gh_schema_json: Record<string, any>;
  valores_default_json: Record<string, any>;
  thumbnail_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function buildEmbedIframeCode(configId: string, baseUrl: string = 'https://3bf.mariomojica.com'): string {
  return `<iframe src="${baseUrl}/configurador/${configId}" width="100%" height="650px" frameborder="0" allowfullscreen style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>`;
}

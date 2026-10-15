export interface GetUploadUrlRequest {
  key: string;         // Ruta objetivo dentro del bucket
  contentType: string; // Tipo MIME (ej: 'application/pdf')
}

export interface GetUploadUrlResponse {
  uploadUrl: string;   // URL firmada de S3 de tipo PUT
  key: string;         // Clave del archivo generada
}

export interface GetDownloadUrlResponse {
  downloadUrl: string; // URL firmada de S3 de tipo GET (temporal)
}

export function sanitizeFilename(filename: string): string {
  const parts = filename.split('.');
  const ext = parts.pop() || 'pdf';
  let name = parts.join('.');

  name = name.replace(/\s+/g, '_');
  name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  name = name.replace(/[^a-zA-Z0-9.\-_]/g, '');

  return `${name}.${ext}`;
}


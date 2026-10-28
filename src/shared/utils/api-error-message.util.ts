import { HttpErrorResponse } from '@angular/common/http';

export const GENERIC_API_ERROR_MESSAGE =
  'Ocurrió un error inesperado al comunicarse con el servidor. Intente nuevamente.';

/**
 * Mensaje legible de un error de API.
 *
 * - Error ya procesado por ErrorInterceptor (lo habitual en la app): usa err.message.
 * - HttpErrorResponse crudo (sin interceptor): lee body.error.message y luego body.message,
 *   en ambos casos string o arreglo (unido con "; ").
 */
export function extractApiErrorMessage(
  err: unknown,
  fallback: string = GENERIC_API_ERROR_MESSAGE,
): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: unknown; error?: { message?: unknown } } | null;
    return readMessage(body?.error?.message) ?? readMessage(body?.message) ?? fallback;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return readMessage((err as { message: unknown }).message) ?? fallback;
  }
  return readMessage(err) ?? fallback;
}

function readMessage(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) {
    const parts = value.filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
    return parts.length ? parts.join('; ') : null;
  }
  return null;
}

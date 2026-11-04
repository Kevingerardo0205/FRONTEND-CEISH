/**
 * Errores de autenticación del backend (T13d-4). Funciones puras, sin Angular: reciben el
 * HttpErrorResponse (o cualquier objeto con `status` y cuerpo `error`) por su forma.
 *
 * El backend responde el login así (auth.service.ts, validateUser):
 * - correo sin verificar → 403 "Por favor, confirma tu correo electrónico antes de iniciar sesión."
 * - cuenta bloqueada → 403 "Account temporarily locked. Try again later."
 * - cuenta desactivada → 401 "Su cuenta está desactivada. Contacte al administrador."
 * El HttpExceptionFilter pone el mensaje en body.error.message; el formato por defecto de Nest,
 * en body.message. Se leen los dos. Depende del texto: ver plan.md §8 (código de error estable).
 */

interface HttpLikeError {
  status?: unknown;
  error?: unknown;
}

/** Mensaje del cuerpo del backend: body.message o body.error.message (arreglo unido con "; "). */
export function backendErrorMessage(error: unknown): string | null {
  const body = (error as HttpLikeError | null)?.error as
    { message?: unknown; error?: { message?: unknown } } | null | undefined;
  return asText(body?.message) ?? asText(body?.error?.message);
}

/** 403 del backend porque el correo no está verificado (el login debe abrir el OTP). */
export function isEmailVerificationRequired(error: unknown): boolean {
  if ((error as HttpLikeError | null)?.status !== 403) return false;
  const message = backendErrorMessage(error) ?? '';
  const lower = message.toLowerCase();
  return (
    lower.includes('confirma tu correo') || lower.includes('verificar') || message.includes('OTP')
  );
}

/** 403 del backend porque la cuenta está bloqueada temporalmente por intentos fallidos. */
export function isAccountLocked(error: unknown): boolean {
  if ((error as HttpLikeError | null)?.status !== 403) return false;
  return (backendErrorMessage(error) ?? '').toLowerCase().includes('locked');
}

function asText(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (Array.isArray(value)) {
    const parts = value.filter((m): m is string => typeof m === 'string' && m.length > 0);
    return parts.length ? parts.join('; ') : null;
  }
  return null;
}

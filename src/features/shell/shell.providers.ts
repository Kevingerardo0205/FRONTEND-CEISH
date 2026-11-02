import { Provider } from '@angular/core';

/**
 * Proveedores de la sección shell (port → adapter) que no van en app.config.ts.
 * Hoy está vacío:
 * - MenuConfigPort se registra solo en app.config.ts, porque GetMenuForRoleUseCase es
 *   providedIn 'root' y no ve los proveedores de una ruta.
 * - PendingCountPort no se registra: GET /secretaria/pendientes no existe en el backend
 *   (spec-003 RF-ALR.f). Sin proveedor, el contador queda oculto. El mock solo se usa en pruebas.
 */
export const SHELL_PROVIDERS: Provider[] = [];

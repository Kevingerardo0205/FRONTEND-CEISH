import { Provider } from '@angular/core';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { StaticMenuConfigAdapter } from './infrastructure/menu.config';
import { PendingCountPort } from './domain/pending-count.port';
import { PendingCountMockAdapter } from './infrastructure/pending-count-mock.adapter';

/**
 * Proveedores de la sección shell (port → adapter). Se registran en las rutas de la
 * sección en T13. Contador de pendientes: mock hasta que exista GET /secretaria/pendientes.
 */
export const SHELL_PROVIDERS: Provider[] = [
  { provide: MenuConfigPort, useClass: StaticMenuConfigAdapter },
  { provide: PendingCountPort, useClass: PendingCountMockAdapter },
];

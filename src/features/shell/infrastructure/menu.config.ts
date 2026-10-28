import { Injectable } from '@angular/core';
import { MenuItem } from '@domain/entities/menu-item.entity';
import { MenuConfigPort } from '@domain/ports/menu-config.port';

/**
 * Menú lateral por rol (spec-ui F00 §4). Solo la Secretaría tiene entradas por ahora;
 * los demás roles se agregan en su sección.
 */
export const MENU_ITEMS: readonly MenuItem[] = [
  {
    id: 'pendientes',
    label: 'Mis pendientes',
    route: '/pendientes',
    roles: ['SECRETARIA'],
    badge: 'pendientes',
  },
  { id: 'protocolos', label: 'Protocolos', route: '/protocolos', roles: ['SECRETARIA'] },
  { id: 'convocatorias', label: 'Convocatorias', route: '/convocatorias', roles: ['SECRETARIA'] },
  { id: 'reportes', label: 'Reportes', route: '/reportes', roles: ['SECRETARIA'] },
  { id: 'configuracion', label: 'Configuración', route: '/configuracion', roles: ['SECRETARIA'] },
];

@Injectable()
export class StaticMenuConfigAdapter extends MenuConfigPort {
  getItems(): readonly MenuItem[] {
    return MENU_ITEMS;
  }
}

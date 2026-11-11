import { Injectable } from '@angular/core';
import { MenuItem } from '@domain/entities/menu-item.entity';
import { MenuConfigPort } from '@domain/ports/menu-config.port';

/**
 * Menú lateral de los cuatro roles (spec-ui F10 §3). Solo se agrega una opción si su pantalla existe
 * y permite entrar a ese rol activo (F10 D7); las opciones pendientes figuran en F10 §8.
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
  {
    id: 'investigador-mis-protocolos',
    label: 'Mis protocolos',
    route: '/dashboard/investigador/mis-protocolos',
    roles: ['INVESTIGADOR'],
  },
  {
    id: 'investigador-nuevo-protocolo',
    label: 'Nuevo protocolo',
    route: '/dashboard/investigador/nuevo-protocolo',
    roles: ['INVESTIGADOR'],
  },
  {
    id: 'investigador-subsanaciones',
    label: 'Subsanaciones',
    route: '/dashboard/evaluacion-etica/subsanaciones',
    roles: ['INVESTIGADOR'],
  },
  {
    id: 'presidente-sesiones',
    label: 'Sesiones del pleno',
    route: '/dashboard/resolutions/calls',
    roles: ['PRESIDENTE'],
  },
  {
    id: 'presidente-reportes',
    label: 'Reportes',
    route: '/dashboard/reports/stats',
    roles: ['PRESIDENTE'],
  },
  {
    id: 'evaluador-evaluaciones',
    label: 'Mis evaluaciones',
    route: '/dashboard/evaluations/list',
    roles: ['EVALUADOR'],
  },
];

@Injectable()
export class StaticMenuConfigAdapter extends MenuConfigPort {
  getItems(): readonly MenuItem[] {
    return MENU_ITEMS;
  }
}

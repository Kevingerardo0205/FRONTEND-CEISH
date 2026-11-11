import { RoleCode } from '@domain/value-objects/role.vo';

/** F10 D10: acceso a cada pestaña del espacio según el rol activo. */
export type WorkspaceTab = 'info' | 'validation' | 'follow-up';

export const WORKSPACE_TAB_ROLES: Readonly<Record<WorkspaceTab, readonly RoleCode[]>> = {
  info: ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
  validation: ['SECRETARIA', 'INVESTIGADOR'],
  'follow-up': ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
};

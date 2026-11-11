import { RoleCode } from '@domain/value-objects/role.vo';

/** F10 D10: acceso a cada pestaña del espacio según el rol activo. */
export type WorkspaceTab = 'info' | 'validation' | 'follow-up';

export const WORKSPACE_TAB_ROLES: Readonly<Record<WorkspaceTab, readonly RoleCode[]>> = {
  info: ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
  validation: ['SECRETARIA', 'INVESTIGADOR'],
  'follow-up': ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
};

export type WorkspaceAction = 'EDIT_PROTOCOL' | 'VALIDATE_ALL' | 'ASSIGN_EVALUATORS';

export const WORKSPACE_ACTION_ROLES: Readonly<Record<WorkspaceAction, readonly RoleCode[]>> = {
  EDIT_PROTOCOL: ['INVESTIGADOR'],
  VALIDATE_ALL: ['SECRETARIA'],
  ASSIGN_EVALUATORS: ['SECRETARIA'],
};

// Hasta S-1c (F10 D11/D12): la pestaña Evaluación sale del espacio.
export const EVALUATION_TAB_ROLES_UNTIL_S1C: readonly RoleCode[] = [
  'SECRETARIA',
  'PRESIDENTE',
  'EVALUADOR',
];

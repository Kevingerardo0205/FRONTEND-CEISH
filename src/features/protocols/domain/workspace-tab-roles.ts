import { RoleCode } from '@domain/value-objects/role.vo';

/** F10 D10: acceso a cada pestaña del espacio según el rol activo. */
export type WorkspaceTab = 'info' | 'validation' | 'follow-up';

export const WORKSPACE_TAB_ROLES: Readonly<Record<WorkspaceTab, readonly RoleCode[]>> = {
  info: ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
  validation: ['SECRETARIA', 'INVESTIGADOR'],
  'follow-up': ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
};

/**
 * F10 D11 (S-1c): primera pestaña que abre el rol, en el orden de `WORKSPACE_TAB_ROLES`.
 * Sin ninguna (hoy EVALUADOR) o sin rol activo: null.
 */
export function firstWorkspaceTab(role: RoleCode | null): WorkspaceTab | null {
  if (!role) return null;
  const tabs = Object.keys(WORKSPACE_TAB_ROLES) as WorkspaceTab[];
  return tabs.find((tab) => WORKSPACE_TAB_ROLES[tab].includes(role)) ?? null;
}

export type WorkspaceAction = 'EDIT_PROTOCOL' | 'VALIDATE_ALL' | 'ASSIGN_EVALUATORS';

export const WORKSPACE_ACTION_ROLES: Readonly<Record<WorkspaceAction, readonly RoleCode[]>> = {
  EDIT_PROTOCOL: ['INVESTIGADOR'],
  VALIDATE_ALL: ['SECRETARIA'],
  ASSIGN_EVALUATORS: ['SECRETARIA'],
};

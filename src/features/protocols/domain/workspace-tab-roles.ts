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

export type WorkspaceAction =
  | 'EDIT_PROTOCOL'
  | 'VALIDATE_ALL'
  | 'ASSIGN_EVALUATORS'
  | 'SUBMIT_CORRECTIONS';

/**
 * F10 D12 y D17: acciones del espacio según el rol activo.
 * `SUBMIT_CORRECTIONS` (D17 (4)): vista de subsanación de la pestaña Validación.
 */
export const WORKSPACE_ACTION_ROLES: Readonly<Record<WorkspaceAction, readonly RoleCode[]>> = {
  EDIT_PROTOCOL: ['INVESTIGADOR'],
  VALIDATE_ALL: ['SECRETARIA'],
  ASSIGN_EVALUATORS: ['SECRETARIA'],
  SUBMIT_CORRECTIONS: ['INVESTIGADOR'],
};

export type WorkspaceSection = 'EVALUATOR_PANEL';

/**
 * F10 D17 (2): secciones de las pestañas según el rol activo.
 * `EVALUATOR_PANEL`: cuerpo evaluador del Resumen (nombres de los evaluadores); el INVESTIGADOR
 * nunca lo ve. Los mismos roles que tienen `EVALUACION_INFORMES` en el backend.
 */
export const WORKSPACE_SECTION_ROLES: Readonly<Record<WorkspaceSection, readonly RoleCode[]>> = {
  EVALUATOR_PANEL: ['SECRETARIA', 'PRESIDENTE'],
};

import { RoleCode } from '@domain/value-objects/role.vo';

/**
 * F10 D10: acceso a cada pestaña del espacio según el rol activo.
 * F11 EP2 (20/11/2026): PRESIDENTE abre `validation` en solo lectura (F11 §4).
 */
export type WorkspaceTab = 'info' | 'assignment' | 'validation' | 'follow-up';

export const WORKSPACE_TAB_ROLES: Readonly<Record<WorkspaceTab, readonly RoleCode[]>> = {
  info: ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
  assignment: ['PRESIDENTE'],
  validation: ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
  'follow-up': ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
};

/** Roles que ya pueden entrar al workspace mediante alguna pestaña existente. */
export const WORKSPACE_ACCESS_ROLES: readonly RoleCode[] = [
  'SECRETARIA',
  'PRESIDENTE',
  'INVESTIGADOR',
];

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
 * `ASSIGN_EVALUATORS` (D20 (2), 19/11/2026): solo la Presidenta asigna (TSK-002-N52).
 * `VALIDATE_ALL` también decide la vista de validar de la pestaña Validación (F11 EP2): sin ella
 * y sin `SUBMIT_CORRECTIONS`, la pestaña es de solo lectura.
 */
/**
 * Quién puede ver a las personas asignadas en la pestaña de la etapa Asignación (F11-39, F11-40):
 * el comité. El INVESTIGADOR abre la etapa pero no ve evaluadores (F11: sin nombres, ids ni correos).
 */
export const ASSIGNMENT_EVALUATORS_VIEW_ROLES: readonly RoleCode[] = ['SECRETARIA', 'PRESIDENTE'];

export const WORKSPACE_ACTION_ROLES: Readonly<Record<WorkspaceAction, readonly RoleCode[]>> = {
  EDIT_PROTOCOL: ['INVESTIGADOR'],
  VALIDATE_ALL: ['SECRETARIA'],
  ASSIGN_EVALUATORS: ['PRESIDENTE'],
  SUBMIT_CORRECTIONS: ['INVESTIGADOR'],
};

export type WorkspaceSection = 'EVALUATOR_PANEL' | 'AUDIT_TRAIL';

/**
 * F10 D17 (2): secciones de las pestañas según el rol activo.
 * `EVALUATOR_PANEL`: cuerpo evaluador del Resumen (nombres de los evaluadores); el INVESTIGADOR
 * nunca lo ve. Los mismos roles que tienen `EVALUACION_INFORMES` en el backend.
 * `AUDIT_TRAIL` (F11 V10, EP4): bitácora del Resumen (nombres de quien hizo cada acción); los
 * mismos roles que `audit/*` (F00 D4). Sin ella no se pide `GET /audit/protocol/:id`.
 */
export const WORKSPACE_SECTION_ROLES: Readonly<Record<WorkspaceSection, readonly RoleCode[]>> = {
  EVALUATOR_PANEL: ['SECRETARIA', 'PRESIDENTE'],
  AUDIT_TRAIL: ['SECRETARIA', 'PRESIDENTE'],
};

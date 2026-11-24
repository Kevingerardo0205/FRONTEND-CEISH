import { Stage, StageCode } from './stage.vo';

export interface WorkspaceCurrentStage {
  readonly stage: Stage | null;
  readonly source: 'backend';
}

export interface WorkspaceSelectedStage {
  readonly stage: StageCode | null;
  readonly source: 'route';
}

export interface WorkspaceStageContext {
  readonly current: WorkspaceCurrentStage;
  readonly selected: WorkspaceSelectedStage;
}

export type WorkspaceStageStatus =
  | 'PENDIENTE'
  | 'EN_CURSO'
  | 'COMPLETADA'
  | 'CERRADA'
  | 'NO_APLICA';

export type WorkspaceStageState =
  | { readonly kind: 'determined'; readonly status: WorkspaceStageStatus }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'undetermined' };

export type WorkspaceInformationState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error'; readonly message?: string };

export type WorkspaceOperationAvailability =
  | { readonly state: 'available' }
  | { readonly state: 'restricted'; readonly reason: string };

export function currentStageFromBackend(stage: Stage | null): WorkspaceCurrentStage {
  return { stage, source: 'backend' };
}

export function selectedStageFromRoute(stage: StageCode | null): WorkspaceSelectedStage {
  return { stage, source: 'route' };
}

export function determinedStageState(status: WorkspaceStageStatus): WorkspaceStageState {
  return { kind: 'determined', status };
}

export function undeterminedStageState(): WorkspaceStageState {
  return { kind: 'undetermined' };
}

export function unavailableStageState(): WorkspaceStageState {
  return { kind: 'unavailable' };
}

/** Códigos de estado (catálogo: ids 18 y 12) con los que el protocolo queda cerrado. */
const CLOSED_PROTOCOL_STATUS_CODES: readonly string[] = ['RECHAZADO', 'ARCHIVADO_VENCIMIENTO'];

/** Etapas que todavía no existen como apartado con datos propios. */
const UNAVAILABLE_STAGE_CODES: readonly StageCode[] = ['SEGUIMIENTO', 'RENOVACION'];

/**
 * Estados de la barra «derivados de la etapa actual» (ep2c.md §3.4, decisión del 24/11/2026).
 * Es la única inferencia permitida: usa solo `header.stage` y el código de estado del protocolo.
 * Sin etapa del backend no se deriva nada y cada etapa queda sin determinar.
 *
 * - Protocolo cerrado (RECHAZADO o ARCHIVADO_VENCIMIENTO): anteriores `COMPLETADA`, la etapa donde
 *   se detuvo `CERRADA`, posteriores `NO_APLICA`.
 * - En otro caso, SEGUIMIENTO y RENOVACION son `unavailable` y las demás: anteriores `COMPLETADA`,
 *   actual `EN_CURSO`, posteriores `PENDIENTE`.
 */
export function deriveStageStates(
  current: Stage | null,
  protocolStatusCode: string | null,
): Readonly<Partial<Record<StageCode, WorkspaceStageState>>> {
  if (!current) return {};
  const closed = protocolStatusCode !== null && CLOSED_PROTOCOL_STATUS_CODES.includes(protocolStatusCode);
  const states: Partial<Record<StageCode, WorkspaceStageState>> = {};

  for (const stage of Stage.all()) {
    if (closed) {
      states[stage.code] = determinedStageState(
        stage.order < current.order ? 'COMPLETADA' : stage.order === current.order ? 'CERRADA' : 'NO_APLICA',
      );
    } else if (UNAVAILABLE_STAGE_CODES.includes(stage.code)) {
      states[stage.code] = unavailableStageState();
    } else {
      states[stage.code] = determinedStageState(
        stage.order < current.order ? 'COMPLETADA' : stage.order === current.order ? 'EN_CURSO' : 'PENDIENTE',
      );
    }
  }
  return states;
}

export function informationLoading(): WorkspaceInformationState {
  return { kind: 'loading' };
}

export function informationEmpty(): WorkspaceInformationState {
  return { kind: 'empty' };
}

export function informationUnavailable(): WorkspaceInformationState {
  return { kind: 'unavailable' };
}

export function informationError(message?: string): WorkspaceInformationState {
  return message === undefined ? { kind: 'error' } : { kind: 'error', message };
}

export function operationAvailable(): WorkspaceOperationAvailability {
  return { state: 'available' };
}

export function operationRestricted(reason: string): WorkspaceOperationAvailability {
  return { state: 'restricted', reason };
}

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

export type WorkspaceStageStatus = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA';

export type WorkspaceStageState =
  | { readonly kind: 'determined'; readonly status: WorkspaceStageStatus }
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

/**
 * Fachada de compatibilidad para los consumidores de EP2c.2.
 * El contrato canónico vive en Domain para que Presentation compartida no dependa de Features.
 */
export {
  currentStageFromBackend,
  deriveStageStates,
  determinedStageState,
  informationEmpty,
  informationError,
  informationLoading,
  informationUnavailable,
  isStageNotApplicable,
  isStageNotReached,
  operationAvailable,
  operationRestricted,
  selectedStageFromRoute,
  unavailableStageState,
  undeterminedStageState,
} from '@domain/value-objects/workspace-stage-state.vo';

export type {
  WorkspaceCurrentStage,
  WorkspaceInformationState,
  WorkspaceOperationAvailability,
  WorkspaceSelectedStage,
  WorkspaceStageContext,
  WorkspaceStageState,
  WorkspaceStageStatus,
} from '@domain/value-objects/workspace-stage-state.vo';

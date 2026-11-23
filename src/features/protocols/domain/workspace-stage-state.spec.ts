import { Stage } from '@domain/value-objects/stage.vo';
import {
  currentStageFromBackend,
  determinedStageState,
  informationEmpty,
  informationError,
  informationLoading,
  informationUnavailable,
  operationAvailable,
  operationRestricted,
  selectedStageFromRoute,
  undeterminedStageState,
} from './workspace-stage-state';

describe('workspace-stage-state', () => {
  it('mantiene independientes la etapa actual y la seleccionada', () => {
    const current = currentStageFromBackend(Stage.fromBackend('RECEPCION'));
    const selected = selectedStageFromRoute('EVALUACION');

    expect(current).toEqual({ stage: Stage.fromBackend('RECEPCION'), source: 'backend' });
    expect(selected).toEqual({ stage: 'EVALUACION', source: 'route' });
    expect(current.stage?.code === selected.stage).toBeFalse();
  });

  it('seleccionar una etapa no modifica la etapa actual', () => {
    const current = currentStageFromBackend(Stage.fromBackend('RECEPCION'));
    const context = {
      current,
      selected: selectedStageFromRoute('RESOLUCION'),
    };

    expect(context.current).toBe(current);
    expect(context.current.stage?.code).toBe('RECEPCION');
    expect(context.selected.stage).toBe('RESOLUCION');
  });

  it('representa un estado individual determinado solo mediante un estado explícito', () => {
    expect(determinedStageState('COMPLETADA')).toEqual({
      kind: 'determined',
      status: 'COMPLETADA',
    });
  });

  it('representa información insuficiente sin inferir PENDIENTE o COMPLETADA', () => {
    const current = currentStageFromBackend(Stage.fromBackend('EVALUACION'));

    expect(undeterminedStageState()).toEqual({ kind: 'undetermined' });
    expect(current.stage?.code).toBe('EVALUACION');
    expect(undeterminedStageState()).not.toEqual({ kind: 'determined', status: 'PENDIENTE' });
    expect(undeterminedStageState()).not.toEqual({ kind: 'determined', status: 'COMPLETADA' });
  });

  it('distingue carga, sin registros, fuente no disponible y error', () => {
    expect(informationLoading()).toEqual({ kind: 'loading' });
    expect(informationEmpty()).toEqual({ kind: 'empty' });
    expect(informationUnavailable()).toEqual({ kind: 'unavailable' });
    expect(informationError()).toEqual({ kind: 'error' });
    expect(informationError('No se pudo consultar la fuente.')).toEqual({
      kind: 'error',
      message: 'No se pudo consultar la fuente.',
    });
  });

  it('no confunde sin registros, fuente no disponible y error de consulta', () => {
    expect(informationEmpty()).not.toEqual(informationUnavailable());
    expect(informationEmpty()).not.toEqual(informationError());
    expect(informationUnavailable()).not.toEqual(informationError());
  });

  it('mantiene la disponibilidad de operaciones independiente de la navegación', () => {
    const selected = selectedStageFromRoute('ASIGNACION');
    const available = operationAvailable();
    const restricted = operationRestricted('Requiere una condición de negocio.');

    expect(selected.stage).toBe('ASIGNACION');
    expect(available).toEqual({ state: 'available' });
    expect(restricted).toEqual({
      state: 'restricted',
      reason: 'Requiere una condición de negocio.',
    });
    expect('roles' in available).toBeFalse();
    expect('permissions' in available).toBeFalse();
    expect('roles' in restricted).toBeFalse();
    expect('permissions' in restricted).toBeFalse();
  });
});

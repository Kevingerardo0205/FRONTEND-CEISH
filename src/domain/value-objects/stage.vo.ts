export type StageCode =
  'RECEPCION' | 'ASIGNACION' | 'EVALUACION' | 'RESOLUCION' | 'SEGUIMIENTO' | 'RENOVACION';

/** Error controlado cuando el backend envía un código de etapa desconocido. */
export class InvalidStageError extends Error {
  constructor(readonly received: unknown) {
    super(`Etapa desconocida: ${String(received)}`);
    this.name = 'InvalidStageError';
  }
}

/**
 * Etapa del protocolo (spec-001 RF-EST). La etapa la decide el backend:
 * este VO solo valida el código y aporta orden y etiqueta.
 */
export class Stage {
  private static readonly STAGES: readonly Stage[] = [
    new Stage('RECEPCION', 1, 'Recepción'),
    new Stage('ASIGNACION', 2, 'Asignación'),
    new Stage('EVALUACION', 3, 'Evaluación'),
    new Stage('RESOLUCION', 4, 'Resolución'),
    new Stage('SEGUIMIENTO', 5, 'Seguimiento'),
    new Stage('RENOVACION', 6, 'Renovación'),
  ];

  private constructor(
    readonly code: StageCode,
    readonly order: number,
    readonly label: string,
  ) {}

  static fromBackend(code: unknown): Stage {
    const stage = Stage.STAGES.find((s) => s.code === code);
    if (!stage) throw new InvalidStageError(code);
    return stage;
  }

  static all(): readonly Stage[] {
    return Stage.STAGES;
  }
}

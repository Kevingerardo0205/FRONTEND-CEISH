export enum DictamenId {
  APROBADO = 1,
  APROBADO_CON_OBSERVACIONES = 2,
  RECHAZADO = 3,
}

export type DictamenCode =
  'APROBADO' | 'APROBADO_CON_OBSERVACIONES' | 'PENDIENTE_SUBSANACION' | 'RECHAZADO';

export const DictamenMapping: Record<DictamenCode, DictamenId> = {
  APROBADO: DictamenId.APROBADO,
  APROBADO_CON_OBSERVACIONES: DictamenId.APROBADO_CON_OBSERVACIONES,
  PENDIENTE_SUBSANACION: DictamenId.APROBADO_CON_OBSERVACIONES,
  RECHAZADO: DictamenId.RECHAZADO,
} as const;

/** F11 V15 (EP4): etiqueta del dictamen de cada par, con los códigos de `EvaluatorDictamen`. */
export const DICTAMEN_LABELS: Readonly<Record<DictamenId, string>> = {
  [DictamenId.APROBADO]: 'Aprobado',
  [DictamenId.APROBADO_CON_OBSERVACIONES]: 'Aprobado con observaciones',
  [DictamenId.RECHAZADO]: 'Rechazado',
};
export const DICTAMEN_NONE_LABEL = 'Sin dictamen registrado';
export const DICTAMEN_UNKNOWN_LABEL = 'Dictamen no reconocido';

/** F11 V15: sin dictamen (`null`) → «Sin dictamen registrado»; otro código → «Dictamen no reconocido». */
export function dictamenLabel(result: number | null): string {
  if (result === null) return DICTAMEN_NONE_LABEL;
  return DICTAMEN_LABELS[result as DictamenId] ?? DICTAMEN_UNKNOWN_LABEL;
}

export enum DictamenId {
  APROBADO = 1,
  APROBADO_CON_OBSERVACIONES = 2,
  RECHAZADO = 3
}

export type DictamenCode = 'APROBADO' | 'APROBADO_CON_OBSERVACIONES' | 'RECHAZADO';

export const DictamenMapping: Record<DictamenCode, DictamenId> = {
  APROBADO: DictamenId.APROBADO,
  APROBADO_CON_OBSERVACIONES: DictamenId.APROBADO_CON_OBSERVACIONES,
  RECHAZADO: DictamenId.RECHAZADO
} as const;

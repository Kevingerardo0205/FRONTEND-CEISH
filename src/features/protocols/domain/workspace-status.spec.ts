import { EstadoCatalog } from '@domain/catalogs/estado.catalog';
import { StageCode } from '@domain/value-objects/stage.vo';
import { estadoById } from '@shared/utils/estado.resolver';
import {
  UNKNOWN_STATUS_LABEL,
  workspaceStageCode,
  workspaceStatusCode,
  workspaceStatusLabel,
} from './workspace-status';

/** Etapa por id de la migración del backend `1890000000000-AddEtapaOrdenToEstados` (referencia). */
const EXPECTED_STAGE_BY_ID: Record<number, StageCode> = {
  9: 'RECEPCION',
  11: 'RECEPCION',
  12: 'RECEPCION',
  15: 'RECEPCION',
  20: 'RECEPCION',
  21: 'RECEPCION',
  10: 'ASIGNACION',
  13: 'EVALUACION',
  16: 'EVALUACION',
  14: 'RESOLUCION',
  17: 'RESOLUCION',
  18: 'RESOLUCION',
  19: 'RESOLUCION',
  25: 'RESOLUCION',
};

/** Casos reales de `GET /protocols/:id` (Paso 0 de S-1f): `receptionStatus` + `statusId` → estado canónico. */
const REAL_CASES: { name: string; reception: string; statusId: number | null; code: string }[] = [
  { name: 'borrador', reception: 'BORRADOR', statusId: null, code: 'INICIADO' },
  { name: 'enviado', reception: 'EN_REVISION_SECRETARIA', statusId: null, code: 'EN_REVISION_SECRETARIA' },
  { name: 'con observaciones', reception: 'INCOMPLETO', statusId: null, code: 'INCOMPLETO' },
  { name: 'por subsanar', reception: 'PENDIENTE_SUBSANACION', statusId: null, code: 'REQUIERE_SUBSANACION_DOC' },
  { name: 'archivado', reception: 'ARCHIVADO', statusId: null, code: 'ARCHIVADO_VENCIMIENTO' },
  { name: 'recepción aprobada', reception: 'COMPLETO', statusId: null, code: 'COMPLETO' },
  { name: 'en evaluación', reception: 'COMPLETO', statusId: 13, code: 'EN_EVALUACION' },
  { name: 'discrepancia de riesgo', reception: 'COMPLETO', statusId: 16, code: 'DISCREPANCIA_RIESGO' },
  { name: 'aprobado', reception: 'COMPLETO', statusId: 17, code: 'APROBADO' },
  { name: 'aprobado con condición', reception: 'COMPLETO', statusId: 25, code: 'APROBADO_CON_CONDICION' },
  { name: 'rechazado', reception: 'COMPLETO', statusId: 18, code: 'RECHAZADO' },
  { name: 'nueva versión en revisión', reception: 'EVALUACION_SUBSANACIONES', statusId: 21, code: 'EN_CONTROL_DOCUMENTAL' },
];

describe('workspaceStatusCode: estado canónico del espacio (F10 D13)', () => {
  for (const c of REAL_CASES) {
    it(c.name + ' (' + c.reception + ' + ' + c.statusId + ') → ' + c.code, () => {
      expect(workspaceStatusCode(c.statusId, c.reception)).toBe(c.code);
    });
  }

  it('con statusId NULL o undefined usa la recepción', () => {
    expect(workspaceStatusCode(null, 'COMPLETO')).toBe('COMPLETO');
    expect(workspaceStatusCode(undefined, 'COMPLETO')).toBe('COMPLETO');
  });

  it('statusId 25 nunca cae a la recepción', () => {
    expect(workspaceStatusCode(25, 'COMPLETO')).toBe('APROBADO_CON_CONDICION');
    expect(workspaceStageCode(workspaceStatusCode(25, 'COMPLETO'))).not.toBe('ASIGNACION');
  });

  it('un statusId fuera del catálogo no cae a la recepción', () => {
    expect(workspaceStatusCode(99, 'COMPLETO')).toBeNull();
  });

  it('sin statusId ni recepción reconocida da null', () => {
    expect(workspaceStatusCode(null, 'EVALUACION_SUBSANACIONES')).toBeNull();
    expect(workspaceStatusCode(null, undefined)).toBeNull();
  });
});

describe('workspaceStageCode: etapa temporal (F10 D13)', () => {
  for (const [id, stage] of Object.entries(EXPECTED_STAGE_BY_ID)) {
    it('el estado ' + id + ' está en ' + stage, () => {
      expect(workspaceStageCode(estadoById(Number(id))?.code ?? null)).toBe(stage);
    });
  }

  it('todos los estados del catálogo tienen etapa en la tabla de la migración', () => {
    for (const estado of Object.values(EstadoCatalog)) {
      expect(EXPECTED_STAGE_BY_ID[estado.id]).withContext(estado.code).toBeDefined();
    }
  });

  it('nunca da SEGUIMIENTO ni RENOVACION, y sin estado da null', () => {
    for (const estado of Object.values(EstadoCatalog)) {
      expect(['SEGUIMIENTO', 'RENOVACION']).not.toContain(workspaceStageCode(estado.code) as string);
    }
    expect(workspaceStageCode(null)).toBeNull();
    expect(workspaceStageCode('DESCONOCIDO')).toBeNull();
  });
});

describe('workspaceStatusLabel (F10 D13)', () => {
  const EXPECTED_LABELS: Record<string, string> = {
    INICIADO: 'Iniciado',
    EN_REVISION_SECRETARIA: 'Por validar',
    INCOMPLETO: 'Con observaciones',
    REQUIERE_SUBSANACION_DOC: 'Pendiente de subsanación',
    ARCHIVADO_VENCIMIENTO: 'Archivado',
    COMPLETO: 'Recepción aprobada',
    EN_EVALUACION: 'En evaluación',
    DISCREPANCIA_RIESGO: 'Discrepancia de riesgo',
    EVALUADO: 'Evaluado',
    APROBADO: 'Aprobado',
    APROBADO_CON_CONDICION: 'Aprobado con condiciones',
    RECHAZADO: 'Rechazado',
    REQUIERE_SUBSANACION_VERSION: 'Requiere nueva versión',
    EN_CONTROL_DOCUMENTAL: 'Nueva versión en revisión documental',
  };

  for (const [code, label] of Object.entries(EXPECTED_LABELS)) {
    it(code + ' → "' + label + '"', () => {
      expect(workspaceStatusLabel(code, false)).toBe(label);
    });
  }

  it('el borrador dice "Borrador" y un estado no reconocido, "Estado no reconocido"', () => {
    expect(workspaceStatusLabel('INICIADO', true)).toBe('Borrador');
    expect(workspaceStatusLabel(null, false)).toBe(UNKNOWN_STATUS_LABEL);
    expect(UNKNOWN_STATUS_LABEL).toBe('Estado no reconocido');
  });
});

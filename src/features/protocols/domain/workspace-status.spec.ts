import { EstadoCatalog } from '@domain/catalogs/estado.catalog';
import * as workspaceStatus from './workspace-status';
import {
  UNKNOWN_STATUS_LABEL,
  isAssignmentStatus,
  workspaceStatusCode,
  workspaceStatusLabel,
} from './workspace-status';

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
  });

  it('un statusId fuera del catálogo no cae a la recepción', () => {
    expect(workspaceStatusCode(99, 'COMPLETO')).toBeNull();
  });

  it('sin statusId ni recepción reconocida da null', () => {
    expect(workspaceStatusCode(null, 'EVALUACION_SUBSANACIONES')).toBeNull();
    expect(workspaceStatusCode(null, undefined)).toBeNull();
  });
});

describe('workspace-status sin etapa calculada (F10 D19)', () => {
  it('ya no exporta la etapa temporal: la etapa del espacio sale del backend', () => {
    expect(Object.keys(workspaceStatus)).not.toContain('workspaceStageCode');
  });
});

describe('isAssignmentStatus: acciones de la etapa ASIGNACION (F10 D13, D19)', () => {
  it('solo COMPLETO, el único estado de ASIGNACION en la migración', () => {
    for (const estado of Object.values(EstadoCatalog)) {
      expect(isAssignmentStatus(estado.code)).withContext(estado.code).toBe(estado.code === 'COMPLETO');
    }
    expect(isAssignmentStatus(null)).toBeFalse();
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

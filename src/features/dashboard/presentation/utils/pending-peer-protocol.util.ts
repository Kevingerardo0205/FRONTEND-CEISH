import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';

/**
 * Forma de cada elemento de GET /evaluations/protocols/pending-peer-assignment, que puede
 * llegar anidada o plana. Todos los campos son opcionales: la conversión pone valores por
 * defecto.
 */
export interface RawPendingPeerProtocol {
  id?: unknown;
  ceishCode?: string;
  code?: string;
  title?: string;
  titulo?: string;
  receptionStatus?: string;
  status?: string;
  estado?: string;
  isRiskLevelDesignated?: boolean;
  createdAt?: string;
  submissionDate?: string;
  receptionDate?: string;
  studyType?: {
    id?: unknown;
    codigo?: string;
    code?: string;
    nombre?: string;
    name?: string;
  };
  studyTypeCode?: string;
  type?: string;
  principalInvestigatorRecord?: {
    id?: unknown;
    fullName?: string;
    nombre?: string;
    email?: string;
  };
  principalInvestigator?: string;
}

/**
 * Convierte la respuesta de la bandeja de estratificación de riesgo por pares en
 * `PendingPeerAssignmentProtocol[]` (F01 T01-0). Extraída sin cambios de comportamiento de
 * `DashboardSecretariaPage`, para que la use también la página de `/estratificacion-riesgo`.
 * `now` solo existe para las pruebas: da la fecha por defecto cuando falta `createdAt`.
 */
export function toPendingPeerProtocols(
  list: readonly RawPendingPeerProtocol[],
  now: () => string = () => new Date().toISOString(),
): PendingPeerAssignmentProtocol[] {
  return list.map((p) => {
    const id = Number(p.id) || 0;
    const ceishCode = p.ceishCode || p.code || '';
    const title = p.title || p.titulo || 'Sin título';
    const receptionStatus = p.receptionStatus || p.status || p.estado || '';
    const isRiskLevelDesignated = p.isRiskLevelDesignated ?? false;
    const createdAt = p.createdAt || p.submissionDate || p.receptionDate || now();

    const studyType = p.studyType
      ? {
          id: Number(p.studyType.id) || 0,
          codigo: p.studyType.codigo || p.studyType.code || '',
          nombre: p.studyType.nombre || p.studyType.name || 'General',
        }
      : {
          id: 0,
          codigo: p.studyTypeCode || '',
          nombre: p.type || 'General',
        };

    const principalInvestigatorRecord = p.principalInvestigatorRecord
      ? {
          id: Number(p.principalInvestigatorRecord.id) || 0,
          fullName:
            p.principalInvestigatorRecord.fullName ||
            p.principalInvestigatorRecord.nombre ||
            'Investigador Principal',
          email: p.principalInvestigatorRecord.email || '',
        }
      : {
          id: 0,
          fullName: p.principalInvestigator || 'Investigador Principal',
          email: '',
        };

    return {
      id,
      ceishCode,
      title,
      receptionStatus,
      isRiskLevelDesignated,
      createdAt,
      studyType,
      principalInvestigatorRecord,
    };
  });
}

import { PeerEvaluatorProfile } from './peer-evaluation.entity';

/** Códigos del backend (F03 D9): la misma lista que la asignación y la reasignación. */
export type EvaluatorProfile = PeerEvaluatorProfile;

export interface EvaluatorEntity {
  id: string;
  nombre: string;
  email: string;
  perfil: EvaluatorProfile;
  cargaActiva: number;
}

export type EvaluatorProfile = 'JURIDICO' | 'SALUD' | 'METODOLOGIA' | 'SOCIEDAD_CIVIL';

export interface EvaluatorEntity {
  id: string;
  nombre: string;
  email: string;
  perfil: EvaluatorProfile;
  cargaActiva: number;
}

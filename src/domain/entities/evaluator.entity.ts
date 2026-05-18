export type EvaluatorProfile = 'JURIDICO' | 'SALUD' | 'METODOLOGIA' | 'BIOETICA' | 'SOCIEDAD_CIVIL';

export interface EvaluatorEntity {
  id: string;
  nombre: string;
  email: string;
  perfil: EvaluatorProfile;
  cargaActiva: number;
}

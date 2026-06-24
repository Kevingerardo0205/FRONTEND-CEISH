import { ProtocolType } from '../enums/protocol-type.enum';

export interface PendingPeerAssignmentProtocol {
  id: number;
  ceishCode: string;
  title: string;
  receptionStatus: string;
  isRiskLevelDesignated: boolean;
  createdAt: string;
  studyType: {
    id: number;
    codigo: string;
    nombre: string;
  };
  principalInvestigatorRecord: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface PeerAssignmentEntity {
  id: number;
  protocolId: number;
  evaluatorId: number;
  proposedRiskLevelId: number | null;
  observations: string | null;
  assignedAt: string;
  submittedAt: string | null;
  protocol: {
    id: number;
    ceishCode: string;
    title: string;
    studyType: {
      nombre: string;
    };
    principalInvestigatorRecord: {
      fullName: string;
    };
  };
}

export interface AssignEvaluatorsResponse {
  message: string;
  totalEvaluators: number;
  riskEvaluators: number[];
  allEvaluators: number[];
  versionId?: number;
  evaluationAssignmentIds?: number[];
  deadline: string;
}

export interface RiskLevelInfo {
  id: number;
  name: string;
  description: string;
}

export const PET_RISK_LEVELS: RiskLevelInfo[] = [
  { 
    id: 4, 
    name: 'Sin Riesgo', 
    description: 'No realiza ninguna intervención biológica, psicológica o social. Datos anonimizados, fuentes abiertas.' 
  },
  { 
    id: 5, 
    name: 'Riesgo Mínimo', 
    description: 'Riesgos equivalentes a la vida diaria o práctica médica de rutina (ej: revisión de historias clínicas anonimizadas).' 
  },
  { 
    id: 6, 
    name: 'Riesgo Moderado', 
    description: 'Exposición a mediciones o intervenciones controladas de bajo impacto.' 
  },
  { 
    id: 7, 
    name: 'Riesgo Mayor', 
    description: 'Probabilidades significativas de daño físico, psicológico o social prolongado. Uso de datos personales sensibles (PII).' 
  },
  { 
    id: 8, 
    name: 'Ensayo Clínico', 
    description: 'Pruebas de medicamentos, vacunas, o dispositivos con intervención clínica directa.' 
  }
];

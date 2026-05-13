export enum EvaluationVerdict {
  FAVORABLE = 'FAVORABLE',
  OBSERVED = 'OBSERVED',
  NEGATIVE = 'NEGATIVE',
  APROBADO = 'APROBADO',
  NO_APROBADO = 'NO_APROBADO',
  CON_OBSERVACIONES = 'CON_OBSERVACIONES'
}

export type ComplianceStatus = 'C' | 'NC' | 'NA'; // Cumple, No cumple, No aplica

export interface EthicalSection {
  balanceBeneficioRiesgo?: boolean;
  consentimientoInformadoValido?: boolean;
  proteccionDatosSensibles?: boolean;
  observaciones?: string;
  // Ezekiel Emanuel Core
  respetoPersonaComunidad?: ComplianceStatus;
  autonomiaConsentimiento?: ComplianceStatus;
  beneficenciaValoracion?: ComplianceStatus;
  confidencialidad?: ComplianceStatus;
  aleatorizacionEquitativa?: ComplianceStatus;
  proteccionVulnerables?: ComplianceStatus;
  riesgosPotenciales?: ComplianceStatus;
  beneficiosPotenciales?: ComplianceStatus;
  competenciasExperticia?: ComplianceStatus;
  declaracionConflictoInteres?: ComplianceStatus;
}

export interface MethodologySection {
  objetivosClaros?: boolean;
  metodologiaAdecuada?: boolean;
  tamanoMuestraJustificado?: boolean;
  observaciones?: string;
  // Detailed Methodology
  coherenciaTituloObjetivos?: ComplianceStatus;
  disenoEstudio?: ComplianceStatus;
  sujetosTamanoMuestra?: ComplianceStatus;
  definicionVariables?: ComplianceStatus;
  medicionVariables?: ComplianceStatus;
  estandarizacion?: ComplianceStatus;
  manejoDatos?: ComplianceStatus;
  analisisEstadistico?: ComplianceStatus;
  resultadosBeneficios?: ComplianceStatus;
  referenciasBibliograficas?: ComplianceStatus;
  coherenciaCronogramaFinanciamiento?: ComplianceStatus;
  anexos?: ComplianceStatus;
}

export interface LegalSection {
  cumpleNormativaNacional?: boolean;
  declaracionConflictoInteres?: boolean;
  observaciones?: string;
  // Detailed Legal
  acordeLegislacionNacionalInternacional?: ComplianceStatus;
  estudioMulticentricoAprobacion?: ComplianceStatus;
  contratoPromotorInvestigadores?: ComplianceStatus;
  acuerdosPromotorSitioClinico?: ComplianceStatus;
  polizaSeguroResponsabilidades?: ComplianceStatus;
}

export interface Annex9 {
  cumpleCriteriosExpedita: boolean;
  justificacion: string;
  etica: EthicalSection;
}

export interface Annex10 {
  etica: EthicalSection;
  metodologia: MethodologySection;
  legal: LegalSection;
}

export interface Annex11 extends Annex10 {
  aprobacionArcsaVerificada: boolean;
  polizaSeguroVigente: boolean;
  comentariosFarmaco: string;
}

export interface EvaluationEntity {
  id: string;
  protocolId: string;
  evaluatorId: string;
  verdict: EvaluationVerdict;
  evaluationDate: Date;
  annex9?: Annex9;
  annex10?: Annex10;
  annex11?: Annex11;
  status: 'PENDING' | 'COMPLETED';
}

export interface SubmitEvaluationDto {
  assignmentId: string;
  result: EvaluationVerdict;
  annex9?: Annex9;
  annex10?: Annex10;
  annex11?: Annex11;
}

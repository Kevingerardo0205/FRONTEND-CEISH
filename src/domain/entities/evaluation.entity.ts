export enum EvaluationVerdict {
  // Valores legacy — se conservan para compatibilidad con el mock adapter
  FAVORABLE = 'FAVORABLE',
  OBSERVED = 'OBSERVED',
  NEGATIVE = 'NEGATIVE',
  // Valores actuales del backend
  APROBADO = 'APROBADO',
  NO_APROBADO = 'NO_APROBADO',
  CON_OBSERVACIONES = 'CON_OBSERVACIONES',
  APROBADO_CON_OBSERVACIONES = 'APROBADO_CON_OBSERVACIONES',
  RECHAZADO = 'RECHAZADO',
  PENDIENTE_SUBSANACION = 'PENDIENTE_SUBSANACION'
}

/** Valores exactos que acepta el campo `result` del SubmitEvaluationDto del backend PET */
export type PetGlobalResult =
  | 'APROBADO'
  | 'APROBADO_CON_OBSERVACIONES'
  | 'RECHAZADO'
  | 'PENDIENTE_SUBSANACION';

/** Resultado por seccion en Revision Expedita (Anexo 9) */
export type PetSectionResult = 'APROBADO' | 'NO_APROBADO' | 'CON_OBSERVACIONES';

/** Resultado de dictamen en Pleno y Ensayos Clinicos (Anexo 10 y 11) */
export type PetPlenoResult = 'APROBADO' | 'APROBADO_CONDICIONADO' | 'NO_APROBADO';

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
  protocolCode?: string;
  protocolTitle?: string;
  protocolType?: string;
  investigator?: string;
  deadline?: Date;
  daysRemaining?: number;
  isUrgent?: boolean;
  annexToUse?: 'ANEXO_9' | 'ANEXO_10' | 'ANEXO_11';
  reviewType?: 'EXPEDITA' | 'PLENO' | 'ENSAYO_CLINICO';
  verdict: EvaluationVerdict;
  evaluationDate: Date;
  annex9?: Annex9;
  annex10?: Annex10;
  annex11?: Annex11;
  status: 'PENDING' | 'COMPLETED' | 'CONSOLIDATED';
}

// -------------------------------------------------------------------------
// DTOs del contrato real del backend PET — Evaluacion Tecnica
// -------------------------------------------------------------------------

export interface PetChecklistItem {
  itemCodigo: string;
  estado: ComplianceStatus;
  observaciones: string | null;
}

export interface PetAnnex9Section {
  resultado: PetSectionResult;
  plazo: string | null;
  observaciones: string | null;
  items: PetChecklistItem[];
}

/** DTO de Anexo 9 (Revision Expedita) — campos exigidos por el backend (Fase 1 y 2) */
export interface Annex9PetDto {
  etica: PetAnnex9Section;
  metodologia: PetAnnex9Section;
  juridica: PetAnnex9Section;
}

/** DTO de Anexo 10 (Revision en Pleno) — campos exigidos por el backend */
export interface Annex10PetDto {
  resultado: PetPlenoResult;
  condicionesDescripcion?: string; // Requerido si resultado === 'APROBADO_CONDICIONADO'
}

/** DTO de Anexo 11 (Ensayos Clinicos) — campos exigidos por el backend */
export interface Annex11PetDto {
  resultado: PetPlenoResult;
  fechaEvaluacion: string;         // Siempre requerido — formato ISO: YYYY-MM-DD
}

/**
 * Contrato de API real del backend para enviar una evaluacion tecnica.
 * Ruta: POST /api/evaluations/submit
 */
export interface SubmitEvaluationDto {
  assignmentId: number;            // ID numerico de la asignacion
  result: number;                  // Dictamen global obligatorio (1=APROBADO, 2=APROBADO_CON_OBSERVACIONES, 3=RECHAZADO)
  observations?: string;           // Justificacion general del evaluador
  reportPath?: string;             // Ruta en R2/S3 — Obligatoria solo si isDraft === false
  isDraft?: boolean;               // Borrador (opcional)
  annex9?: Annex9PetDto;           // Solo si reviewType === 'EXPEDITA'
  annex10?: Annex10PetDto;         // Solo si reviewType === 'PLENO'
  annex11?: Annex11PetDto;         // Solo si reviewType === 'ENSAYO_CLINICO'
}

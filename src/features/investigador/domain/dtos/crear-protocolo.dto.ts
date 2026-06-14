import { TipoEstudio } from '../../constants/anexos-pet.constants';

export enum EstadoProtocolo {
  BORRADOR = 'BORRADOR',
  EN_REVISION_DOCUMENTAL = 'EN_REVISION_DOCUMENTAL',
  EN_REVISION_SECRETARIA = 'EN_REVISION_SECRETARIA',
  REQUIERE_CORRECCION = 'REQUIERE_CORRECCION',
  LISTO_PARA_EVALUACION = 'LISTO_PARA_EVALUACION',
  EN_EVALUACION = 'EN_EVALUACION',
  APROBADO_DEFINITIVO = 'APROBADO_DEFINITIVO',
  APROBADO_CONDICIONADO = 'APROBADO_CONDICIONADO',
  NO_APROBADO = 'NO_APROBADO',
  ARCHIVADO = 'ARCHIVADO',
  VENCIDO = 'VENCIDO',
  COMPLETO = 'COMPLETO'
}

export enum RequirementStatus {
  NO_PRESENTADO = 'NO_PRESENTADO',
  PRESENTADO = 'PRESENTADO',
  OBSERVADO = 'OBSERVADO'
}

export interface ChecklistRequirement {
  id: number;
  requirementCode: string;
  requirementName: string;
  status: RequirementStatus;
  observations?: string;
}

export interface InvestigadorEquipo {
  fullName: string;
  identification: string;
  position: string;
  institution: string;
  email: string;
  phone: string;
  education: string;
  role: string;
}

export interface InstitucionParticipante {
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  address: string;
  contactPerson: string;
}

/**
 * DTO para la creación de protocolos siguiendo el Acuerdo Ministerial y PET 4.1.
 * Los flags booleanos disparan el cálculo dinámico del checklist en el Backend.
 */
export interface CrearProtocoloDto {
  title: string;
  principalInvestigatorId: number; 
  studyTypeId: number;
  riskLevelId: number;
  geographicCoverage: string;
  studyDurationMonths: number;
  
  // Interruptores Legales (Mandatorios para Sprint 3)
  usesBiologicalSamples: boolean;
  isVulnerablePopulation: boolean;
  isIndigenousPopulation: boolean;
  isMulticentric: boolean;
  
  hasExternalInstitutions: boolean;
  sponsorRuc: string;
  sponsorPhone: string;
  sponsorAddress: string;
  sponsorWeb?: string;
  sponsorExecutingAgency: string;
  financingAmount: number;
  isAffidavitAccepted: boolean;
  
  investigators: InvestigadorEquipo[];
  institutions: InstitucionParticipante[];
  lugarEjecucion?: string;
  fechaInicioEstimada?: string;
  fechaFinEstimada?: string;
}

export interface ProtocoloCreadoResponse {
  id: number;
  codigoCeish: string;
  estado: EstadoProtocolo;
  fechaRecepcion: string;
  mensaje?: string;
}

export interface ProtocoloResumen {
  id: number;
  codigoCeish: string;
  titulo: string;
  estado: EstadoProtocolo;
  fechaCreacion: string;
  tipoEstudio?: string;
  isTimelineTermsAccepted?: boolean;
  timelineTermsAcceptedAt?: string | null;
  timelineTermsAcceptedIp?: string | null;
  versionNumber?: number;
}

export interface ProtocoloDetalle extends CrearProtocoloDto {
  id: number;
  codigoCeish: string;
  estado: EstadoProtocolo;
  fechaCreacion: string;
  investigadorPrincipal: string;
  resumen?: string;
  disenoEstudio?: string;
  institucionPatrocinadora?: string;
  titulo: string;
  tipoEstudio?: string;
  isTimelineTermsAccepted?: boolean;
  timelineTermsAcceptedAt?: string | null;
  timelineTermsAcceptedIp?: string | null;
}

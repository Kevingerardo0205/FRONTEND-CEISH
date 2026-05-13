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
  VENCIDO = 'VENCIDO'
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

export interface CrearProtocoloDto {
  title: string;
  principalInvestigatorId?: number; // Cambiado a number
  studyTypeId: number;
  riskLevelId: number;
  geographicCoverage: string;
  studyDurationMonths: number;
  usesBiologicalSamples: boolean;
  isVulnerablePopulation: boolean;
  isMulticentric: boolean;
  hasExternalInstitutions: boolean;
  sponsorRuc: string;
  sponsorPhone: string;
  sponsorAddress: string;
  sponsorWeb?: string;
  sponsorExecutingAgency: string;
  financingAmount: number;
  isAffidavitAccepted: boolean;
  isIndigenousPopulation: boolean;
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
}

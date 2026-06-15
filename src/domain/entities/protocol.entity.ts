import { ProtocolType } from '../enums/protocol-type.enum';
import { ProtocolStatus } from '../enums/protocol-status.enum';
import { DocumentEntity } from './document.entity';

export interface ProtocolEntity {
  id: string;
  code?: string;
  title: string;
  investigatorId: string;
  principalInvestigator?: string;
  type: ProtocolType;
  studyTypeCode?: string;
  studyType?: any;
  status: ProtocolStatus;
  submissionDate?: Date;
  validationDate?: Date;
  documents: DocumentEntity[];
  version: number | string;
  deadline?: string | Date;

  // Campos Diferidos Adicionales
  riskLevel?: any;
  riskLevelId?: number;
  geographicCoverage?: string;
  studyDurationMonths?: number;
  lugarEjecucion?: string;
  fechaInicioEstimada?: string;
  fechaFinEstimada?: string;
  sponsorRuc?: string;
  sponsorPhone?: string;
  sponsorAddress?: string;
  sponsorWeb?: string;
  sponsorExecutingAgency?: string;
  financingAmount?: number;
  
  // Aceptación de Tiempos y Reglamentos (CEISH)
  isTimelineTermsAccepted?: boolean;
  timelineTermsAcceptedAt?: string | null;
  timelineTermsAcceptedIp?: string | null;
  versions?: ProtocolVersionEntity[];
}

export interface ProtocolVersionEntity {
  id: string | number;
  versionNumber: number;
  status: string;
  statusId?: number;
  resolutionType?: any;
  majorObservations?: string;
  minorObservations?: string;
  correctionProcedure?: string;
  createdAt?: Date;
}

export interface ValidationHeader {
  id: number;
  ceishCode: string;
  title: string;
  submissionDate: string;
  investigator: string;
  studyType: string;
}

export interface ValidationChecklistItem {
  id: number;
  code: string;
  name: string;
  status: string;
  observations: string | null;
  attachedDocument: {
    id: number;
    fileName: string;
    path: string;
    isValidated: boolean;
    uploadedAt: string;
    originalPageCount?: number;
    pageCount?: number | null;
  } | null;
}

export interface ValidationGlobalStatus {
  isComplete: boolean;
  status: string;
  hasMissingItems: boolean;
  missingItemsList: string | null;
  submissionDeadline: string | null;
}

export interface ValidationDetailResponse {
  header: ValidationHeader;
  checklist: ValidationChecklistItem[];
  globalStatus: ValidationGlobalStatus;
}

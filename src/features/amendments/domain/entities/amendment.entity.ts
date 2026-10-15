export enum AmendmentType {
  METHODOLOGY = 'METHODOLOGY',
  INFORMED_CONSENT = 'INFORMED_CONSENT',
  INVESTIGATION_TEAM = 'INVESTIGATION_TEAM',
  SCHEDULE = 'SCHEDULE',
  BUDGET = 'BUDGET',
  SAMPLE_SIZE = 'SAMPLE_SIZE',
  OTHER = 'OTHER'
}

export enum AmendmentSeverity {
  SUBSTANTIAL = 'SUBSTANTIAL', // Modificación sustancial que altera riesgo/beneficio
  NON_SUBSTANTIAL = 'NON_SUBSTANTIAL' // Modificación menor administrativa
}

export enum AmendmentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  OBSERVED = 'OBSERVED',
  REJECTED = 'REJECTED'
}

export interface AmendmentDocument {
  id?: string;
  name: string;
  type: 'TRACKED_CHANGES' | 'CLEAN_VERSION' | 'JUSTIFICATION_REPORT' | 'OTHER';
  file?: File;
  fileUrl?: string;
  sizeBytes?: number;
  uploadedAt?: Date | string;
}

export interface AmendmentItem {
  id: string;
  protocolId: string;
  protocolCode: string;
  protocolTitle: string;
  investigatorName: string;
  type: AmendmentType;
  severity: AmendmentSeverity;
  status: AmendmentStatus;
  justification: string;
  ethicalImpactDescription: string;
  documents: AmendmentDocument[];
  submittedAt: Date | string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  reviewNotes?: string;
  versionNumber: number;
}

export interface CreateAmendmentDTO {
  protocolId: string;
  protocolCode: string;
  protocolTitle: string;
  type: AmendmentType;
  severity: AmendmentSeverity;
  justification: string;
  ethicalImpactDescription: string;
  documents: {
    name: string;
    type: 'TRACKED_CHANGES' | 'CLEAN_VERSION' | 'JUSTIFICATION_REPORT' | 'OTHER';
    file?: File;
  }[];
}

export interface ReviewAmendmentDTO {
  amendmentId: string;
  status: AmendmentStatus.APPROVED | AmendmentStatus.OBSERVED | AmendmentStatus.REJECTED;
  reviewNotes: string;
}

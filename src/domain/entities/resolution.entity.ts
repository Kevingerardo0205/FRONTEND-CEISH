export interface ResolutionEntity {
  id?: string;
  protocolId: string;
  resolutionType: 'APPROVAL' | 'CONDITIONAL' | 'REJECTION' | 'EXEMPTION';
  observations?: string;
  justification?: string;
  validityMonths?: number;
  reportPeriodicityMonths?: number;
  deadlineDays?: number;
  fileUrl?: string;
  createdAt?: Date;
}

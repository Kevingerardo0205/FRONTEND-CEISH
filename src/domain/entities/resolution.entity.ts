export interface ResolutionEntity {
  id?: string | number;
  protocolId: string | number;
  versionId: string | number;
  resolutionTypeId: number; // 1: APPROVAL, 2: CONDITIONAL, 3: REJECTION
  resolutionType?: 'APPROVAL' | 'CONDITIONAL' | 'REJECTION' | 'EXEMPTION'; // UI helper mapped from ID
  issuedAt?: Date | string; // fecha_emision
  validityYears: number; // vigencia_aprobacion_anios
  followUpPeriodDays?: number; // periodo_seguimiento_dias
  observations?: string; // Consolidated observations string (observaciones)
  letterFilePath?: string; // archivo_carta_pdf
  pdfLetterPath?: string; // ruta del PDF en S3/R2
  createdByUserId?: number; // creado_por

  // Virtual/UI properties mapped from consolidated observations
  majorObservations?: string;
  minorObservations?: string;
  correctionProcedure?: string;
}

import { ProtocolType } from '@domain/enums/protocol-type.enum';

export interface RequiredDocument {
  type: string;
  label: string;
  required: boolean;
}

export interface ValidationStrategy {
  type: ProtocolType;
  getRequiredDocuments(): RequiredDocument[];
  validate(files: { type: string }[]): { isValid: boolean; missing: string[] };
}

import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ValidationStrategy, RequiredDocument } from './validation.strategy';

export class EiValidationStrategy implements ValidationStrategy {
  type = ProtocolType.EI;

  getRequiredDocuments(): RequiredDocument[] {
    return [
      { type: 'CV_INVESTIGADOR', label: 'CV del Investigador', required: true }
    ];
  }

  validate(files: { type: string }[]): { isValid: boolean; missing: string[] } {
    const required = this.getRequiredDocuments().filter(d => d.required);
    const missing = required
      .filter(req => !files.some(f => f.type === req.type))
      .map(m => m.label);

    return { isValid: missing.length === 0, missing };
  }
}

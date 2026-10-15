import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ValidationStrategy, RequiredDocument } from './validation.strategy';

export class EcValidationStrategy implements ValidationStrategy {
  type = ProtocolType.EC;

  getRequiredDocuments(): RequiredDocument[] {
    return [
      { type: 'SOLICITUD', label: 'Solicitud dirigida a la Presidenta', required: true },
      { type: 'FORMULARIO_PET', label: 'Formulario PET 2023 (Anexo 3)', required: true },
      { type: 'PROTOCOL_ENSAYO', label: 'Protocolo de Ensayo Clínico Fase I/II/III', required: true },
      { type: 'APROBACION_ARCSA', label: 'Certificación de ARCSA', required: true },
      { type: 'POLIZA_SEGURO', label: 'Póliza de Seguro Internacional', required: true },
      { type: 'CONVENIO', label: 'Convenio entre instituciones', required: true }
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

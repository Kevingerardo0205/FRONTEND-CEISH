import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ValidationStrategy, RequiredDocument } from './validation.strategy';

export class IoValidationStrategy implements ValidationStrategy {
  type = ProtocolType.IO;

  getRequiredDocuments(): RequiredDocument[] {
    return [
      { type: 'SOLICITUD_ANEXO_1', label: 'Solicitud de evaluación del protocolo de investigación observacional en seres humanos, formato Anexo 1', required: true },
      { type: 'FORMULARIO_ANEXO_2', label: 'Formulario para la presentación de protocolos de investigaciones observacionales en seres humanos, formato Anexo 2', required: true },
      { type: 'CONSENTIMIENTO_INFORMADO', label: 'Documento de consentimiento informado que se utilizará en sujetos de investigación mayores de edad. Para el caso de sujetos de investigación menores de edad, será necesario presentar el documento de consentimiento de informado que suscribirá su o sus representantes legales y se deberá presentar adicionalmente, el documento asentimiento informado que deberá estar dirigido a los menores de edad, según su capacidad cognitiva...', required: true },
      { type: 'CONSENTIMIENTO_COLECTIVO', label: 'En el caso de investigaciones observacionales que se plantee realizar en comunidades, pueblos y nacionalidades del Ecuador, es necesario que se presenten un documento de consentimiento colectivo o comunitario suscrito por el líder...', required: false },
      { type: 'INSTRUMENTOS_RECOLECCION', label: 'Todos los instrumentos que se utilizarán para la ejecución de la investigación observacional, por ejemplo: fichas técnicas, material de entrevistas, encuestas, instrucciones escritas, manuales, guías, entre otros.', required: true },
      { type: 'COMPROMISO_CONFIDENCIALIDAD', label: 'En caso de estudios observacionales con utilización de muestras biológicas humanas, con participación de sujetos vulnerables... declaratoria de compromisos de confidencialidad', required: true },
      { type: 'CONFLICTO_INTERES', label: 'En estudios observacionales con utilización de muestras biológicas humanas, con participación de sujetos vulnerables... La declaración de conflicto de interés', required: true },
      { type: 'HOJA_VIDA', label: 'Hoja de vida de los investigadores que formaran parte de los estudios.', required: true },
      { type: 'RESPONSABILIDAD_ANEXO_4', label: 'Declaración de responsabilidad del investigador principal... Anexo 4', required: true },
      { type: 'CARTA_INTERES_ANEXO_5', label: 'Si la investigación se realiza en establecimientos públicos o privados... carta de interés (Anexo 5)', required: true },
      { type: 'ACTA_APROBACION_TEMA', label: 'Acta de aprobación del tema', required: true },
      { type: 'CERTIFICACION_TUTOR', label: 'Carta certificación revisión del protocolo firmada por el tutor y asesor', required: true }
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

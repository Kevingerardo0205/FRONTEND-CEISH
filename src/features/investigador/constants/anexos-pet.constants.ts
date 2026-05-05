export enum TipoEstudio {
  OBSERVACIONAL = 'IO',
  INTERVENCION = 'EI',
  ENSAYO_CLINICO = 'EC'
}

export interface RequisitoDocumento {
  id: string;
  nombre: string;
  anexo: string;
  obligatorioPara: TipoEstudio[];
  esCondicional?: boolean;
  condicion?: string;
  aceptaMultiple?: boolean;
  maxSizeMB?: number;
  formatosAceptados?: string[];
}

export const REQUISITOS_DOCUMENTOS: RequisitoDocumento[] = [
  {
    id: 'anexo1_solicitud',
    nombre: 'Solicitud de evaluación del protocolo (Dirigida a la Presidencia)',
    anexo: 'Anexo 1',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'anexo2_formulario',
    nombre: 'Formulario de presentación de protocolo',
    anexo: 'Anexo 2',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'anexo3_consentimiento',
    nombre: 'Documento de consentimiento informado / Asentimiento',
    anexo: 'Anexo 3',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
    esCondicional: true,
    condicion: 'Requerido si el estudio involucra seres humanos o muestras biológicas',
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'protocolo_investigacion',
    nombre: 'Protocolo de Investigación Completo',
    anexo: 'Documento Técnico',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 20,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'anexo6_carta_ec',
    nombre: 'Carta de solicitud de evaluación de ensayos clínicos',
    anexo: 'Anexo 6',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'poliza_seguro',
    nombre: 'Póliza de Seguro de responsabilidad civil',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'aprobacion_arcsa',
    nombre: 'Aprobación o Certificación de ARCSA',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'cv_investigadores',
    nombre: 'Curriculum Vitae de los investigadores (Actualizado)',
    anexo: 'Soporte',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
    aceptaMultiple: true,
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  }
];

export const getRequisitosPorTipoEstudio = (tipo: TipoEstudio): RequisitoDocumento[] => {
  return REQUISITOS_DOCUMENTOS.filter(req => 
    req.obligatorioPara.includes(tipo)
  );
};

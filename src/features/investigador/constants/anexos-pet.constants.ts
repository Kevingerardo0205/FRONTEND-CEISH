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
    id: 'instrumentos_utilizados',
    nombre: 'Instrumentos utilizados',
    anexo: 'Soporte Técnico',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'declaratoria_confidencialidad',
    nombre: 'Declaratoria de compromisos de confidencialidad',
    anexo: 'Soporte Ético',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'declaracion_conflicto_interes',
    nombre: 'Declaración de conflicto de interés',
    anexo: 'Soporte Ético',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'anexo4_responsabilidad',
    nombre: 'Declaración de responsabilidad del investigador principal del centro o de los centros de investigación',
    anexo: 'Anexo 4',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'carta_interes_institucional',
    nombre: 'Carta de interés institucional',
    anexo: 'Anexo 5',
    obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'ficha_intervencion',
    nombre: 'Ficha que describa de forma completa la intervención',
    anexo: 'Soporte Técnico',
    obligatorioPara: [TipoEstudio.INTERVENCION],
    maxSizeMB: 10,
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
    id: 'protocolo_investigacion',
    nombre: 'Protocolo de Investigación Completo',
    anexo: 'Documento Técnico',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 20,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'ficha_descriptiva_ensayo',
    nombre: 'Ficha descriptiva del ensayo clínico',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'manual_investigador_bpc',
    nombre: 'Manual del investigador (Buenas Prácticas Clínicas)',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 20,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'material_reclutamiento',
    nombre: 'Material de reclutamiento (Afiches, guiones, etc.)',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'instrumentos_recoleccion_ec',
    nombre: 'Instrumentos de recolección de datos / cuadernos de recogida',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'poliza_seguro',
    nombre: 'Póliza de Seguro de responsabilidad civil del ensayo',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'certificados_bioetica',
    nombre: 'Certificados de capacitación en bioética de investigadores',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'registro_senescyt_ip',
    nombre: 'Registro de la SENESCYT del Investigador Principal',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 5,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'seguridad_farmaco_experimental',
    nombre: 'Información sobre seguridad del fármaco experimental',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 15,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'aprobacion_comite_extranjero',
    nombre: 'Aprobación de comité de ética extranjero (Si aplica)',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    esCondicional: true,
    condicion: 'Obligatorio para estudios multicéntricos internacionales',
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'contrato_promotor_investigadores',
    nombre: 'Contrato entre el promotor y los investigadores',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'plan_monitoreo_ensayo',
    nombre: 'Plan de monitoreo del ensayo',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  },
  {
    id: 'plan_seguridad_participante',
    nombre: 'Plan de seguridad y seguimiento del participante',
    anexo: 'Requisito EC',
    obligatorioPara: [TipoEstudio.ENSAYO_CLINICO],
    maxSizeMB: 10,
    formatosAceptados: ['application/pdf']
  }
];

export const getRequisitosPorTipoEstudio = (tipo: TipoEstudio): RequisitoDocumento[] => {
  return REQUISITOS_DOCUMENTOS.filter(req => 
    req.obligatorioPara.includes(tipo)
  );
};

import { ProtocolType } from "@domain/enums/protocol-type.enum";

export enum TipoRevision {
  EXPEDITA = 'EXPEDITA',
  PLENO = 'PLENO',
  ENSAYO_CLINICO = 'ENSAYO_CLINICO'
}

export interface CampoEvaluacion {
  id: string;
  label: string;
  tipo: 'check' | 'text' | 'compliance'; // compliance: C, NC, NA
  obligatorio: boolean;
  seccion: 'TECNICA' | 'ETICA' | 'JURIDICA' | 'GENERAL';
  descripcion?: string;
}

export interface AnexoEvaluacion {
  id: string;
  titulo: string;
  anexo: string;
  tipoRevision: TipoRevision;
  campos: CampoEvaluacion[];
}

/**
 * Los 7 Criterios de Ezekiel Emanuel (Núcleo de Evaluación Ética)
 */
export const CRITERIOS_EMANUEL: CampoEvaluacion[] = [
  { id: 'valorSocial', label: 'Valor Social', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'Genera beneficios reales para los participantes o la comunidad.' },
  { id: 'validezCientifica', label: 'Validez Científica', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'Metodología bien planteada, objetivos claros e instrumentos validados.' },
  { id: 'seleccionEquitativa', label: 'Selección Equitativa', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'Oportunidad de inclusión sin discriminación arbitraria.' },
  { id: 'riesgoBeneficio', label: 'Riesgo-Beneficio Favorable', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'Beneficios potenciales superan claramente los riesgos.' },
  { id: 'evaluacionIndependiente', label: 'Evaluación Independiente', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'No existe conflicto de intereses.' },
  { id: 'consentimientoInformado', label: 'Consentimiento Informado', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'Correctamente aplicado, documentado y comprendido.' },
  { id: 'proteccionVulnerables', label: 'Protección de Vulnerables', tipo: 'compliance', obligatorio: true, seccion: 'ETICA', descripcion: 'Consideración especial a poblaciones vulnerables y confidencialidad.' }
];

/**
 * Evaluación Metodológica Detallada (PET)
 */
export const METODOLOGIA_DETALLADA: CampoEvaluacion[] = [
  { id: 'coherenciaTitulo', label: 'Coherencia Título-Objetivos', tipo: 'compliance', obligatorio: true, seccion: 'TECNICA' },
  { id: 'disenoEstudio', label: 'Diseño del Estudio', tipo: 'compliance', obligatorio: true, seccion: 'TECNICA' },
  { id: 'sujetosMuestra', label: 'Sujetos y Tamaño de Muestra', tipo: 'compliance', obligatorio: true, seccion: 'TECNICA' },
  { id: 'definicionVariables', label: 'Definición de Variables', tipo: 'compliance', obligatorio: true, seccion: 'TECNICA' },
  { id: 'manejoDatos', label: 'Manejo de Datos y Análisis', tipo: 'compliance', obligatorio: true, seccion: 'TECNICA' }
];

/**
 * Evaluación Jurídica Detallada (PET)
 */
export const JURIDICA_DETALLADA: CampoEvaluacion[] = [
  { id: 'acordeLegislacion', label: 'Acorde a Legislación Nacional', tipo: 'compliance', obligatorio: true, seccion: 'JURIDICA' },
  { id: 'contratoInvestigadores', label: 'Contrato/Acuerdos Investigadores', tipo: 'compliance', obligatorio: true, seccion: 'JURIDICA' }
];

export const ANEXOS_EVALUACION: AnexoEvaluacion[] = [
  {
    id: 'anexo9',
    titulo: 'Revisión Expedita (Estudios Observacionales)',
    anexo: 'Anexo 9',
    tipoRevision: TipoRevision.EXPEDITA,
    campos: [
      { id: 'cumpleCriteriosExpedita', label: 'Cumple criterios para revisión expedita', tipo: 'check', obligatorio: true, seccion: 'GENERAL' },
      { id: 'justificacion', label: 'Justificación del tipo de revisión', tipo: 'text', obligatorio: true, seccion: 'GENERAL' },
      ...CRITERIOS_EMANUEL
    ]
  },
  {
    id: 'anexo10',
    titulo: 'Revisión por Pleno (Intervención/Riesgo)',
    anexo: 'Anexo 10',
    tipoRevision: TipoRevision.PLENO,
    campos: [
      ...CRITERIOS_EMANUEL,
      ...METODOLOGIA_DETALLADA,
      ...JURIDICA_DETALLADA
    ]
  },
  {
    id: 'anexo11',
    titulo: 'Evaluación de Ensayos Clínicos',
    anexo: 'Anexo 11',
    tipoRevision: TipoRevision.ENSAYO_CLINICO,
    campos: [
      ...CRITERIOS_EMANUEL,
      ...METODOLOGIA_DETALLADA,
      ...JURIDICA_DETALLADA,
      { id: 'aprobacionArcsaVerificada', label: 'Aprobación ARCSA Verificada', tipo: 'check', obligatorio: true, seccion: 'JURIDICA' },
      { id: 'polizaSeguroVigente', label: 'Póliza de Seguro Vigente', tipo: 'check', obligatorio: true, seccion: 'JURIDICA' },
      { id: 'comentariosFarmaco', label: 'Datos sobre Fármaco/Producto', tipo: 'text', obligatorio: true, seccion: 'TECNICA' }
    ]
  }
];

export const getAnexoPorTipo = (tipoProtocolo: ProtocolType, esExpedita: boolean = false): AnexoEvaluacion => {
  if (tipoProtocolo === ProtocolType.EC) return ANEXOS_EVALUACION[2]; // Anexo 11
  if (esExpedita) return ANEXOS_EVALUACION[0]; // Anexo 9
  return ANEXOS_EVALUACION[1]; // Anexo 10
};

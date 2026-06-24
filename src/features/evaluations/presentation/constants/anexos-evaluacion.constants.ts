import { ProtocolType } from "@domain/enums/protocol-type.enum";

export enum TipoRevision {
  EXPEDITA = 'EXPEDITA',
  PLENO = 'PLENO',
  ENSAYO_CLINICO = 'ENSAYO_CLINICO'
}

export type ResultadoSeccion = 'APROBADO' | 'NO_APROBADO' | 'CON_OBSERVACIONES' | 'APROBADO_CONDICIONADO';

export interface CampoEvaluacion {
  id: string;
  label: string;
  tipo: 'check' | 'text' | 'compliance' | 'result_triple'; // compliance: C, NC, NA, result_triple: Aprobado, No aprobado, Con observaciones
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

export const ANEXOS_EVALUACION: AnexoEvaluacion[] = [
  {
    id: 'anexo9',
    titulo: 'Guía para evaluación expedita de estudios observacionales y de intervención',
    anexo: 'Anexo 9',
    tipoRevision: TipoRevision.EXPEDITA,
    campos: [
      { id: 'resultadoEtica', label: 'RESULTADO DE LA EVALUACION ETICA', tipo: 'result_triple', obligatorio: true, seccion: 'ETICA' },
      { id: 'eticaObservaciones', label: 'Observaciones de la Evaluación Ética', tipo: 'text', obligatorio: false, seccion: 'ETICA' },
      { id: 'plazoEtica', label: 'Plazo para absolver las observaciones (Ética)', tipo: 'text', obligatorio: false, seccion: 'ETICA' },
      
      { id: 'resultadoMetodologia', label: 'RESULTADO DE LA EVALUACION METODOLOGICA', tipo: 'result_triple', obligatorio: true, seccion: 'TECNICA' },
      { id: 'metodologiaObservaciones', label: 'Observaciones de la Evaluación Metodológica', tipo: 'text', obligatorio: false, seccion: 'TECNICA' },
      { id: 'plazoMetodologia', label: 'Plazo para absolver las observaciones (Metodología)', tipo: 'text', obligatorio: false, seccion: 'TECNICA' },
      
      { id: 'resultadoJuridica', label: 'RESULTADO DE LA EVALUACION JURIDICA', tipo: 'result_triple', obligatorio: true, seccion: 'JURIDICA' },
      { id: 'juridicaObservaciones', label: 'Observaciones de la Evaluación Jurídica', tipo: 'text', obligatorio: false, seccion: 'JURIDICA' },
      { id: 'plazoJuridica', label: 'Plazo para absolver las observaciones (Jurídica)', tipo: 'text', obligatorio: false, seccion: 'JURIDICA' }
    ]
  },
  {
    id: 'anexo10',
    titulo: 'Guía para evaluación en pleno de estudios observacionales y de intervención',
    anexo: 'Anexo 10',
    tipoRevision: TipoRevision.PLENO,
    campos: [
      { id: 'resultadoGlobal', label: 'Resultado de la evaluación', tipo: 'result_triple', obligatorio: true, seccion: 'GENERAL' },
      { id: 'condiciones', label: 'Describir los requisitos/aspectos que se requiere completar para que el estudio sea aprobado', tipo: 'text', obligatorio: false, seccion: 'GENERAL' }
    ]
  },
  {
    id: 'anexo11',
    titulo: 'Guía para evaluación de ensayos clínicos',
    anexo: 'Anexo 11',
    tipoRevision: TipoRevision.ENSAYO_CLINICO,
    campos: [
      { id: 'resultadoGlobal', label: 'Resultado de la evaluación', tipo: 'result_triple', obligatorio: true, seccion: 'GENERAL' },
      { id: 'fechaEvaluacion', label: 'Fecha de evaluación', tipo: 'text', obligatorio: true, seccion: 'GENERAL' }
    ]
  }
];

export const getAnexoPorTipo = (tipoProtocolo: ProtocolType, esExpedita: boolean = false): AnexoEvaluacion => {
  if (tipoProtocolo === ProtocolType.EC) return ANEXOS_EVALUACION[2]; // Anexo 11
  if (esExpedita) return ANEXOS_EVALUACION[0]; // Anexo 9
  return ANEXOS_EVALUACION[1]; // Anexo 10
};

export const ANNEX9_ITEMS = {
  etica: [
    { code: 'ET_1',  label: 'Respeta a la persona y comunidad que participa en el estudio.' },
    { code: 'ET_2',  label: 'Autonomía: Consentimiento informado/Idoneidad del formulario escrito y del proceso de obtención. Voluntariedad.' },
    { code: 'ET_3',  label: 'Beneficencia (Valoración del estudio para la persona, comunidad y país).' },
    { code: 'ET_4',  label: 'Confidencialidad.' },
    { code: 'ET_5',  label: 'Aleatorización equitativa de la muestra.' },
    { code: 'ET_6',  label: 'Protección de la población vulnerable.' },
    { code: 'ET_7',  label: 'Riesgos potenciales del estudio.' },
    { code: 'ET_8',  label: 'Beneficios potenciales del estudio.' },
    { code: 'ET_9',  label: 'Competencias éticas y experticia del investigador.' },
    { code: 'ET_10', label: 'Declaración de conflicto de intereses.' },
  ],
  metodologia: [
    { code: 'MET_1',  label: 'Coherencia entre título, objetivos, hipótesis (de ser pertinente), introducción y justificación. Marco teórico y problema de investigación.' },
    { code: 'MET_2',  label: 'Metodología - Diseñó del estudio.' },
    { code: 'MET_3',  label: 'Metodología - Sujetos y tamaño de la muestra.' },
    { code: 'MET_4',  label: 'Metodología - Definición de variables.' },
    { code: 'MET_5',  label: 'Metodología - Medición de variables y procedimientos.' },
    { code: 'MET_6',  label: 'Metodología - Estandarización.' },
    { code: 'MET_7',  label: 'Metodología - Manejo de datos.' },
    { code: 'MET_8',  label: 'Metodología - Análisis estadístico.' },
    { code: 'MET_9',  label: 'Metodología - Resultados y beneficios esperados.' },
    { code: 'MET_10', label: 'Metodología - Referencias Bibliográficas.' },
    { code: 'MET_11', label: 'Metodología - Coherencia entre cronograma, financiamiento y personal.' },
    { code: 'MET_12', label: 'Metodología - Anexos.' },
  ],
  juridica: [
    { code: 'JUR_1', label: 'La investigación está acorde a la legislación y normativa vigente nacional e internacional.' },
    { code: 'JUR_2', label: 'Es un estudio multicéntrico y cuenta con la aprobación del Comité de Ética del país donde radica el patrocinador del estudio.' },
    { code: 'JUR_3', label: 'Existe contrato entre el promotor del estudio y los investigadores.' },
    { code: 'JUR_4', label: 'Existen acuerdos relevantes entre el promotor de la investigación y el sitio clínico en donde ésta se realice.' },
    { code: 'JUR_5', label: 'Existe póliza de seguro que cubra las responsabilidades de todos los implicados y prevea compensaciones.' },
  ],
};

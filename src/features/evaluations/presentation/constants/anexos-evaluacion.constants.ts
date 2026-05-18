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
      { id: 'plazoEtica', label: 'Plazo para absolver las observaciones (Ética)', tipo: 'text', obligatorio: false, seccion: 'ETICA' },
      
      { id: 'resultadoMetodologia', label: 'RESULTADO DE LA EVALUACION METODOLOGICA', tipo: 'result_triple', obligatorio: true, seccion: 'TECNICA' },
      { id: 'plazoMetodologia', label: 'Plazo para absolver las observaciones (Metodología)', tipo: 'text', obligatorio: false, seccion: 'TECNICA' },
      
      { id: 'resultadoJuridica', label: 'RESULTADO DE LA EVALUACION JURIDICA', tipo: 'result_triple', obligatorio: true, seccion: 'JURIDICA' },
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

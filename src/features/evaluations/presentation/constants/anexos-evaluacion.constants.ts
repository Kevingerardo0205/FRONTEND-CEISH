import { ProtocolType } from "@domain/enums/protocol-type.enum";

export enum TipoRevision {
  EXPEDITA = 'EXPEDITA',
  PLENO = 'PLENO',
  ENSAYO_CLINICO = 'ENSAYO_CLINICO'
}

export interface CampoEvaluacion {
  id: string;
  label: string;
  tipo: 'check' | 'text' | 'section';
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

export const CAMPOS_COMUNES: CampoEvaluacion[] = [
  { id: 'resumen', label: 'Resumen del proyecto y justificación', tipo: 'text', obligatorio: true, seccion: 'GENERAL' },
  { id: 'diseno_metodologico', label: '¿El diseño metodológico es coherente con los objetivos?', tipo: 'check', obligatorio: true, seccion: 'TECNICA', descripcion: 'Evaluación de la rigurosidad científica' },
  { id: 'procedimientos', label: '¿Los procedimientos están claramente descritos?', tipo: 'check', obligatorio: true, seccion: 'TECNICA' },
  { id: 'riesgos', label: 'Identificación y minimización de riesgos', tipo: 'check', obligatorio: true, seccion: 'ETICA', descripcion: 'Asegurar que los riesgos son menores al beneficio' },
  { id: 'confidencialidad', label: 'Garantía de confidencialidad de datos', tipo: 'check', obligatorio: true, seccion: 'ETICA' },
  { id: 'consentimiento', label: 'Proceso de Consentimiento Informado', tipo: 'check', obligatorio: true, seccion: 'ETICA', descripcion: 'Verificar Anexo 3' },
  { id: 'normativa', label: 'Cumplimiento de normativa nacional (MSP)', tipo: 'check', obligatorio: true, seccion: 'JURIDICA' },
];

export const ANEXOS_EVALUACION: AnexoEvaluacion[] = [
  {
    id: 'anexo9',
    titulo: 'Informe de Evaluación Ética - Revisión Expedita',
    anexo: 'Anexo 9',
    tipoRevision: TipoRevision.EXPEDITA,
    campos: [
      ...CAMPOS_COMUNES,
      { id: 'justificacion_expedita', label: 'Justificación para el tipo de revisión', tipo: 'text', obligatorio: true, seccion: 'GENERAL' }
    ]
  },
  {
    id: 'anexo10',
    titulo: 'Informe de Evaluación Ética - Revisión en Pleno',
    anexo: 'Anexo 10',
    tipoRevision: TipoRevision.PLENO,
    campos: [
      ...CAMPOS_COMUNES,
      { id: 'analisis_social', label: 'Valor social y científico de la investigación', tipo: 'text', obligatorio: true, seccion: 'GENERAL' },
      { id: 'seleccion_equitativa', label: 'Selección equitativa de la muestra', tipo: 'check', obligatorio: true, seccion: 'ETICA' }
    ]
  },
  {
    id: 'anexo11',
    titulo: 'Informe de Evaluación Ética - Ensayos Clínicos',
    anexo: 'Anexo 11',
    tipoRevision: TipoRevision.ENSAYO_CLINICO,
    campos: [
      ...CAMPOS_COMUNES,
      { id: 'fase_ensayo', label: 'Fase del ensayo y seguridad farmacológica', tipo: 'text', obligatorio: true, seccion: 'TECNICA' },
      { id: 'seguro', label: 'Póliza de seguro para participantes', tipo: 'check', obligatorio: true, seccion: 'JURIDICA' }
    ]
  }
];

export const getAnexoPorTipo = (tipoProtocolo: ProtocolType, esExpedita: boolean = false): AnexoEvaluacion => {
  if (tipoProtocolo === ProtocolType.EC) return ANEXOS_EVALUACION[2]; // Anexo 11
  if (esExpedita) return ANEXOS_EVALUACION[0]; // Anexo 9
  return ANEXOS_EVALUACION[1]; // Anexo 10
};

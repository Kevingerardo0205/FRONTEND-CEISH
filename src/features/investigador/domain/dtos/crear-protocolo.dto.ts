import { TipoEstudio } from '../../constants/anexos-pet.constants';

export enum EstadoProtocolo {
  BORRADOR = 'BORRADOR',
  EN_REVISION_DOCUMENTAL = 'EN_REVISION_DOCUMENTAL',
  REQUIERE_CORRECCION = 'REQUIERE_CORRECCION',
  LISTO_PARA_EVALUACION = 'LISTO_PARA_EVALUACION',
  EN_EVALUACION = 'EN_EVALUACION',
  APROBADO_DEFINITIVO = 'APROBADO_DEFINITIVO',
  APROBADO_CONDICIONADO = 'APROBADO_CONDICIONADO',
  NO_APROBADO = 'NO_APROBADO',
  ARCHIVADO = 'ARCHIVADO',
  VENCIDO = 'VENCIDO'
}

export interface InvestigadorEquipo {
  funcion: string;
  nombreCompleto: string;
  cedula: string;
  formacion: string;
  entidad: string;
  correo: string;
  celular: string;
}

export interface CrearProtocoloDto {
  // 1. Datos Generales
  titulo: string;
  tipoEstudio: TipoEstudio;
  coberturaGeografica: string;
  montoTotal: number;
  fuenteFinanciamiento: string;
  duracionMeses: number;

  // 2. Datos del Patrocinador
  nombrePatrocinador: string;
  identificacionPatrocinador: string; // Cédula / RUC
  correoPatrocinador: string;
  telefonoPatrocinador?: string;
  direccionPatrocinador?: string;

  // 3. Equipo Investigador
  equipoInvestigador: InvestigadorEquipo[];

  // 4. Detalle de la Investigación
  resumenEstructurado: string;
  problemaInvestigacion: string;
  justificacion: string;
  marcoTeorico: string;
  objetivoGeneral: string;
  objetivosEspecificos: string;
  hipotesis?: string;

  // 5. Metodología
  disenoEstudio: string;
  descripcionPoblacion: string; // Incluye tamaño muestral y fórmula
  criteriosInclusionExclusion: string;
  operacionalizacionVariables: string;
  procedimientosDetallados: string;
  paqueteEstadistico: string;

  // 6. Consideraciones Éticas
  procesoAnonimizacion: string;
  balanceRiesgoBeneficio: string;

  // 7. Resultados y Referencias
  resultadosEsperados: string;
  referenciasBibliograficas: string;

  // Metadatos de control (heredados o necesarios)
  lugarEjecucion: string;
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
  poblacionVulnerable: boolean;
  utilizaMuestrasBiologicas: boolean;
  multicentrico: boolean;
}

export interface ProtocoloCreadoResponse {
  id: number;
  codigoCeish: string;
  estado: EstadoProtocolo;
  fechaRecepcion: string;
  mensaje?: string;
}

export interface ProtocoloResumen {
  id: number;
  codigoCeish: string;
  titulo: string;
  estado: EstadoProtocolo;
  fechaCreacion: string;
  tipoEstudio?: string;
}

export interface ProtocoloDetalle extends CrearProtocoloDto {
  id: number;
  codigoCeish: string;
  estado: EstadoProtocolo;
  fechaCreacion: string;
}

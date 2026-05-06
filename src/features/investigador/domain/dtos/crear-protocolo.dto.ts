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
  duracionMeses: number;

  // 2. Equipo Investigador
  equipoInvestigador: InvestigadorEquipo[];

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
  investigadorPrincipal: string;
}

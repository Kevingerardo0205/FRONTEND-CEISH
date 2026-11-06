import { Stage, StageCode } from '@domain/value-objects/stage.vo';

/** Tamaño de página fijo de Protocolos (spec-ui §3.2, punto 6). */
export const LIMITE_PROTOCOLOS = 20;

/** Investigador principal de un protocolo (`GET /protocols`, TSK-001.4). */
export interface InvestigadorPrincipal {
  id: string | number;
  fullName: string;
}

/**
 * Fila de la tabla de Protocolos (spec-ui §3.2, contrato C). Solo lleva lo que muestra la tabla:
 * los demás campos de `GET /protocols` se ignoran.
 */
export interface ProtocolListItem {
  id: string | number;
  /** `codigo_ceish` es nullable en el backend. */
  ceishCode: string | null;
  title: string;
  /** `null` si el backend manda una etapa desconocida: la fila se sigue mostrando. */
  etapa: Stage | null;
  principalInvestigator: InvestigadorPrincipal | null;
}

/** Consulta ya validada (`queryDesdeUrl`). Un campo ausente no se envía. */
export interface ProtocolListQuery {
  search?: string;
  year?: number;
  etapa?: StageCode;
  page: number;
  limit: number;
}

export interface ProtocolListResult {
  items: ProtocolListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

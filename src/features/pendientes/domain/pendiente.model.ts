import { Stage } from '@domain/value-objects/stage.vo';

/** Filtro de `GET /secretaria/pendientes?filtro=` (spec-003 RF-ALR.f.5). */
export type FiltroPendientes = 'todos' | 'vencidos' | 'hoy' | 'semana';
export const FILTROS_PENDIENTES: readonly FiltroPendientes[] = ['todos', 'vencidos', 'hoy', 'semana'];

/** Urgencia del plazo, en el orden que usa el backend (RF-ALR.f.3). */
export type EstadoPlazo = 'VENCIDO' | 'HOY' | 'SEMANA' | 'PROXIMO' | 'SIN_PLAZO';
export const ESTADOS_PLAZO: readonly EstadoPlazo[] = [
  'VENCIDO',
  'HOY',
  'SEMANA',
  'PROXIMO',
  'SIN_PLAZO',
];

export type AccionPendiente = 'VALIDAR' | 'ASIGNAR' | 'REASIGNAR';
export const ACCIONES_PENDIENTE: readonly AccionPendiente[] = ['VALIDAR', 'ASIGNAR', 'REASIGNAR'];

export interface PendienteItem {
  protocolId: string | number;
  ceishCode: string | null;
  title: string;
  /** Texto legible que arma el backend (RF-ALR.f.1). */
  estadoActual: string;
  /** `null` si el backend manda una etapa desconocida: la fila se sigue mostrando. */
  etapa: Stage | null;
  /** Instante ISO o `null`. */
  fechaPlazo: string | null;
  estadoPlazo: EstadoPlazo;
  /** `null` si la acción es desconocida: la fila se muestra sin botón. */
  accion: AccionPendiente | null;
  accionTexto: string;
}

export interface TotalesPendientes {
  todos: number;
  vencidos: number;
  hoy: number;
  semana: number;
}

export interface PendientesResumen {
  /** `YYYY-MM-DD` (fecha de Ecuador en el backend). */
  fechaReferencia: string;
  /** No depende del filtro (RF-ALR.f.3). */
  totales: TotalesPendientes;
  items: PendienteItem[];
}

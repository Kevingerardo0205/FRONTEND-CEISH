import { Stage } from '@domain/value-objects/stage.vo';
import {
  ContractError,
  Raw,
  asArray,
  asObject,
  idValue,
  nullableStr,
  num,
  oneOf,
  str,
} from '@infrastructure/mappers/contract-readers';
import {
  ACCIONES_PENDIENTE,
  AccionPendiente,
  ESTADOS_PLAZO,
  PendienteItem,
  PendientesResumen,
  TotalesPendientes,
} from '../domain/pendiente.model';

const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Mapper estricto de `data` de `GET /secretaria/pendientes` (spec-003 RF-ALR.f.5, spec-ui §4 A).
 * - Un campo con otro tipo, un `estadoPlazo` fuera de los 5 o una `fechaReferencia` que no es
 *   `YYYY-MM-DD` lanzan `ContractError` con la ruta del campo.
 * - Una `etapa` o una `accion` desconocidas quedan en `null` sin lanzar (spec-ui §5.3).
 * - `etapaOrden` no se lee: el orden sale de `Stage`.
 */
export class PendientesMapper {
  static toResumen(data: unknown, path = 'data'): PendientesResumen {
    const raw = asObject(data, path);
    return {
      fechaReferencia: fechaReferencia(raw, path),
      totales: PendientesMapper.toTotales(asObject(raw['totales'], `${path}.totales`), `${path}.totales`),
      items: asArray(raw['items'], `${path}.items`).map((item, i) =>
        PendientesMapper.toItem(item, `${path}.items[${i}]`),
      ),
    };
  }

  static toTotales(raw: Raw, path: string): TotalesPendientes {
    return {
      todos: num(raw, 'todos', path),
      vencidos: num(raw, 'vencidos', path),
      hoy: num(raw, 'hoy', path),
      semana: num(raw, 'semana', path),
    };
  }

  static toItem(value: unknown, path: string): PendienteItem {
    const raw = asObject(value, path);
    return {
      protocolId: idValue(raw, 'protocolId', path),
      ceishCode: nullableStr(raw, 'ceishCode', path),
      title: str(raw, 'title', path),
      estadoActual: str(raw, 'estadoActual', path),
      etapa: etapa(raw, path),
      fechaPlazo: nullableStr(raw, 'fechaPlazo', path),
      estadoPlazo: oneOf(raw, 'estadoPlazo', path, ESTADOS_PLAZO),
      accion: accion(raw, path),
      accionTexto: str(raw, 'accionTexto', path),
    };
  }
}

function fechaReferencia(raw: Raw, path: string): string {
  const v = str(raw, 'fechaReferencia', path);
  if (!FECHA_CALENDARIO.test(v)) throw new ContractError(`${path}.fechaReferencia`, 'YYYY-MM-DD');
  return v;
}

/** Etapa desconocida o null → `null`; la fila se sigue mostrando. */
function etapa(raw: Raw, path: string): Stage | null {
  const v = nullableStr(raw, 'etapa', path);
  return Stage.all().find((s) => s.code === v) ?? null;
}

/** Acción desconocida o null → `null`; la fila se muestra sin botón. */
function accion(raw: Raw, path: string): AccionPendiente | null {
  const v = nullableStr(raw, 'accion', path);
  return (ACCIONES_PENDIENTE as readonly (string | null)[]).includes(v) ? (v as AccionPendiente) : null;
}

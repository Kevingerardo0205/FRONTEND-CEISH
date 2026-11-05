/**
 * Fechas en hora de Ecuador (F01 T01-1, spec-ui §5.4).
 *
 * Los resultados no dependen de la zona del navegador: los instantes ISO se formatean con
 * `timeZone: 'America/Guayaquil'` y las fechas de calendario (`YYYY-MM-DD`) se arman partiendo
 * el texto, sin `new Date(texto)` (que las leería como medianoche UTC y en Ecuador daría el día
 * anterior). Una entrada inválida devuelve `null`; la pantalla decide qué mostrar.
 */

export const ZONA_ECUADOR = 'America/Guayaquil';

const FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `'2026-11-04'` → `'04/11/2026'`. */
export function fechaCalendario(texto: string | null | undefined): string | null {
  if (typeof texto !== 'string') return null;
  const partes = FECHA_CALENDARIO.exec(texto);
  if (!partes) return null;
  const [, anio, mes, dia] = partes;
  const m = Number(mes);
  const d = Number(dia);
  if (m < 1 || m > 12 || d < 1 || d > diasDelMes(Number(anio), m)) return null;
  return `${dia}/${mes}/${anio}`;
}

/** Instante ISO → `'dd/MM/yyyy'` en America/Guayaquil. */
export function fechaEcuador(iso: string | null | undefined): string | null {
  const p = partesEnEcuador(iso, false);
  return p && `${p['day']}/${p['month']}/${p['year']}`;
}

/** Instante ISO → `'dd/MM/yyyy, HH:mm'` (24 horas) en America/Guayaquil. */
export function fechaHoraEcuador(iso: string | null | undefined): string | null {
  const p = partesEnEcuador(iso, true);
  return p && `${p['day']}/${p['month']}/${p['year']}, ${p['hour']}:${p['minute']}`;
}

function diasDelMes(anio: number, mes: number): number {
  // Día 0 del mes siguiente = último día de `mes`; aritmética en UTC, sin leer ningún texto.
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

function partesEnEcuador(
  iso: string | null | undefined,
  conHora: boolean,
): Record<string, string> | null {
  if (typeof iso !== 'string' || iso.trim() === '') return null;
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return null;

  const formato = new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA_ECUADOR,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
  });

  const partes: Record<string, string> = {};
  for (const { type, value } of formato.formatToParts(instante)) partes[type] = value;
  return partes;
}

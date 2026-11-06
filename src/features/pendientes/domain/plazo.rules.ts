import { EstadoPlazo } from './pendiente.model';

/** Tonos que usa el plazo; coinciden con los de `StatusChip` (domain no importa la UI). */
export type TonoPlazo = 'rojo' | 'ambar' | 'azul' | 'gris';

export interface PlazoChip {
  tone: TonoPlazo;
  texto: string;
}

const SIN_PLAZO: PlazoChip = { tone: 'gris', texto: 'Sin plazo' };

/**
 * Chip de la columna Plazo (spec-ui §5.2). Recibe la fecha ya formateada en `dd/MM/yyyy`
 * (hora de Ecuador) o `null`. Sin fecha, el texto es `Sin plazo` en cualquier estado: no se
 * inventa la fecha. El color nunca va solo: siempre lleva texto.
 */
export function plazoChip(estado: EstadoPlazo, fecha: string | null): PlazoChip {
  if (estado === 'SIN_PLAZO' || fecha === null) return SIN_PLAZO;
  switch (estado) {
    case 'VENCIDO':
      return { tone: 'rojo', texto: `Venció ${fecha}` };
    case 'HOY':
      return { tone: 'ambar', texto: 'Vence hoy' };
    case 'SEMANA':
      return { tone: 'azul', texto: `Vence ${fecha}` };
    case 'PROXIMO':
      return { tone: 'gris', texto: `Vence ${fecha}` };
  }
}

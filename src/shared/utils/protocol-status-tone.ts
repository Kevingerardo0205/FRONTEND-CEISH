import { StatusTone } from '@shared/ui/status-chip/status-chip.component';

/**
 * Tono del `StatusChip` de un estado de protocolo (regla T14b de F00, plan §9): recibe la clase de
 * `ProtocolUI.class(estado)`. pending→ámbar, review→azul, approved→verde, rejected→rojo y
 * cualquier otro valor (o ninguno)→gris. No hay otro mapeo estado→tono fuera de `ProtocolUI`.
 */
export function protocolStatusTone(cssClass: string | null | undefined): StatusTone {
  switch (cssClass) {
    case 'pending':
      return 'ambar';
    case 'review':
      return 'azul';
    case 'approved':
      return 'verde';
    case 'rejected':
      return 'rojo';
    default:
      return 'gris';
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  /**
   * Formatea una fecha ISO o string en un formato legible para Ecuador (es-EC).
   */
  formatDate(dateStr?: string | null, includeTime: boolean = false): string {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '---';

      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      };

      return new Intl.DateTimeFormat('es-EC', options).format(date);
    } catch {
      return '---';
    }
  }

  /**
   * Calcula el número de días restantes hasta una fecha objetivo (validUntil).
   * Retorna 0 si ya expiró o si la fecha es inválida.
   */
  getDaysRemaining(validUntilStr?: string | null, referenceDate: Date = new Date()): number {
    if (!validUntilStr) return 0;
    try {
      const target = new Date(validUntilStr);
      if (isNaN(target.getTime())) return 0;

      const diffMs = target.getTime() - referenceDate.getTime();
      if (diffMs <= 0) return 0;

      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Genera un texto descriptivo amigable sobre los días restantes para suplencias.
   */
  getDaysRemainingText(validUntilStr?: string | null, referenceDate: Date = new Date()): string {
    const days = this.getDaysRemaining(validUntilStr, referenceDate);
    if (days === 0) return 'Expirado / Hoy';
    if (days === 1) return 'Vence mañana (1 día)';
    return `${days} días restantes`;
  }
}

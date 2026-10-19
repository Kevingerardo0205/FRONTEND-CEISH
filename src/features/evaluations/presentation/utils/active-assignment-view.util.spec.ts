import { formatDate } from '@angular/common';
import {
  PENDING_DEADLINE_LABEL,
  activeAssignmentStatusLabel,
  canReassign,
  formatDeadlineDate,
  parseCalendarDate,
  peerEvaluatorProfileLabel
} from './active-assignment-view.util';

describe('active-assignment-view.util', () => {
  describe('formatDeadlineDate', () => {
    it('null → "Pendiente de convocatoria"', () => {
      expect(formatDeadlineDate(null)).toBe(PENDING_DEADLINE_LABEL);
      expect(PENDING_DEADLINE_LABEL).toBe('Pendiente de convocatoria');
    });

    it('"2026-06-23" se muestra 23/06/2026 (fecha de calendario local)', () => {
      expect(formatDeadlineDate('2026-06-23')).toBe('23/06/2026');
    });

    it('control en America/Bogota (UTC-5): new Date("2026-06-23") mostraría el día 22', () => {
      // Lo que hacía la plantilla antes (pipe date sobre el string): medianoche UTC → 22 en Bogotá.
      expect(formatDate(new Date('2026-06-23'), 'dd/MM/yyyy', 'en-US', '-0500')).toBe('22/06/2026');
      // El parseo local conserva el día aunque se formatee en la zona de Bogotá.
      const local = parseCalendarDate('2026-06-23') as Date;
      expect(local.getDate()).toBe(23);
      expect(local.getHours()).toBe(0);
    });

    it('rechaza fechas imposibles o con hora y las muestra tal cual', () => {
      expect(parseCalendarDate('2026-02-30')).toBeNull();
      expect(formatDeadlineDate('2026-06-23T00:00:00Z')).toBe('2026-06-23T00:00:00Z');
    });
  });

  it('etiquetas de estado en español', () => {
    expect(activeAssignmentStatusLabel('SUGGESTED')).toBe('Sugerido');
    expect(activeAssignmentStatusLabel('ASSIGNED')).toBe('Asignado');
    expect(activeAssignmentStatusLabel('COMPLETED')).toBe('Completado');
  });

  it('etiquetas de perfil legibles; null → "Sin perfil"; código desconocido se muestra tal cual', () => {
    expect(peerEvaluatorProfileLabel('JURIDICO')).toBe('Jurídico');
    expect(peerEvaluatorProfileLabel('SOCIEDAD_CIVIL')).toBe('Sociedad Civil');
    expect(peerEvaluatorProfileLabel('METODOLOGICO')).toBe('Metodológico');
    expect(peerEvaluatorProfileLabel('SALUD')).toBe('Salud');
    expect(peerEvaluatorProfileLabel(null)).toBe('Sin perfil');
    expect(peerEvaluatorProfileLabel('OTRO')).toBe('OTRO');
  });

  it('canReassign solo para SUGGESTED y ASSIGNED (TSK-002-N15, decisión pendiente)', () => {
    expect(canReassign({ status: 'SUGGESTED' })).toBeTrue();
    expect(canReassign({ status: 'ASSIGNED' })).toBeTrue();
    expect(canReassign({ status: 'COMPLETED' })).toBeFalse();
  });
});

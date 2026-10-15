import { TestBed } from '@angular/core/testing';
import { DateService } from './date.service';

describe('DateService', () => {
  let service: DateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatDate', () => {
    it('should format date string correctly in es-EC locale', () => {
      const formatted = service.formatDate('2026-09-15T12:00:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/2026/);
    });

    it('should return "---" for null or invalid date', () => {
      expect(service.formatDate(null)).toBe('---');
      expect(service.formatDate('invalid-date')).toBe('---');
    });
  });

  describe('getDaysRemaining', () => {
    it('should calculate remaining days correctly', () => {
      const refDate = new Date('2026-09-07T10:00:00Z');
      const targetDate = '2026-09-10T10:00:00Z';
      expect(service.getDaysRemaining(targetDate, refDate)).toBe(3);
    });

    it('should return 0 for past dates', () => {
      const refDate = new Date('2026-09-07T10:00:00Z');
      const targetDate = '2026-09-05T10:00:00Z';
      expect(service.getDaysRemaining(targetDate, refDate)).toBe(0);
    });
  });

  describe('getDaysRemainingText', () => {
    it('should return "Vence mañana (1 día)" when days === 1', () => {
      const refDate = new Date('2026-09-07T10:00:00Z');
      const targetDate = '2026-09-08T10:00:00Z';
      expect(service.getDaysRemainingText(targetDate, refDate)).toBe('Vence mañana (1 día)');
    });

    it('should return "Expirado / Hoy" when days === 0', () => {
      const refDate = new Date('2026-09-07T10:00:00Z');
      expect(service.getDaysRemainingText('2026-09-07T08:00:00Z', refDate)).toBe('Expirado / Hoy');
    });
  });
});

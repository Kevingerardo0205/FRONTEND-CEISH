import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuditRepositoryAdapter } from './audit-repository.adapter';
import { AuditLog, ProtocolTrailEvent } from '../../domain/entities/audit.entity';

/**
 * F11 V11 y V13 (EP4): el adaptador devuelve lo que manda el backend. Vacío → `[]`; error → error.
 * Nunca eventos ni registros de respaldo, ni una huella armada en el frontend.
 */
describe('AuditRepositoryAdapter (F11 EP4)', () => {
  let adapter: AuditRepositoryAdapter;
  let httpMock: HttpTestingController;

  const ROW = {
    id: 77,
    createdAt: '2026-11-20T10:00:00.000Z',
    userId: 3,
    userName: 'ZZ_TEST_ Usuario Secretaría',
    userRole: 'SECRETARIA',
    action: 'RECEPTION_FINALIZED',
    recordId: 5,
    ipAddress: '10.0.0.1',
    newData: { estado: 'VALIDADO' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(AuditRepositoryAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getProtocolTrail', () => {
    it('hace GET /api/audit/protocol/5 y mapea los eventos reales, sin huella (V13)', () => {
      let result: ProtocolTrailEvent[] | undefined;
      adapter.getProtocolTrail('5').subscribe((r) => (result = r));

      const req = httpMock.expectOne('/api/audit/protocol/5');
      expect(req.request.method).toBe('GET');
      req.flush([ROW]);

      expect(result).toEqual([
        {
          id: '77',
          date: new Date('2026-11-20T10:00:00.000Z'),
          responsible: 'ZZ_TEST_ Usuario Secretaría (SECRETARIA)',
          action: 'Recepción Finalizada',
          status: 'COMPLETED',
          comments: JSON.stringify({ estado: 'VALIDADO' }),
        },
      ]);
      expect(Object.keys(result![0])).not.toContain('integrityHash');
    });

    it('lista vacía del backend → lista vacía, sin eventos de respaldo (F11-10)', () => {
      let result: ProtocolTrailEvent[] | undefined;
      adapter.getProtocolTrail('5').subscribe((r) => (result = r));

      httpMock.expectOne('/api/audit/protocol/5').flush([]);

      expect(result).toEqual([]);
    });

    it('{ data: [] } → lista vacía (F11-10)', () => {
      let result: ProtocolTrailEvent[] | undefined;
      adapter.getProtocolTrail('5').subscribe((r) => (result = r));

      httpMock.expectOne('/api/audit/protocol/5').flush({ data: [] });

      expect(result).toEqual([]);
    });

    it('error del backend → el error se propaga, sin eventos de respaldo (F11-11)', () => {
      let next: ProtocolTrailEvent[] | undefined;
      let failed = false;
      adapter.getProtocolTrail('5').subscribe({
        next: (r) => (next = r),
        error: () => (failed = true),
      });

      httpMock
        .expectOne('/api/audit/protocol/5')
        .flush('fallo', { status: 500, statusText: 'Server Error' });

      expect(failed).toBeTrue();
      expect(next).toBeUndefined();
    });
  });

  describe('getLogs', () => {
    it('hace GET /api/audit y mapea los registros reales', () => {
      let result: AuditLog[] | undefined;
      adapter.getLogs({}).subscribe((r) => (result = r));

      const req = httpMock.expectOne((r) => r.url === '/api/audit');
      expect(req.request.method).toBe('GET');
      req.flush([ROW]);

      expect(result?.length).toBe(1);
      expect(result?.[0].id).toBe('77');
      expect(result?.[0].userName).toBe('ZZ_TEST_ Usuario Secretaría');
      expect(result?.[0].recordId).toBe('5');
    });

    it('lista vacía del backend → lista vacía, sin registros de respaldo (F11-10)', () => {
      let result: AuditLog[] | undefined;
      adapter.getLogs({}).subscribe((r) => (result = r));

      httpMock.expectOne((r) => r.url === '/api/audit').flush([]);

      expect(result).toEqual([]);
    });

    it('error del backend → el error se propaga, sin registros de respaldo (F11-11)', () => {
      let next: AuditLog[] | undefined;
      let failed = false;
      adapter.getLogs({}).subscribe({ next: (r) => (next = r), error: () => (failed = true) });

      httpMock
        .expectOne((r) => r.url === '/api/audit')
        .flush('fallo', { status: 500, statusText: 'Server Error' });

      expect(failed).toBeTrue();
      expect(next).toBeUndefined();
    });
  });
});

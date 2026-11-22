import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { AuditLogsPage } from './audit-logs.page';
import { AuditUseCase } from '../../../application/use-cases/audit.use-case';
import { AuditLog } from '../../../domain/entities/audit.entity';

describe('AuditLogsPage', () => {
  let component: AuditLogsPage;
  let fixture: ComponentFixture<AuditLogsPage>;
  let mockAuditUseCase: jasmine.SpyObj<AuditUseCase>;

  const mockLogs: AuditLog[] = [
    {
      id: 'aud-1',
      timestamp: new Date(),
      userId: '1',
      userName: 'Admin User',
      userRole: 'ADMIN_TI',
      action: 'UPDATE',
      entity: 'User',
      recordId: 'USR-001',
      ipAddress: '192.168.1.1',
      changes: {
        before: { active: true },
        after: { active: false },
      },
    },
  ];

  beforeEach(async () => {
    mockAuditUseCase = jasmine.createSpyObj<AuditUseCase>('AuditUseCase', ['getLogs']);
    mockAuditUseCase.getLogs.and.returnValue(of(mockLogs));

    await TestBed.configureTestingModule({
      imports: [AuditLogsPage, NoopAnimationsModule],
      providers: [{ provide: AuditUseCase, useValue: mockAuditUseCase }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial logs', () => {
    expect(component).toBeTruthy();
    expect(component.logs.length).toBe(1);
    expect(mockAuditUseCase.getLogs).toHaveBeenCalled();
  });

  it('should toggle changes overlay when log is selected', () => {
    component.toggleChanges(mockLogs[0]);
    expect(component.selectedLog).toEqual(mockLogs[0]);
  });
});

/** F11 V11 (EP4): registro general con datos reales o su estado. */
describe('AuditLogsPage - estados (F11 EP4)', () => {
  const LOADING = 'Cargando el registro de auditoría…';
  const EMPTY = 'Aún no hay registros de auditoría.';
  const ERROR = 'No pudimos cargar el registro de auditoría.';
  const LOG: AuditLog = {
    id: '77',
    timestamp: new Date('2026-11-20T10:00:00Z'),
    userId: '3',
    userName: 'ZZ_TEST_ Usuario Secretaría',
    userRole: 'SECRETARIA',
    action: 'UPDATE',
    entity: 'Protocol',
    recordId: '5',
    ipAddress: '10.0.0.1',
  };
  let getLogs: jasmine.Spy;

  async function render(): Promise<{ el: HTMLElement; tick: () => void }> {
    await TestBed.configureTestingModule({
      imports: [AuditLogsPage, NoopAnimationsModule],
      providers: [{ provide: AuditUseCase, useValue: { getLogs } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuditLogsPage);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, tick: () => fixture.detectChanges() };
  }

  function card(el: HTMLElement): string {
    return el.querySelector('.table-card')?.textContent ?? '';
  }

  beforeEach(() => {
    getLogs = jasmine.createSpy('getLogs').and.returnValue(of([LOG]));
  });

  it('muestra los registros reales', async () => {
    const { el } = await render();

    expect(card(el)).toContain('ZZ_TEST_ Usuario Secretaría');
    expect(card(el)).not.toContain(EMPTY);
  });

  it('vacío: «Aún no hay registros de auditoría.»', async () => {
    getLogs.and.returnValue(of([]));
    const { el } = await render();

    expect(card(el)).toContain(EMPTY);
    expect(card(el)).not.toContain(ERROR);
  });

  it('mientras carga: «Cargando el registro de auditoría…» y no el vacío (F11-12)', async () => {
    const pending = new Subject<AuditLog[]>();
    getLogs.and.returnValue(pending.asObservable());
    const { el, tick } = await render();

    expect(card(el)).toContain(LOADING);
    expect(card(el)).not.toContain(EMPTY);

    pending.next([LOG]);
    tick();
    expect(card(el)).not.toContain(LOADING);
    expect(card(el)).toContain('ZZ_TEST_ Usuario Secretaría');
  });

  it('error: mensaje con Reintentar, nunca el vacío; Reintentar vuelve a pedirlo (F11-11)', async () => {
    getLogs.and.returnValue(throwError(() => new Error('500')));
    const { el, tick } = await render();

    expect(card(el)).toContain(ERROR);
    expect(card(el)).not.toContain(EMPTY);

    getLogs.and.returnValue(of([LOG]));
    const retry = Array.from(el.querySelectorAll('.table-card button')).find(
      (b) => b.textContent?.trim() === 'Reintentar',
    ) as HTMLButtonElement | undefined;
    expect(retry).toBeDefined();
    retry?.click();
    tick();

    expect(getLogs).toHaveBeenCalledTimes(2);
    expect(card(el)).toContain('ZZ_TEST_ Usuario Secretaría');
    expect(card(el)).not.toContain(ERROR);
  });
});

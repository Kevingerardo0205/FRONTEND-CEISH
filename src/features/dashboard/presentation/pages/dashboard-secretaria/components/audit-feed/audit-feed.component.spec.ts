import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuditFeedComponent } from './audit-feed.component';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';
import { AuditLog } from '@features/audit/domain/entities/audit.entity';

/** F11 V11 (EP4): «Actividad Reciente» con datos reales o su estado; un error no es vacío. */
describe('AuditFeedComponent - estados (F11 EP4)', () => {
  const LOADING = 'Cargando la actividad reciente…';
  const EMPTY = 'Aún no hay actividad registrada.';
  const ERROR = 'No pudimos cargar la actividad reciente.';
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
      imports: [AuditFeedComponent],
      providers: [{ provide: AuditUseCase, useValue: { getLogs } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuditFeedComponent);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, tick: () => fixture.detectChanges() };
  }

  beforeEach(() => {
    getLogs = jasmine.createSpy('getLogs').and.returnValue(of([LOG]));
  });

  it('muestra la actividad real', async () => {
    const { el } = await render();

    expect(el.textContent).toContain('ZZ_TEST_ Usuario Secretaría');
    expect(el.textContent).not.toContain(EMPTY);
  });

  it('vacío: «Aún no hay actividad registrada.», nunca «Cargando flujo de eventos...»', async () => {
    getLogs.and.returnValue(of([]));
    const { el } = await render();

    expect(el.textContent).toContain(EMPTY);
    expect(el.textContent).not.toContain('Cargando flujo de eventos');
  });

  it('mientras carga: «Cargando la actividad reciente…» y no el vacío (F11-12)', async () => {
    const pending = new Subject<AuditLog[]>();
    getLogs.and.returnValue(pending.asObservable());
    const { el, tick } = await render();

    expect(el.textContent).toContain(LOADING);
    expect(el.textContent).not.toContain(EMPTY);

    pending.next([]);
    tick();
    expect(el.textContent).toContain(EMPTY);
  });

  it('error: mensaje con Reintentar, nunca el vacío; Reintentar vuelve a pedirla (F11-11)', async () => {
    getLogs.and.returnValue(throwError(() => new Error('500')));
    const { el, tick } = await render();

    expect(el.textContent).toContain(ERROR);
    expect(el.textContent).not.toContain(EMPTY);

    getLogs.and.returnValue(of([LOG]));
    const retry = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Reintentar',
    ) as HTMLButtonElement | undefined;
    expect(retry).toBeDefined();
    retry?.click();
    tick();

    expect(getLogs).toHaveBeenCalledTimes(2);
    expect(el.textContent).toContain('ZZ_TEST_ Usuario Secretaría');
  });
});

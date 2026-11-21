import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ProtocolTrailPage } from './protocol-trail.page';
import { AuditUseCase } from '../../../application/use-cases/audit.use-case';
import { ProtocolTrailEvent } from '../../../domain/entities/audit.entity';

describe('ProtocolTrailPage', () => {
  let component: ProtocolTrailPage;
  let fixture: ComponentFixture<ProtocolTrailPage>;
  let mockAuditUseCase: jasmine.SpyObj<AuditUseCase>;

  const mockEvents: ProtocolTrailEvent[] = [
    {
      id: 'tr-1',
      date: new Date(),
      responsible: 'Dr. Investigador',
      action: 'Creación de Protocolo',
      status: 'COMPLETED',
      comments: 'Expediente inicial cargado',
      documents: [{ name: 'Doc.pdf', url: '#' }],
    },
  ];

  beforeEach(async () => {
    mockAuditUseCase = jasmine.createSpyObj<AuditUseCase>('AuditUseCase', ['getProtocolTrail']);
    mockAuditUseCase.getProtocolTrail.and.returnValue(of(mockEvents));

    await TestBed.configureTestingModule({
      imports: [ProtocolTrailPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: 'PRT-2026-001' },
            },
          },
        },
        { provide: AuditUseCase, useValue: mockAuditUseCase },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProtocolTrailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load protocol trail events', () => {
    expect(component).toBeTruthy();
    expect(component.protocolId).toBe('PRT-2026-001');
    expect(component.events().length).toBe(1);
    expect(mockAuditUseCase.getProtocolTrail).toHaveBeenCalledWith('PRT-2026-001');
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon('COMPLETED')).toBe('check_circle');
    expect(component.getStatusIcon('CONDITIONED')).toBe('warning');
    expect(component.getStatusIcon('REJECTED')).toBe('cancel');
    expect(component.getStatusIcon('OTHER')).toBe('radio_button_checked');
  });
});

/** F11 V11 a V13 (EP4): `trail/:id` con datos reales o su estado. */
describe('ProtocolTrailPage - estados (F11 EP4)', () => {
  const LOADING = 'Cargando la bitácora…';
  const EMPTY = 'Aún no hay eventos registrados para este protocolo.';
  const ERROR = 'No pudimos cargar la bitácora del protocolo.';
  const EVENT: ProtocolTrailEvent = {
    id: '91',
    date: new Date('2026-11-20T10:00:00Z'),
    responsible: 'ZZ_TEST_ Usuario Presidencia (PRESIDENTE)',
    action: 'Asignación de Evaluadores',
    status: 'COMPLETED',
  };
  let getProtocolTrail: jasmine.Spy;

  async function render(id: string | undefined): Promise<{ el: HTMLElement; tick: () => void }> {
    await TestBed.configureTestingModule({
      imports: [ProtocolTrailPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { id } : {} } } },
        { provide: AuditUseCase, useValue: { getProtocolTrail } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProtocolTrailPage);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, tick: () => fixture.detectChanges() };
  }

  beforeEach(() => {
    getProtocolTrail = jasmine.createSpy('getProtocolTrail').and.returnValue(of([EVENT]));
  });

  it('muestra los eventos reales, sin «Hash» ni huella (F11-13)', async () => {
    const { el } = await render('5');

    expect(getProtocolTrail).toHaveBeenCalledOnceWith('5');
    expect(el.textContent).toContain('Asignación de Evaluadores');
    expect(el.textContent).not.toContain('Hash');
    expect(el.textContent).not.toContain('SHA-256');
  });

  it('vacío: «Aún no hay eventos registrados para este protocolo.»', async () => {
    getProtocolTrail.and.returnValue(of([]));
    const { el } = await render('5');

    expect(el.textContent).toContain(EMPTY);
    expect(el.textContent).not.toContain(ERROR);
  });

  it('mientras carga: «Cargando la bitácora…» y no el vacío (F11-12)', async () => {
    const pending = new Subject<ProtocolTrailEvent[]>();
    getProtocolTrail.and.returnValue(pending.asObservable());
    const { el, tick } = await render('5');

    expect(el.textContent).toContain(LOADING);
    expect(el.textContent).not.toContain(EMPTY);

    pending.next([]);
    tick();
    expect(el.textContent).toContain(EMPTY);
  });

  it('error: mensaje con Reintentar, nunca el vacío; Reintentar vuelve a pedirla (F11-11)', async () => {
    getProtocolTrail.and.returnValue(throwError(() => new Error('500')));
    const { el, tick } = await render('5');

    expect(el.textContent).toContain(ERROR);
    expect(el.textContent).not.toContain(EMPTY);

    getProtocolTrail.and.returnValue(of([EVENT]));
    const retry = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Reintentar',
    ) as HTMLButtonElement | undefined;
    expect(retry).toBeDefined();
    retry?.click();
    tick();

    expect(getProtocolTrail).toHaveBeenCalledTimes(2);
    expect(el.textContent).toContain('Asignación de Evaluadores');
  });

  it('sin :id no pide nada (sin el código inventado PRT-2026-001)', async () => {
    await render(undefined);

    expect(getProtocolTrail).not.toHaveBeenCalled();
  });
});

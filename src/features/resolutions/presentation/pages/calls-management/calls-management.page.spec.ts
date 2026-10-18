import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import {
  Meeting,
  MeetingApiError,
  MeetingPlaceOption,
  PendingProtocol,
} from '@domain/entities/meeting.entity';
import { CallsManagementPage } from './calls-management.page';

function meeting(id: string, meetingDate: string | null, meetingNumber = `N-${id}`): Meeting {
  return {
    id,
    meetingNumber,
    academicYear: 2026,
    sessionType: 'ORDINARIA',
    meetingDate,
    evalSubmissionDeadline: null,
    status: 'PROGRAMADA',
    place: null,
    agendaPdfUrl: `/api/evaluations/meetings/${id}/pdf`,
    protocolCount: 0,
  };
}

const PLACE: MeetingPlaceOption = {
  id: '9a8b7c6d-0000-4000-8000-000000000001',
  name: 'Sala de Sesiones del Rectorado',
  address: 'Panamericana Sur km 1 1/2',
  isVirtual: false,
  meetingLink: null,
  isActive: true,
};

const PENDING: PendingProtocol[] = [
  {
    protocolId: 'c0ffee00-0000-4000-8000-000000000015',
    versionId: 87,
    versionNumber: 2,
    ceishCode: 'CEISH-2026-021',
    title: 'Estudio B',
    studyType: null,
    investigatorName: 'Luis Andrade',
    receptionDate: null,
    deadline: null,
  },
  {
    protocolId: 15,
    versionId: 42,
    versionNumber: 1,
    ceishCode: 'CEISH-2026-015',
    title: 'Estudio A',
    studyType: null,
    investigatorName: null,
    receptionDate: null,
    deadline: null,
  },
];

describe('CallsManagementPage', () => {
  let fixture: ComponentFixture<CallsManagementPage>;
  let page: CallsManagementPage;
  let repo: jasmine.SpyObj<IMeetingRepositoryPort>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  function setup(
    opts: { meetings?: Meeting[]; total?: number; places?: MeetingPlaceOption[] } = {},
  ) {
    const meetings = opts.meetings ?? [];
    repo = jasmine.createSpyObj<IMeetingRepositoryPort>('IMeetingRepositoryPort', [
      'list',
      'getById',
      'getPendingProtocols',
      'getPlaces',
      'create',
      'calculateEvalDate',
      'downloadPdf',
    ]);
    repo.list.and.returnValue(
      of({ items: meetings, meta: { total: opts.total ?? meetings.length, page: 1, limit: 10 } }),
    );
    repo.getPendingProtocols.and.returnValue(of(PENDING));
    repo.getPlaces.and.returnValue(of(opts.places ?? [PLACE]));
    repo.calculateEvalDate.and.returnValue(of('2026-11-11T23:59:00.000Z'));
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [CallsManagementPage],
      providers: [
        provideNoopAnimations(),
        { provide: IMeetingRepositoryPort, useValue: repo },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
    fixture = TestBed.createComponent(CallsManagementPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  }

  const text = (selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim() ?? null;

  it('carga la primera página con limit 10 y lugares sin parámetros', () => {
    setup();
    expect(repo.list).toHaveBeenCalledOnceWith({ page: 1, limit: 10 });
    expect(repo.getPlaces).toHaveBeenCalledOnceWith();
  });

  it('crea la reunión enviando locationId y protocolVersionIds desde versionId', () => {
    setup();
    repo.create.and.returnValue(
      of({
        id: '22222222-3333-4444-8555-666666666666',
        meetingNumber: 'CEISH-ORD-004-2026',
        sessionType: 'ORDINARIA',
        meetingDate: '2026-11-18T14:00:00.000Z',
        evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
        agendaPdfUrl: '/api/evaluations/meetings/22222222-3333-4444-8555-666666666666/pdf',
      }),
    );

    page.toggleCreateForm(true);
    page.callForm.patchValue({ meetingDate: '2026-11-18T09:00', locationId: PLACE.id });
    page.onToggleProtocol(87);
    page.onToggleProtocol(42);
    page.onSubmitCall();

    expect(repo.create).toHaveBeenCalledTimes(1);
    const dto = repo.create.calls.mostRecent().args[0];
    expect(dto).toEqual({
      sessionType: 'ORDINARIA',
      meetingDate: new Date('2026-11-18T09:00').toISOString(),
      evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
      locationId: '9a8b7c6d-0000-4000-8000-000000000001',
      protocolVersionIds: [87, 42],
    });
    expect(Object.keys(dto)).not.toContain('callNumber');
    expect(Object.keys(dto)).not.toContain('agenda');

    fixture.detectChanges();
    expect(page.lastCreated()?.meetingNumber).toBe('CEISH-ORD-004-2026');
    expect(text('[data-testid="meeting-created"]')).toContain('CEISH-ORD-004-2026');
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('sugiere la fecha límite con calculate-eval-date y respeta la edición manual', () => {
    setup();
    page.toggleCreateForm(true);
    page.callForm.get('meetingDate')!.setValue('2026-11-18T09:00');

    expect(repo.calculateEvalDate).toHaveBeenCalledOnceWith(
      new Date('2026-11-18T09:00').toISOString(),
    );
    const suggestedLocal = page.callForm.get('evalSubmissionDeadline')!.value as string;
    expect(suggestedLocal).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(new Date(suggestedLocal).toISOString()).toBe('2026-11-11T23:59:00.000Z');

    const deadline = page.callForm.get('evalSubmissionDeadline')!;
    deadline.setValue('2026-11-12T10:00');
    deadline.markAsDirty();
    page.callForm.get('meetingDate')!.setValue('2026-11-25T09:00');
    expect(repo.calculateEvalDate).toHaveBeenCalledTimes(1);
    expect(deadline.value).toBe('2026-11-12T10:00');
  });

  it('próxima sesión = fecha futura mínima, ignorando null y pasadas (orden DESC del backend)', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const far = new Date(now + 30 * day).toISOString();
    const near = new Date(now + 3 * day).toISOString();
    const past = new Date(now - 2 * day).toISOString();
    setup({
      meetings: [meeting('a', far), meeting('b', null), meeting('c', near), meeting('d', past)],
    });

    expect(page.nextSession()?.id).toBe('c');
    expect(text('[data-testid="next-session"]')).toBe(
      new Date(near).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }),
    );
  });

  it('muestra "Ninguna próxima" si solo hay fechas nulas o pasadas y "Sin fecha" en la tabla', () => {
    setup({ meetings: [meeting('b', null), meeting('d', '2020-01-01T10:00:00.000Z')] });
    expect(text('[data-testid="next-session"]')).toBe('Ninguna próxima');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin fecha');
  });

  it('muestra el aviso cuando la lista de lugares está vacía (sin lugares hardcodeados)', () => {
    setup({ places: [] });
    page.toggleCreateForm(true);
    fixture.detectChanges();

    expect(text('[data-testid="no-places"] span')).toBe('No hay lugares activos configurados');
    expect((fixture.nativeElement as HTMLElement).querySelector('#locationId')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Salón Dorado');
  });

  it('el selector muestra name y address de cada lugar con value = id', () => {
    setup();
    page.toggleCreateForm(true);
    fixture.detectChanges();
    const options = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLOptionElement>(
        '#locationId option',
      ),
    );
    expect(options.map((o) => o.value)).toEqual(['', PLACE.id]);
    expect(options[1].textContent?.trim()).toBe(
      'Sala de Sesiones del Rectorado — Panamericana Sur km 1 1/2',
    );
  });

  it('muestra el error 400 del backend de forma legible', () => {
    setup();
    repo.create.and.returnValue(
      throwError(
        () =>
          new MeetingApiError(
            'VERSIONES_DUPLICADAS',
            'VERSIONES_DUPLICADAS: la versión 87 está repetida',
            400,
          ),
      ),
    );
    page.toggleCreateForm(true);
    page.callForm.patchValue({ meetingDate: '2026-11-18T09:00' });
    page.onToggleProtocol(87);
    page.onSubmitCall();
    fixture.detectChanges();

    const expected =
      'Hay versiones de protocolo repetidas en la selección. Detalle: VERSIONES_DUPLICADAS: la versión 87 está repetida';
    expect(text('[data-testid="meeting-error"] span')).toBe(expected);
    expect(snackBar.open).toHaveBeenCalledWith(`❌ ${expected}`, 'Cerrar', { duration: 6000 });
    expect(page.isSubmitting()).toBeFalse();
  });

  it('pagina con meta.total/page/limit', () => {
    setup({ meetings: [meeting('a', null)], total: 25 });
    fixture.detectChanges();
    expect(page.totalPages()).toBe(3);
    expect(text('[data-testid="pagination"]')).toContain('Página 1 de 3 · 25 convocatorias');

    page.goToPage(2);
    expect(repo.list).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('abre el detalle con getById(id string)', () => {
    setup({
      meetings: [meeting('6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f', null, 'CEISH-ORD-003-2026')],
    });
    repo.getById.and.returnValue(
      of({
        ...meeting('6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f', null, 'CEISH-ORD-003-2026'),
        protocols: [],
      }),
    );
    page.onViewCall(page.meetings()[0]);
    fixture.detectChanges();

    expect(repo.getById).toHaveBeenCalledOnceWith('6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f');
    expect(text('[data-testid="meeting-detail"]')).toContain('Convocatoria CEISH-ORD-003-2026');
  });
});

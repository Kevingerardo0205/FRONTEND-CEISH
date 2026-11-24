import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import {
  ActiveAssignmentsState,
  ProtocolWorkspaceService,
} from '@features/protocols/application/services/protocol-workspace.service';
import {
  AssignEvaluatorsResponse,
  AssignmentMember,
} from '@domain/entities/peer-evaluation.entity';
import { AssignPeerEvaluatorsUseCase } from '../../../application/assign-peer-evaluators.use-case';
import { LoadAssignmentMembersUseCase } from '../../../application/load-assignment-members.use-case';
import {
  AssignmentProtocolSummary,
  LoadAssignmentProtocolUseCase,
} from '../../../application/load-assignment-protocol.use-case';
import { ALREADY_ASSIGNED_NOTICE, PeerAssignmentFormPage } from './peer-assignment-form.page';

/** Datos de prueba (personas y protocolo que no existen). Nadie tiene el perfil Bioético. */
const MEMBERS: AssignmentMember[] = [
  { id: 1, fullName: 'Andrés Prueba', profiles: ['METODOLOGICO', 'SALUD'] },
  { id: 2, fullName: 'Beatriz Prueba', profiles: ['SOCIEDAD_CIVIL'] },
  { id: 3, fullName: 'Carla Prueba', profiles: ['JURIDICO'] },
  { id: 4, fullName: 'Diego Prueba', profiles: [] },
];

const PROTOCOL: AssignmentProtocolSummary = {
  id: 15,
  code: 'CEISH-PRUEBA-015',
  title: 'Estudio de prueba quince',
  isTimelineTermsAccepted: true,
};

const PROTOCOL_B: AssignmentProtocolSummary = {
  ...PROTOCOL,
  id: 16,
  code: 'CEISH-PRUEBA-016',
  title: 'Estudio de prueba dieciséis',
};

const MEMBERS_B: AssignmentMember[] = [
  { id: 21, fullName: 'Evaluadora B', profiles: ['METODOLOGICO'] },
  { id: 22, fullName: 'Evaluador B sociedad civil', profiles: ['SOCIEDAD_CIVIL'] },
  { id: 23, fullName: 'Evaluador B jurídico', profiles: ['JURIDICO'] },
];

const httpError = (status: number, message?: string) =>
  Object.assign(new Error(message ?? ''), { status, message: message ?? '' });

describe('PeerAssignmentFormPage (F03 D3 a D7)', () => {
  let fixture: ComponentFixture<PeerAssignmentFormPage>;
  let loadProtocol: jasmine.Spy;
  let loadMembers: jasmine.Spy;
  let assign: jasmine.Spy;
  let navigate: jasmine.Spy;
  let gate: WritableSignal<ActiveAssignmentsState>;
  let ensureActive: jasmine.Spy;
  let retryActive: jasmine.Spy;

  function setup(
    options: {
      /** Estado de asignaciones activas del espacio; sin él no hay servicio del espacio. */
      gate?: ActiveAssignmentsState;
      id?: string;
      workspaceId?: string;
      workspaceIds?: Subject<ReturnType<typeof convertToParamMap>>;
      protocol?: Observable<AssignmentProtocolSummary>[];
      members?: Observable<AssignmentMember[]>[];
      assign?: Observable<AssignEvaluatorsResponse>;
    } = {},
  ): HTMLElement {
    loadProtocol = jasmine.createSpy('loadProtocol');
    const protocolReturns = options.protocol ?? [of(PROTOCOL)];
    if (protocolReturns.length === 1) {
      loadProtocol.and.returnValue(protocolReturns[0]);
    } else {
      loadProtocol.and.returnValues(...protocolReturns);
    }

    loadMembers = jasmine.createSpy('loadMembers');
    const membersReturns = options.members ?? [of(MEMBERS)];
    if (membersReturns.length === 1) {
      loadMembers.and.returnValue(membersReturns[0]);
    } else {
      loadMembers.and.returnValues(...membersReturns);
    }

    gate = signal<ActiveAssignmentsState>(options.gate ?? { kind: 'none' });
    ensureActive = jasmine.createSpy('ensureActiveAssignments');
    retryActive = jasmine.createSpy('retryActiveAssignments');
    assign = jasmine
      .createSpy('assign')
      .and.returnValue(options.assign ?? of({ assignments: [] }));
    TestBed.configureTestingModule({
      imports: [PeerAssignmentFormPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(options.workspaceId ? {} : { protocolId: options.id ?? '15' }) },
            parent: options.workspaceId
              ? {
                  paramMap: options.workspaceIds,
                  snapshot: { paramMap: convertToParamMap({ id: options.workspaceId }) },
                }
              : undefined,
          },
        },
        ...(options.gate
          ? [
              {
                provide: ProtocolWorkspaceService,
                useValue: {
                  activeAssignments: gate,
                  ensureActiveAssignments: ensureActive,
                  retryActiveAssignments: retryActive,
                },
              },
            ]
          : []),
        { provide: LoadAssignmentProtocolUseCase, useValue: { execute: loadProtocol } },
        { provide: LoadAssignmentMembersUseCase, useValue: { execute: loadMembers } },
        { provide: AssignPeerEvaluatorsUseCase, useValue: { execute: assign } },
      ],
    });
    fixture = TestBed.createComponent(PeerAssignmentFormPage);
    fixture.detectChanges();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    return root();
  }

  const root = () => fixture.nativeElement as HTMLElement;
  const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const submit = () => root().querySelector('button[type="submit"]') as HTMLButtonElement;
  const reason = () => text(root().querySelector('#motivo-asignacion'));
  const buttonByText = (label: string) =>
    Array.from(root().querySelectorAll('button')).find((b) => text(b) === label);

  function chooseType(type: 'EXPEDITA' | 'PLENO'): void {
    (root().querySelector(`input[value="${type}"]`) as HTMLInputElement).click();
    fixture.detectChanges();
  }

  function choose(selectId: string, value: string): void {
    const select = root().querySelector(`#${selectId}`) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function click(label: string): void {
    const button = buttonByText(label);
    expect(button).withContext(label).toBeDefined();
    button?.click();
    fixture.detectChanges();
  }

  const expeditedLabels = () =>
    Array.from(root().querySelectorAll('[data-testid="filas-expedita"] .formulario__etiqueta'), text);
  const optionTexts = (selectId: string) =>
    Array.from((root().querySelector(`#${selectId}`) as HTMLSelectElement).options, (o) => text(o));

  function removeRow(profile: string): void {
    (root().querySelector(`[data-profile="${profile}"] button`) as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('Revisar documentacion abre Validacion con el protocolId y origen del formulario (F11-22, F11-23)', () => {
    setup();

    click('Revisar documentación');

    expect(navigate).toHaveBeenCalledOnceWith(
      ['/dashboard/protocols/workspace', 15, 'validation'],
      { queryParams: { origin: 'assignment-form' } },
    );
  });

  it('en el workspace reutiliza el id de la ruta padre al cargar el protocolo (EP2b)', () => {
    setup({ workspaceId: '15' });

    expect(loadProtocol).toHaveBeenCalledOnceWith(15);
    expect(text(root().querySelector('app-page-header'))).toContain('CEISH-PRUEBA-015');
  });

  describe('dentro del espacio del protocolo (F11-32, F11-33)', () => {
    const actions = () => root().querySelector('.formulario__acciones');

    it('antes de elegir el tipo solo hay título, código y título del protocolo y «Tipo de revisión»', () => {
      setup({ workspaceId: '15' });

      expect(text(root().querySelector('app-page-header'))).toContain('Asignar evaluadores');
      expect(text(root().querySelector('app-page-header'))).toContain('CEISH-PRUEBA-015');
      expect(text(root().querySelector('app-page-header'))).toContain('Estudio de prueba quince');
      expect(text(root().querySelector('.formulario__tipo'))).toContain('Tipo de revisión');
      expect(text(root().querySelector('.formulario__tipo'))).toContain('Expedita');
      expect(text(root().querySelector('.formulario__tipo'))).toContain('En pleno');
      expect(actions()).toBeNull();
      expect(submit()).toBeNull();
      expect(root().querySelector('#motivo-asignacion')).toBeNull();
      expect(buttonByText('Asignar evaluadores')).toBeUndefined();
    });

    it('el botón y su motivo aparecen después de elegir el tipo, debajo de las filas', () => {
      setup({ workspaceId: '15' });

      chooseType('EXPEDITA');

      expect(submit()).not.toBeNull();
      expect(reason()).not.toBe('');
      const rows = root().querySelector('[data-testid="filas-expedita"]') as Element;
      expect(rows.compareDocumentPosition(submit()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('en pleno también muestra el botón solo después de elegir el tipo', () => {
      setup({ workspaceId: '15' });
      expect(submit()).toBeNull();

      chooseType('PLENO');

      expect(submit()).not.toBeNull();
    });

    it('no ofrece «Revisar documentación» ni «Volver a la lista», con o sin tipo elegido', () => {
      setup({ workspaceId: '15' });
      expect(buttonByText('Revisar documentación')).toBeUndefined();
      expect(text(root())).not.toContain('Volver a la lista');

      chooseType('EXPEDITA');
      expect(buttonByText('Revisar documentación')).toBeUndefined();
      expect(text(root())).not.toContain('Volver a la lista');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('tras asignar tampoco ofrece «Volver a la lista»', () => {
      setup({ workspaceId: '15' });
      fillValidExpedited();

      click('Asignar evaluadores');

      expect(root().querySelector('.formulario__exito')).not.toBeNull();
      expect(text(root())).not.toContain('Volver a la lista');
    });

    it('sin evaluadores activos o sin protocolo tampoco ofrece «Volver a la lista»', () => {
      setup({ workspaceId: '15', members: [of([])] });
      expect(text(root())).toContain('No hay evaluadores activos para asignar.');
      expect(text(root())).not.toContain('Volver a la lista');
    });
  });

  describe('con evaluadores ya asignados o sin poder consultarlo (F11-35, F11-37, F11-38)', () => {
    const noForm = () => {
      expect(root().querySelector('form')).toBeNull();
      expect(root().querySelector('input[name="reviewType"]')).toBeNull();
      expect(submit()).toBeNull();
      expect(buttonByText('Asignar evaluadores')).toBeUndefined();
    };

    it('pide las asignaciones activas del protocolo al abrir', () => {
      setup({ workspaceId: '15', gate: { kind: 'none' } });

      expect(ensureActive).toHaveBeenCalledWith(15);
    });

    it('sin asignaciones activas muestra el formulario', () => {
      setup({ workspaceId: '15', gate: { kind: 'none' } });

      expect(root().querySelector('input[name="reviewType"]')).not.toBeNull();
    });

    it('con una asignación activa muestra el aviso y el enlace al historial, sin formulario ni botón', () => {
      setup({ workspaceId: '15', gate: { kind: 'has', count: 1 } });

      expect(text(root())).toContain(ALREADY_ASSIGNED_NOTICE);
      expect(ALREADY_ASSIGNED_NOTICE).toBe('Este protocolo ya tiene evaluadores asignados.');
      const link = root().querySelector('a.formulario__enlace') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/dashboard/protocols/workspace/15/assignment-history');
      noForm();
    });

    it('si falla la consulta muestra el error con Reintentar, nunca el formulario por defecto', () => {
      setup({ workspaceId: '15', gate: { kind: 'error' } });

      expect(text(root())).toContain('No pudimos consultar las asignaciones del protocolo.');
      noForm();

      click('Reintentar');
      expect(retryActive).toHaveBeenCalledTimes(1);
    });

    it('mientras consulta muestra la carga y no el formulario', () => {
      for (const kind of ['loading', 'idle'] as const) {
        TestBed.resetTestingModule();
        setup({ workspaceId: '15', gate: { kind } });

        expect(text(root())).withContext(kind).toContain('Consultando las asignaciones del protocolo…');
        noForm();
      }
    });

    it('al resolverse la consulta el formulario aparece o se reemplaza por el aviso', () => {
      setup({ workspaceId: '15', gate: { kind: 'loading' } });
      noForm();

      gate.set({ kind: 'none' });
      fixture.detectChanges();
      expect(root().querySelector('input[name="reviewType"]')).not.toBeNull();

      gate.set({ kind: 'has', count: 3 });
      fixture.detectChanges();
      expect(text(root())).toContain(ALREADY_ASSIGNED_NOTICE);
      noForm();
    });

    it('tras asignar muestra el resultado aunque el estado pase a «con evaluadores», y refresca el estado', () => {
      setup({ workspaceId: '15', gate: { kind: 'none' } });
      fillValidExpedited();

      click('Asignar evaluadores');
      expect(ensureActive).toHaveBeenCalledWith(15, true);
      gate.set({ kind: 'has', count: 2 });
      fixture.detectChanges();

      expect(root().querySelector('.formulario__exito')).not.toBeNull();
      expect(text(root())).not.toContain(ALREADY_ASSIGNED_NOTICE);
    });

    it('fuera del espacio no consulta las asignaciones activas', () => {
      setup({ gate: { kind: 'has', count: 1 } });

      expect(ensureActive).not.toHaveBeenCalled();
      expect(root().querySelector('input[name="reviewType"]')).not.toBeNull();
    });
  });

  describe('fuera del espacio conserva sus acciones', () => {
    it('muestra «Revisar documentación» y «Volver a la lista» y el botón antes de elegir el tipo', () => {
      setup();

      expect(buttonByText('Revisar documentación')).toBeDefined();
      expect(text(root())).toContain('Volver a la lista');
      expect(submit()).not.toBeNull();
    });
  });

  it('recarga el protocolo vigente y limpia el anterior cuando cambia el id sin destruirse', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [of(PROTOCOL), of(PROTOCOL_B)],
      members: [of(MEMBERS), of(MEMBERS_B)],
    });

    workspaceIds.next(convertToParamMap({ id: '16' }));
    fixture.detectChanges();

    expect(loadProtocol).toHaveBeenCalledWith(16);
    expect(text(root().querySelector('app-page-header'))).toContain('CEISH-PRUEBA-016');
    expect(text(root().querySelector('app-page-header'))).not.toContain('CEISH-PRUEBA-015');
    expect(fixture.componentInstance.members()).toEqual(MEMBERS_B);
    chooseType('EXPEDITA');
    expect(text(root())).toContain('Evaluadora B');
    expect(text(root())).not.toContain('Andrés Prueba');
  });

  it('ignora una respuesta tardía del protocolo A después de que B respondió', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    const protocolA = new Subject<AssignmentProtocolSummary>();
    const protocolB = new Subject<AssignmentProtocolSummary>();
    const membersA = new Subject<AssignmentMember[]>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [protocolA, protocolB],
      members: [membersA, of(MEMBERS_B)],
    });

    workspaceIds.next(convertToParamMap({ id: '16' }));
    protocolB.next(PROTOCOL_B);
    protocolB.complete();
    protocolA.next(PROTOCOL);
    protocolA.complete();
    membersA.next(MEMBERS);
    membersA.complete();
    fixture.detectChanges();

    expect(text(root().querySelector('app-page-header'))).toContain('CEISH-PRUEBA-016');
    expect(text(root().querySelector('app-page-header'))).not.toContain('CEISH-PRUEBA-015');
    expect(fixture.componentInstance.protocol()?.id).toBe(16);
    expect(fixture.componentInstance.members()).toEqual(MEMBERS_B);
    chooseType('EXPEDITA');
    expect(text(root())).toContain('Evaluadora B');
    expect(text(root())).not.toContain('Andrés Prueba');
  });

  it('un error de A no termina la escucha de ruta y permite cargar B', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    const protocolA = new Subject<AssignmentProtocolSummary>();
    const protocolB = new Subject<AssignmentProtocolSummary>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [protocolA, protocolB],
      members: [of(MEMBERS), of(MEMBERS_B)],
    });

    protocolA.error(httpError(500));
    workspaceIds.next(convertToParamMap({ id: '16' }));
    protocolB.next(PROTOCOL_B);
    protocolB.complete();
    fixture.detectChanges();

    expect(loadProtocol).toHaveBeenCalledWith(16);
    expect(fixture.componentInstance.protocol()?.id).toBe(16);
    expect(fixture.componentInstance.members()).toEqual(MEMBERS_B);
    expect(text(root())).not.toContain('No pudimos cargar los datos de la asignación.');
  });

  it('si loadMembers falla en A, B puede cargar y reemplaza el estado de error', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [of(PROTOCOL), of(PROTOCOL_B)],
      members: [throwError(() => httpError(500)), of(MEMBERS_B)],
    });

    expect(text(root())).toContain('No pudimos cargar los datos de la asignación.');
    workspaceIds.next(convertToParamMap({ id: '16' }));
    fixture.detectChanges();

    expect(loadProtocol).toHaveBeenCalledWith(16);
    expect(loadMembers).toHaveBeenCalledTimes(2);
    expect(text(root())).not.toContain('No pudimos cargar los datos de la asignación.');
    expect(text(root().querySelector('app-page-header'))).toContain('CEISH-PRUEBA-016');
    expect(fixture.componentInstance.members()).toEqual(MEMBERS_B);
    chooseType('EXPEDITA');
    expect(text(root())).toContain('Evaluadora B');
    expect(text(root())).not.toContain('Andrés Prueba');
  });

  it('un error de loadProtocol en B no conserva la información visible de A', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [of(PROTOCOL), throwError(() => httpError(500))],
      members: [of(MEMBERS), of(MEMBERS_B)],
    });

    workspaceIds.next(convertToParamMap({ id: '16' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.protocol()).toBeNull();
    expect(fixture.componentInstance.members()).toEqual([]);
    expect(text(root())).not.toContain('CEISH-PRUEBA-015');
    expect(text(root())).not.toContain('Andrés Prueba');
    expect(text(root())).toContain('No pudimos cargar los datos de la asignación.');
  });

  it('un error de loadMembers en B no conserva la información visible de A', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [of(PROTOCOL), of(PROTOCOL_B)],
      members: [of(MEMBERS), throwError(() => httpError(500))],
    });

    workspaceIds.next(convertToParamMap({ id: '16' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.protocol()).toBeNull();
    expect(fixture.componentInstance.members()).toEqual([]);
    expect(text(root())).not.toContain('CEISH-PRUEBA-015');
    expect(text(root())).not.toContain('Andrés Prueba');
    expect(text(root())).toContain('No pudimos cargar los datos de la asignación.');
  });

  it('destruir el componente cancela la ruta y las consultas pendientes', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    const pendingProtocol = new Subject<AssignmentProtocolSummary>();
    const pendingMembers = new Subject<AssignmentMember[]>();
    setup({
      workspaceId: '15',
      workspaceIds,
      protocol: [pendingProtocol],
      members: [pendingMembers],
    });

    fixture.destroy();
    pendingProtocol.next(PROTOCOL);
    pendingMembers.next(MEMBERS);

    expect(workspaceIds.observers.length).toBe(0);
    expect(pendingProtocol.observers.length).toBe(0);
    expect(pendingMembers.observers.length).toBe(0);
  });

  it('un id inválido limpia A y no ejecuta una consulta para el valor inválido', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    setup({ workspaceId: '15', workspaceIds });
    expect(loadProtocol).toHaveBeenCalledOnceWith(15);

    workspaceIds.next(convertToParamMap({ id: '1.5' }));
    fixture.detectChanges();

    expect(loadProtocol).toHaveBeenCalledOnceWith(15);
    expect(fixture.componentInstance.protocol()).toBeNull();
    expect(text(root())).toContain('No encontramos este protocolo. Revise el enlace.');
  });

  it('una emisión duplicada del mismo id no duplica las consultas', () => {
    const workspaceIds = new Subject<ReturnType<typeof convertToParamMap>>();
    setup({ workspaceId: '15', workspaceIds });
    workspaceIds.next(convertToParamMap({ id: '15' }));
    fixture.detectChanges();

    expect(loadProtocol).toHaveBeenCalledOnceWith(15);
    expect(loadMembers).toHaveBeenCalledOnceWith();
  });

  /** Expedita válida: Metodológico (Andrés) y Sociedad Civil (Beatriz). */
  function fillValidExpedited(): void {
    chooseType('EXPEDITA');
    removeRow('SALUD');
    removeRow('JURIDICO');
    choose('exp-METODOLOGICO', '1');
    choose('exp-SOCIEDAD_CIVIL', '2');
  }

  describe('carga (§4)', () => {
    it('mientras carga muestra «Cargando la asignación…»', () => {
      setup({ members: [new Subject<AssignmentMember[]>()] });
      expect(text(root())).toContain('Cargando la asignación…');
      expect(root().querySelector('form')).toBeNull();
    });

    it('con los datos muestra el código y el título del protocolo en el encabezado', () => {
      setup();
      expect(loadProtocol).toHaveBeenCalledOnceWith(15);
      expect(text(root().querySelector('app-page-header'))).toContain(
        'CEISH-PRUEBA-015 · Estudio de prueba quince',
      );
    });

    it('si falla la carga de los miembros: error con Reintentar, no «no encontrado» (aunque sea 404)', () => {
      setup({ protocol: [of(PROTOCOL), of(PROTOCOL)], members: [throwError(() => httpError(404)), of(MEMBERS)] });
      expect(text(root())).toContain('No pudimos cargar los datos de la asignación.');
      expect(text(root())).not.toContain('No encontramos este protocolo.');

      click('Reintentar');

      expect(loadMembers).toHaveBeenCalledTimes(2);
      expect(root().querySelector('form')).not.toBeNull();
    });

    for (const status of [404, 400]) {
      it(`un ${status} de GET /protocols/:id → «No encontramos este protocolo. Revise el enlace.»`, () => {
        setup({ protocol: [throwError(() => httpError(status, 'Protocol with ID 15 not found'))] });
        expect(text(root())).toContain('No encontramos este protocolo. Revise el enlace.');
        expect(text(root())).not.toContain('Protocol with ID 15 not found');
        expect(root().querySelector('a')?.getAttribute('href')).toBe('/dashboard/evaluations/assignment');
      });
    }

    it('un 500 de GET /protocols/:id es el estado de error', () => {
      setup({ protocol: [throwError(() => httpError(500))] });
      expect(text(root())).toContain('No pudimos cargar los datos de la asignación.');
    });

    it('un id que no es número no pide nada y muestra «no encontrado»', () => {
      setup({ id: 'abc' });
      expect(loadProtocol).not.toHaveBeenCalled();
      expect(text(root())).toContain('No encontramos este protocolo. Revise el enlace.');
    });

    it('sin evaluadores activos muestra «No hay evaluadores activos para asignar.»', () => {
      setup({ members: [of([])] });
      expect(text(root())).toContain('No hay evaluadores activos para asignar.');
      expect(root().querySelector('form')).toBeNull();
    });
  });

  describe('tipo de revisión y motivos (D5)', () => {
    it('al empezar no hay tipo elegido y el botón dice «Elija el tipo de revisión.»', () => {
      setup();
      expect(text(root().querySelector('legend'))).toBe('Tipo de revisión');
      const radios = Array.from(root().querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
      expect(radios.map((r) => r.checked)).toEqual([false, false]);
      expect(submit().disabled).toBeTrue();
      expect(reason()).toBe('Elija el tipo de revisión.');
      expect(submit().getAttribute('aria-describedby')).toBe('motivo-asignacion');
    });

    it('sin los tiempos aceptados el primer motivo es el de los tiempos, aun con una composición válida', () => {
      setup({ protocol: [of({ ...PROTOCOL, isTimelineTermsAccepted: false })] });
      fillValidExpedited();
      expect(reason()).toBe('El investigador aún no acepta los tiempos del comité.');
      expect(submit().disabled).toBeTrue();
    });
  });

  describe('expedita (D3)', () => {
    it('una fila por perfil con miembros, en orden; sin la fila de Bioético, que no tiene miembros', () => {
      setup();
      chooseType('EXPEDITA');
      expect(expeditedLabels()).toEqual(['Metodológico', 'Salud', 'Jurídico', 'Sociedad Civil']);
      expect(optionTexts('exp-METODOLOGICO')).toEqual(['Elija una persona', 'Andrés Prueba']);
      expect(optionTexts('exp-SOCIEDAD_CIVIL')).toEqual(['Elija una persona', 'Beatriz Prueba']);
      expect(reason()).toBe('Elija una persona para Metodológico o quite la fila.');
    });

    it('la fila de Sociedad Civil no se puede quitar; las demás sí y vuelven con «Agregar {perfil}»', () => {
      setup();
      chooseType('EXPEDITA');
      const scRow = root().querySelector('[data-profile="SOCIEDAD_CIVIL"]') as HTMLElement;
      expect(scRow.querySelector('button')).toBeNull();
      expect(root().querySelectorAll('[data-testid="filas-expedita"] .formulario__fila button').length).toBe(3);

      click('Quitar fila');
      expect(expeditedLabels()).toEqual(['Salud', 'Jurídico', 'Sociedad Civil']);

      click('Agregar Metodológico');
      expect(expeditedLabels()).toEqual(['Metodológico', 'Salud', 'Jurídico', 'Sociedad Civil']);
    });

    it('una persona en dos filas: «… está en más de una fila; cada persona entra una sola vez.»', () => {
      setup();
      chooseType('EXPEDITA');
      choose('exp-METODOLOGICO', '1');
      choose('exp-SALUD', '1');
      choose('exp-JURIDICO', '3');
      choose('exp-SOCIEDAD_CIVIL', '2');
      expect(reason()).toBe('Andrés Prueba está en más de una fila; cada persona entra una sola vez.');
    });

    it('solo Sociedad Civil: «Asigne al menos 2 evaluadores.»', () => {
      setup();
      chooseType('EXPEDITA');
      click('Quitar fila');
      click('Quitar fila');
      click('Quitar fila');
      choose('exp-SOCIEDAD_CIVIL', '2');
      expect(reason()).toBe('Asigne al menos 2 evaluadores.');
    });

    it('sin miembros de Sociedad Civil no hay su fila y el motivo lo dice (§4)', () => {
      setup({ members: [of(MEMBERS.filter((m) => m.id !== 2))] });
      chooseType('EXPEDITA');
      expect(expeditedLabels()).toEqual(['Metodológico', 'Salud', 'Jurídico']);
      choose('exp-METODOLOGICO', '1');
      removeRow('SALUD');
      choose('exp-JURIDICO', '3');
      expect(reason()).toBe('Incluya al menos un evaluador de Sociedad Civil.');
    });

    it('con una composición válida envía { reviewType, evaluators } en el orden de las filas, sin evaluatorIds (EARS 7)', () => {
      const pending = new Subject<AssignEvaluatorsResponse>();
      setup({ assign: pending });
      fillValidExpedited();
      expect(submit().disabled).toBeFalse();
      expect(root().querySelector('#motivo-asignacion')).toBeNull();

      submit().click();
      fixture.detectChanges();

      expect(assign).toHaveBeenCalledOnceWith(15, {
        reviewType: 'EXPEDITA',
        evaluators: [
          { evaluatorId: 1, profile: 'METODOLOGICO' },
          { evaluatorId: 2, profile: 'SOCIEDAD_CIVIL' },
        ],
      });
      expect(Object.keys(assign.calls.mostRecent().args[1])).not.toContain('evaluatorIds');
      expect(text(submit())).toBe('Asignando…');
      expect(submit().disabled).toBeTrue();

      submit().click();
      expect(assign).toHaveBeenCalledTimes(1);
    });
  });

  describe('en pleno (D4)', () => {
    const plenaryRow = (id: number) => root().querySelector(`[data-member="${id}"]`) as HTMLElement;

    it('una fila por persona; el perfil no viene elegido aunque haya uno solo; sin perfiles: «Sin perfil asignado»', () => {
      setup();
      chooseType('PLENO');
      const names = Array.from(root().querySelectorAll('[data-testid="filas-pleno"] .formulario__nombre'), text);
      expect(names).toEqual(['Andrés Prueba', 'Beatriz Prueba', 'Carla Prueba', 'Diego Prueba']);

      const beatriz = root().querySelector('#plen-2') as HTMLSelectElement;
      expect(beatriz.value).toBe('');
      expect(text(beatriz.selectedOptions[0])).toBe('Elija el perfil');
      expect(optionTexts('plen-2')).toEqual(['Elija el perfil', 'Sociedad Civil']);
      expect(optionTexts('plen-1')).toEqual(['Elija el perfil', 'Metodológico', 'Salud']);

      const label = plenaryRow(2).querySelector('label[for="plen-2"]') as HTMLElement;
      expect(text(label)).toBe('Perfil de Beatriz Prueba');
      expect(text(label.querySelector(':scope > .visually-hidden'))).toBe('de Beatriz Prueba');

      expect(text(plenaryRow(4))).toContain('Sin perfil asignado');
      expect(plenaryRow(4).querySelector('select, button')).toBeNull();

      expect(reason()).toBe('Elija el perfil de Andrés Prueba.');
    });

    it('«Quitar» saca a la persona y «Incluir» la vuelve a poner; con perfiles elegidos envía PLENO', () => {
      setup();
      chooseType('PLENO');
      choose('plen-1', 'SALUD');
      choose('plen-2', 'SOCIEDAD_CIVIL');
      expect(reason()).toBe('Elija el perfil de Carla Prueba.');

      const toggleCarla = () => {
        (plenaryRow(3).querySelector('button') as HTMLButtonElement).click();
        fixture.detectChanges();
      };
      toggleCarla();
      expect(text(plenaryRow(3).querySelector('button'))).toBe('Incluir');
      expect((root().querySelector('#plen-3') as HTMLSelectElement).disabled).toBeTrue();
      expect(reason()).toBe('');

      toggleCarla();
      expect(text(plenaryRow(3).querySelector('button'))).toBe('Quitar');
      expect(reason()).toBe('Elija el perfil de Carla Prueba.');

      toggleCarla();
      submit().click();
      expect(assign).toHaveBeenCalledOnceWith(15, {
        reviewType: 'PLENO',
        evaluators: [
          { evaluatorId: 1, profile: 'SALUD' },
          { evaluatorId: 2, profile: 'SOCIEDAD_CIVIL' },
        ],
      });
    });

    it('solo Sociedad Civil incluida: «Incluya al menos un evaluador que no sea de Sociedad Civil.»', () => {
      setup({
        members: [
          of([
            { id: 2, fullName: 'Beatriz Prueba', profiles: ['SOCIEDAD_CIVIL'] },
            { id: 5, fullName: 'Elena Prueba', profiles: ['SOCIEDAD_CIVIL'] },
          ] as AssignmentMember[]),
        ],
      });
      chooseType('PLENO');
      choose('plen-2', 'SOCIEDAD_CIVIL');
      choose('plen-5', 'SOCIEDAD_CIVIL');
      expect(reason()).toBe('Incluya al menos un evaluador que no sea de Sociedad Civil.');
    });

    it('al cambiar el tipo la composición empieza de cero', () => {
      setup();
      chooseType('PLENO');
      choose('plen-1', 'SALUD');
      chooseType('EXPEDITA');
      chooseType('PLENO');
      expect((root().querySelector('#plen-1') as HTMLSelectElement).value).toBe('');
    });
  });

  describe('errores del envío (D6)', () => {
    const cases: [string, unknown, string][] = [
      [
        '400 del backend',
        httpError(400, 'La asignación debe incluir al menos un evaluador de Sociedad civil.'),
        'La asignación debe incluir al menos un evaluador de Sociedad civil.',
      ],
      [
        '409 del interceptor',
        {
          type: 'CONFLICT',
          status: 409,
          message: 'La versión activa del protocolo ya tiene evaluadores asignados.',
        },
        'La versión activa del protocolo ya tiene evaluadores asignados.',
      ],
      ['error sin mensaje', httpError(500), 'No se pudieron asignar los evaluadores.'],
    ];
    for (const [name, error, shown] of cases) {
      it(`${name}: se muestra tal cual en role="alert" y el formulario se conserva`, () => {
        setup({ assign: throwError(() => error) });
        fillValidExpedited();
        submit().click();
        fixture.detectChanges();

        expect(text(root().querySelector('[role="alert"]'))).toBe(shown);
        expect((root().querySelector('#exp-METODOLOGICO') as HTMLSelectElement).value).toBe('1');
        expect(text(submit())).toBe('Asignar evaluadores');
        expect(submit().disabled).toBeFalse();
      });
    }

    it('el error desaparece al cambiar el tipo de revisión (§5)', () => {
      setup({ assign: throwError(() => httpError(409, 'Conflicto de prueba.')) });
      fillValidExpedited();
      submit().click();
      fixture.detectChanges();
      expect(root().querySelector('[role="alert"]')).not.toBeNull();

      chooseType('PLENO');
      expect(root().querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('éxito (D7)', () => {
    it('«Se asignaron N evaluadores.» con el nombre elegido, el perfil y «Define el riesgo (Anexo 10)»', () => {
      setup({
        assign: of({
          assignments: [
            { assignmentId: 31, evaluatorId: 1, profile: 'METODOLOGICO', isRiskPeer: true, deadlineDate: '2026-12-01' },
            { assignmentId: 32, evaluatorId: 2, profile: 'SOCIEDAD_CIVIL', isRiskPeer: false, deadlineDate: '2026-12-01' },
          ],
        } as AssignEvaluatorsResponse),
      });
      fillValidExpedited();
      submit().click();
      fixture.detectChanges();

      const box = root().querySelector('[role="status"]') as HTMLElement;
      expect(text(box.querySelector('.formulario__exito-titulo'))).toBe('Se asignaron 2 evaluadores.');
      const items = Array.from(box.querySelectorAll('li'), (li) =>
        Array.from(li.querySelectorAll('span'), text).join(' '),
      );
      expect(items).toEqual([
        'Andrés Prueba Metodológico Define el riesgo (Anexo 10)',
        'Beatriz Prueba Sociedad Civil',
      ]);
      expect(text(box)).not.toContain('01/12/2026');
      expect(text(box)).not.toContain('2026-12-01');
      expect(box.querySelector('a')?.getAttribute('href')).toBe('/dashboard/evaluations/assignment');
      expect(root().querySelector('form')).toBeNull();
    });

    it('si la respuesta trae a alguien que no se eligió: «Nombre no disponible», nunca el id', () => {
      setup({
        assign: of({
          assignments: [
            { assignmentId: 33, evaluatorId: 99, profile: 'SALUD', isRiskPeer: true, deadlineDate: null },
          ],
        } as AssignEvaluatorsResponse),
      });
      fillValidExpedited();
      submit().click();
      fixture.detectChanges();

      const item = text(root().querySelector('[role="status"] li'));
      expect(item).toContain('Nombre no disponible');
      expect(item).not.toContain('99');
    });
  });
});

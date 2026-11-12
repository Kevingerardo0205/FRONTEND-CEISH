import { TestBed } from '@angular/core/testing';
import { Component, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, provideRouter, Router, UrlTree } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';

import { ProtocolWorkspaceComponent } from './protocol-workspace.component';
import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { Role, RoleCode } from '@domain/value-objects/role.vo';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { RoleHome } from '@infrastructure/guards/role-home.guard';

const PROTOCOL_TITLE = 'Estudio de prueba del investigador';

/**
 * Estados que `GET /protocols/:id` sí envía (Paso 0 de S-1f): `receptionStatus` (en `status`) y
 * `statusId` del protocolo (NULL durante la recepción; el mapper lo deja en undefined).
 */
interface RealState {
  reception: string;
  statusId: number | null;
}
const STATE = {
  BORRADOR: { reception: 'BORRADOR', statusId: null },
  ENVIADO: { reception: 'EN_REVISION_SECRETARIA', statusId: null },
  CON_OBSERVACIONES: { reception: 'INCOMPLETO', statusId: null },
  POR_SUBSANAR: { reception: 'PENDIENTE_SUBSANACION', statusId: null },
  ARCHIVADO: { reception: 'ARCHIVADO', statusId: null },
  RECEPCION_APROBADA: { reception: 'COMPLETO', statusId: null },
  EN_EVALUACION: { reception: 'COMPLETO', statusId: 13 },
  DISCREPANCIA: { reception: 'COMPLETO', statusId: 16 },
  APROBADO: { reception: 'COMPLETO', statusId: 17 },
  APROBADO_CON_CONDICION: { reception: 'COMPLETO', statusId: 25 },
  RECHAZADO: { reception: 'COMPLETO', statusId: 18 },
  NUEVA_VERSION: { reception: 'EVALUACION_SUBSANACIONES', statusId: 21 },
} satisfies Record<string, RealState>;
type StateName = keyof typeof STATE;

/** Estados que abren alguna acción de la cabecera (EDIT_PROTOCOL, VALIDATE_ALL, ASSIGN_EVALUATORS). */
const ACTION_STATES: StateName[] = ['ENVIADO', 'RECEPCION_APROBADA', 'CON_OBSERVACIONES'];

/**
 * Tabla aprobada del Paso 0 de S-1f (F10 D13), referencia de la prueba: etiqueta, etapa, pestañas
 * de estado (Validación, Seguimiento) y acciones de SECRETARIA e INVESTIGADOR; ventana para
 * INVESTIGADOR sin tiempos aceptados.
 */
const EXPECTED: Record<
  StateName,
  {
    label: string;
    stage: string | null;
    validation: boolean;
    followUp: boolean;
    secretaria: string[];
    investigador: string[];
    modal: boolean;
  }
> = {
  BORRADOR: { label: 'Borrador', stage: 'RECEPCION', validation: false, followUp: false, secretaria: [], investigador: [], modal: false },
  ENVIADO: { label: 'Por validar', stage: 'RECEPCION', validation: true, followUp: false, secretaria: ['VALIDATE_ALL'], investigador: [], modal: false },
  CON_OBSERVACIONES: { label: 'Con observaciones', stage: 'RECEPCION', validation: true, followUp: false, secretaria: [], investigador: ['EDIT_PROTOCOL'], modal: false },
  POR_SUBSANAR: { label: 'Pendiente de subsanación', stage: 'RECEPCION', validation: true, followUp: false, secretaria: [], investigador: ['EDIT_PROTOCOL'], modal: false },
  ARCHIVADO: { label: 'Archivado', stage: 'RECEPCION', validation: true, followUp: false, secretaria: [], investigador: [], modal: false },
  RECEPCION_APROBADA: { label: 'Recepción aprobada', stage: 'ASIGNACION', validation: true, followUp: false, secretaria: ['ASSIGN_EVALUATORS'], investigador: [], modal: true },
  EN_EVALUACION: { label: 'En evaluación', stage: 'EVALUACION', validation: true, followUp: false, secretaria: [], investigador: [], modal: false },
  DISCREPANCIA: { label: 'Discrepancia de riesgo', stage: 'EVALUACION', validation: true, followUp: false, secretaria: [], investigador: [], modal: false },
  APROBADO: { label: 'Aprobado', stage: 'RESOLUCION', validation: true, followUp: true, secretaria: [], investigador: [], modal: false },
  APROBADO_CON_CONDICION: { label: 'Aprobado con condiciones', stage: 'RESOLUCION', validation: true, followUp: true, secretaria: [], investigador: [], modal: false },
  RECHAZADO: { label: 'Rechazado', stage: 'RESOLUCION', validation: true, followUp: false, secretaria: [], investigador: [], modal: false },
  NUEVA_VERSION: { label: 'Nueva versión en revisión documental', stage: 'RECEPCION', validation: true, followUp: false, secretaria: [], investigador: [], modal: false },
};

function createProtocol(
  state: RealState,
  isTimelineTermsAccepted = false,
  reception = state.reception,
): ProtocolEntity {
  return {
    id: '5',
    title: PROTOCOL_TITLE,
    investigatorId: '30',
    status: reception,
    statusId: state.statusId ?? undefined,
    type: 'INVESTIGACION',
    documents: [],
    version: 1,
    isTimelineTermsAccepted,
  } as unknown as ProtocolEntity;
}

function workspaceMock(protocolSignal: WritableSignal<ProtocolEntity | null>) {
  return {
    protocol: protocolSignal,
    evaluations: signal([]),
    loadProtocol: jasmine.createSpy('loadProtocol').and.returnValue(of(null)),
    updateProtocol: jasmine.createSpy('updateProtocol'),
  };
}

describe('ProtocolWorkspaceComponent - acciones contextuales', () => {
  let page: ProtocolWorkspaceComponent;
  let protocolSignal: WritableSignal<ProtocolEntity | null>;
  let activeRoleSignal: WritableSignal<RoleCode | null>;
  let currentUserRoles: RoleCode[];
  /** Campo antiguo `rol` (un solo rol); en las pruebas de varios roles lleva el rol NO activo. */
  let currentUserRol: RoleCode | null;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(null);
    activeRoleSignal = signal<RoleCode | null>('INVESTIGADOR');
    currentUserRoles = ['INVESTIGADOR'];
    currentUserRol = null;
    const workspace = workspaceMock(protocolSignal);

    await TestBed.configureTestingModule({
      imports: [ProtocolWorkspaceComponent],
      providers: [
        { provide: ProtocolWorkspaceService, useValue: workspace },
        {
          provide: AuthFacade,
          useValue: {
            currentUser: () => ({
              rol: currentUserRol ?? activeRoleSignal(),
              roles: currentUserRoles,
            }),
          },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole: activeRoleSignal } },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
      .overrideComponent(ProtocolWorkspaceComponent, {
        set: {
          template: '',
          providers: [{ provide: ProtocolWorkspaceService, useValue: workspace }],
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setState(name: StateName, isTimelineTermsAccepted = false): void {
    protocolSignal.set(createProtocol(STATE[name], isTimelineTermsAccepted));
  }

  function tabPaths(): string[] {
    return page.tabConfig().map((tab) => tab.path);
  }

  function actionIds(): string[] {
    return page.contextualActions().map((action) => action.id);
  }

  it('INVESTIGADOR con BORRADOR no recibe EDIT_PROTOCOL incluso con distinto uso de mayusculas', () => {
    setState('BORRADOR');
    expect(actionIds()).toEqual([]);

    protocolSignal.set(createProtocol(STATE.BORRADOR, false, 'borrador'));
    expect(actionIds()).toEqual([]);
  });

  it('INVESTIGADOR con INCOMPLETO conserva EDIT_PROTOCOL', () => {
    setState('CON_OBSERVACIONES');
    expect(actionIds()).toEqual(['EDIT_PROTOCOL']);
  });

  for (const name of Object.keys(STATE) as StateName[]) {
    const expected = EXPECTED[name];

    it('estado real ' + name + ': etiqueta, etapa, pestañas y acciones (Paso 0 de S-1f)', () => {
      const stateTabs = [
        ...(expected.validation ? ['validation'] : []),
        ...(expected.followUp ? ['follow-up'] : []),
      ];

      activeRoleSignal.set('SECRETARIA');
      setState(name);
      expect(page.statusLabel()).toBe(expected.label);
      expect((page.workspaceStage()?.code ?? null) as string | null).toBe(expected.stage);
      expect(tabPaths()).toEqual(['info', ...stateTabs]);
      expect(actionIds()).toEqual(expected.secretaria);

      activeRoleSignal.set('INVESTIGADOR');
      expect(tabPaths()).toEqual(['info', ...stateTabs]);
      expect(actionIds()).toEqual(expected.investigador);
      expect(page.showAcceptanceModal()).toBe(expected.modal);

      setState(name, true);
      expect(page.showAcceptanceModal()).toBeFalse();
    });
  }

  it('Asignar Pares sale solo en la etapa ASIGNACION', () => {
    activeRoleSignal.set('SECRETARIA');
    for (const name of Object.keys(STATE) as StateName[]) {
      setState(name);
      expect(actionIds().includes('ASSIGN_EVALUATORS'))
        .withContext(name)
        .toBe(name === 'RECEPCION_APROBADA');
    }
  });

  it('statusId 25 nunca cae a la recepción: sin Asignar Pares y en Resolución', () => {
    activeRoleSignal.set('SECRETARIA');
    setState('APROBADO_CON_CONDICION');

    expect(page.statusCode()).toBe('APROBADO_CON_CONDICION');
    expect(actionIds()).toEqual([]);
    expect(page.workspaceStage()?.code).toBe('RESOLUCION');
  });

  it('un statusId desconocido no cae a la recepción: sin acciones, sin barra y "Estado no reconocido"', () => {
    activeRoleSignal.set('SECRETARIA');
    protocolSignal.set(createProtocol({ reception: 'COMPLETO', statusId: 99 }));

    expect(page.statusCode()).toBeNull();
    expect(actionIds()).toEqual([]);
    expect(page.workspaceStage()).toBeNull();
    expect(page.statusLabel()).toBe('Estado no reconocido');
  });

  it('SECRETARIA ve las pestañas y acciones permitidas en cada estado', () => {
    activeRoleSignal.set('SECRETARIA');

    setState('ENVIADO');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['VALIDATE_ALL']);

    setState('RECEPCION_APROBADA');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['ASSIGN_EVALUATORS']);

    setState('CON_OBSERVACIONES');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual([]);

    setState('EN_EVALUACION');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual([]);

    setState('APROBADO');
    expect(tabPaths()).toEqual(['info', 'validation', 'follow-up']);
    expect(actionIds()).toEqual([]);
  });

  it('PRESIDENTE ve Resumen y Seguimiento aprobado, sin Evaluación ni acciones', () => {
    activeRoleSignal.set('PRESIDENTE');

    setState('APROBADO');
    expect(tabPaths()).toEqual(['info', 'follow-up']);
    expect(actionIds()).toEqual([]);

    for (const name of ACTION_STATES) {
      setState(name);
      expect(tabPaths()).toEqual(['info']);
      expect(actionIds()).toEqual([]);
    }
  });

  it('EVALUADOR no ve ninguna pestaña del espacio, ni acciones ni ventana de aceptación', () => {
    activeRoleSignal.set('EVALUADOR');

    for (const name of Object.keys(STATE) as StateName[]) {
      setState(name);
      expect(tabPaths()).withContext(name).toEqual([]);
      expect(actionIds()).withContext(name).toEqual([]);
      expect(page.showAcceptanceModal()).withContext(name).toBeFalse();
    }
  });

  it('INVESTIGADOR ve Resumen, Validación y Seguimiento aprobado; completa INCOMPLETO y acepta tiempos en COMPLETO', () => {
    activeRoleSignal.set('INVESTIGADOR');

    setState('APROBADO');
    expect(tabPaths()).toEqual(['info', 'validation', 'follow-up']);
    expect(actionIds()).toEqual([]);

    setState('CON_OBSERVACIONES');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['EDIT_PROTOCOL']);

    setState('RECEPCION_APROBADA');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual([]);
    expect(page.showAcceptanceModal()).toBeTrue();

    setState('ENVIADO');
    expect(actionIds()).toEqual([]);

    setState('EN_EVALUACION');
    expect(page.showAcceptanceModal()).toBeFalse();
  });

  it('PRESIDENTE y EVALUADOR con EVALUADOR activo no ven ninguna pestaña ni acciones', () => {
    currentUserRoles = ['PRESIDENTE', 'EVALUADOR'];
    currentUserRol = 'PRESIDENTE';
    activeRoleSignal.set('EVALUADOR');

    setState('APROBADO');
    expect(tabPaths()).toEqual([]);
    expect(actionIds()).toEqual([]);

    for (const name of ACTION_STATES) {
      setState(name);
      expect(tabPaths()).toEqual([]);
      expect(actionIds()).toEqual([]);
    }
  });

  it('INVESTIGADOR y EVALUADOR siguen solo el rol activo y cambian acciones y ventana al cambiarlo', () => {
    currentUserRoles = ['INVESTIGADOR', 'EVALUADOR'];
    currentUserRol = 'INVESTIGADOR';
    activeRoleSignal.set('EVALUADOR');

    setState('CON_OBSERVACIONES');
    expect(actionIds()).toEqual([]);

    setState('RECEPCION_APROBADA');
    expect(page.showAcceptanceModal()).toBeFalse();

    activeRoleSignal.set('INVESTIGADOR');
    setState('CON_OBSERVACIONES');
    expect(actionIds()).toEqual(['EDIT_PROTOCOL']);

    setState('RECEPCION_APROBADA');
    expect(page.showAcceptanceModal()).toBeTrue();
  });
});

describe('ProtocolWorkspaceComponent - sin pestaña Evaluación (F10 D11, S-1c)', () => {
  it('ningún rol activo ve la pestaña Evaluación en ningún estado', async () => {
    const protocolSignal = signal<ProtocolEntity | null>(null);
    const activeRoleSignal = signal<RoleCode | null>(null);
    const workspace = workspaceMock(protocolSignal);
    await TestBed.configureTestingModule({
      imports: [ProtocolWorkspaceComponent],
      providers: [
        { provide: AuthFacade, useValue: { currentUser: () => ({ rol: activeRoleSignal(), roles: [] }) } },
        { provide: ActiveRoleFacade, useValue: { activeRole: activeRoleSignal } },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
      .overrideComponent(ProtocolWorkspaceComponent, {
        set: { template: '', providers: [{ provide: ProtocolWorkspaceService, useValue: workspace }] },
      })
      .compileComponents();
    const page = TestBed.createComponent(ProtocolWorkspaceComponent).componentInstance;

    for (const role of Role.all()) {
      activeRoleSignal.set(role.code);
      for (const [name, state] of Object.entries(STATE)) {
        protocolSignal.set(createProtocol(state));
        expect(page.tabConfig().map((tab) => tab.path))
          .withContext(role.code + ' con ' + name)
          .not.toContain('evaluation');
      }
    }
  });
});

describe('ProtocolWorkspaceComponent - template real', () => {
  let protocolSignal: WritableSignal<ProtocolEntity | null>;
  let activeRoleSignal: WritableSignal<RoleCode | null>;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(createProtocol(STATE.RECEPCION_APROBADA));
    activeRoleSignal = signal<RoleCode | null>('SECRETARIA');
    const workspace = workspaceMock(protocolSignal);

    await TestBed.configureTestingModule({
      imports: [ProtocolWorkspaceComponent],
      providers: [
        provideRouter([]),
        { provide: ProtocolWorkspaceService, useValue: workspace },
        {
          provide: AuthFacade,
          useValue: { currentUser: () => ({ rol: 'SECRETARIA', roles: ['SECRETARIA'] }) },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole: activeRoleSignal } },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
      .overrideComponent(ProtocolWorkspaceComponent, {
        remove: { providers: [ProtocolWorkspaceService] },
        add: { providers: [{ provide: ProtocolWorkspaceService, useValue: workspace }] },
      })
      .compileComponents();
  });

  it('oculta Historial y Finalizar y muestra Asignar Pares para SECRETARIA con COMPLETO', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      'header .action-registry button',
    ) as NodeListOf<HTMLButtonElement>;
    const buttonLabels = Array.from(buttons, (button) =>
      button.querySelector('span')?.textContent?.trim(),
    );

    expect(buttonLabels).not.toContain('Historial');
    expect(buttonLabels).not.toContain('Finalizar');
    expect(buttonLabels).toContain('Asignar Pares');
  });

  it('muestra la etiqueta y la barra de 6 etapas con Asignación como actual (F10 D13)', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.status-indicator')?.textContent?.trim()).toBe('Recepción aprobada');
    expect(root.querySelectorAll('app-stage-bar li').length).toBe(6);
    expect(root.querySelector('app-stage-bar [aria-current="step"]')?.getAttribute('data-stage')).toBe(
      'ASIGNACION',
    );
  });

  it('sin estado reconocido no muestra la barra de etapas (F02 §5.3)', () => {
    protocolSignal.set(createProtocol({ reception: 'COMPLETO', statusId: 99 }));
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-stage-bar')).toBeNull();
    expect(root.querySelector('.status-indicator')?.textContent?.trim()).toBe('Estado no reconocido');
  });
});

/** Pestaña de prueba: cuenta cuántas veces se crea, para saber si el outlet se volvió a montar. */
@Component({
  selector: 'app-tab-prueba',
  standalone: true,
  template: '<p class="tab-prueba">Pestaña de prueba</p>',
})
class TabPruebaComponent {
  static created = 0;
  constructor() {
    TabPruebaComponent.created++;
  }
}

/**
 * F10 S-1g (D14): carga y errores con el router real y el ProtocolWorkspaceService real. El
 * repositorio devuelve un Subject por petición para decidir cuándo y en qué orden responde. Los
 * textos son los de D14 y F02 §6; los errores imitan el Error que relanza ErrorInterceptor
 * (mensaje del backend y `status`).
 */
describe('ProtocolWorkspaceComponent - carga y errores (F10 D14, S-1g)', () => {
  const LOADING_TEXT = 'Cargando el protocolo…';
  const FAILED_TEXT = 'No pudimos cargar el protocolo.';
  const NOT_FOUND_TEXT = 'No encontramos este protocolo. Revise el enlace.';
  const BACKEND_404_TEXT = 'Protocol with ID 5 not found';
  const HOME_TREE = 'inicio-del-rol-activo';

  let requests: { id: string; response: Subject<ProtocolEntity> }[];
  let harness: RouterTestingHarness;
  let router: Router;

  function protocolWith(id: string, title: string, principalInvestigator = 'Investigador Prueba'): ProtocolEntity {
    return { ...createProtocol(STATE.RECEPCION_APROBADA), id, title, principalInvestigator };
  }

  function respond(index: number, protocol: ProtocolEntity): void {
    requests[index].response.next(protocol);
    requests[index].response.complete();
    harness.detectChanges();
  }

  function fail(index: number, message: string, status: number): void {
    requests[index].response.error(Object.assign(new Error(message), { status }));
    harness.detectChanges();
  }

  function root(): HTMLElement {
    return harness.fixture.nativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(root().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === label,
    );
  }

  beforeEach(async () => {
    TabPruebaComponent.created = 0;
    requests = [];
    const getById = jasmine.createSpy('getById').and.callFake((id: string) => {
      const response = new Subject<ProtocolEntity>();
      requests.push({ id, response });
      return response;
    });

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'workspace/:id',
            component: ProtocolWorkspaceComponent,
            children: [{ path: 'info', component: TabPruebaComponent }],
          },
        ]),
        { provide: IProtocolRepositoryPort, useValue: { getById } },
        {
          provide: IEvaluationRepositoryPort,
          useValue: { getByProtocolId: jasmine.createSpy('getByProtocolId').and.returnValue(of([])) },
        },
        {
          provide: AuthFacade,
          useValue: { currentUser: () => ({ rol: 'SECRETARIA', roles: ['SECRETARIA'] }) },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole: signal<RoleCode | null>('SECRETARIA') } },
        { provide: RoleHome, useValue: { urlTree: () => HOME_TREE } },
      ],
    });
    TestBed.overrideComponent(ProtocolWorkspaceComponent, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
          {
            provide: MatDialog,
            useValue: { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) }) },
          },
        ],
      },
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('mientras carga muestra "Cargando el protocolo…" sin cabecera ni pestañas', async () => {
    await harness.navigateByUrl('/workspace/5/info');

    expect(root().textContent).toContain(LOADING_TEXT);
    expect(root().textContent).not.toContain('Sincronizando');
    expect(root().querySelector('header')).toBeNull();
    expect(root().querySelector('.tab-strip')).toBeNull();
    expect(root().querySelector('.tab-prueba')).toBeNull();
  });

  it('un error de carga muestra "No pudimos cargar el protocolo." y Reintentar vuelve a pedir el mismo :id', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    fail(0, 'Internal server error', 500);

    expect(root().textContent).toContain(FAILED_TEXT);
    expect(root().textContent).not.toContain(LOADING_TEXT);
    expect(root().querySelector('.tab-strip')).toBeNull();

    button('Reintentar')?.click();
    harness.detectChanges();

    expect(requests.map((r) => r.id)).toEqual(['5', '5']);
    expect(root().textContent).toContain(LOADING_TEXT);
    respond(1, protocolWith('5', 'Estudio de prueba cinco'));
    expect(root().querySelector('.protocol-title')?.textContent?.trim()).toBe('Estudio de prueba cinco');
  });

  it('un 404 muestra "No encontramos este protocolo." sin el texto del backend, y Volver al inicio usa RoleHome', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    fail(0, BACKEND_404_TEXT, 404);
    const navigateByUrl = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    expect(root().textContent).toContain(NOT_FOUND_TEXT);
    expect(root().textContent).not.toContain(BACKEND_404_TEXT);
    expect(button('Reintentar')).toBeUndefined();

    button('Volver al inicio')?.click();

    expect(navigateByUrl).toHaveBeenCalledOnceWith(HOME_TREE as unknown as UrlTree);
    expect(requests.length).toBe(1);
  });

  it('un 400 de id no numérico también es "no encontrado"', async () => {
    await harness.navigateByUrl('/workspace/abc/info');
    fail(0, 'ID de protocolo debe ser un número', 400);

    expect(root().textContent).toContain(NOT_FOUND_TEXT);
    expect(root().textContent).not.toContain('ID de protocolo debe ser un número');
  });

  it('al cambiar de :id no se ven datos del anterior y la pestaña se vuelve a montar', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, protocolWith('5', 'Estudio de prueba cinco'));
    expect(TabPruebaComponent.created).toBe(1);

    await harness.navigateByUrl('/workspace/6/info');

    expect(root().textContent).not.toContain('Estudio de prueba cinco');
    expect(root().textContent).toContain(LOADING_TEXT);
    respond(1, protocolWith('6', 'Estudio de prueba seis'));
    expect(root().querySelector('.protocol-title')?.textContent?.trim()).toBe('Estudio de prueba seis');
    expect(TabPruebaComponent.created).toBe(2);
  });

  it('la respuesta tardía del :id anterior no se muestra: gana el último :id', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    await harness.navigateByUrl('/workspace/6/info');
    respond(1, protocolWith('6', 'Estudio de prueba seis'));

    respond(0, protocolWith('5', 'Estudio de prueba cinco'));

    expect(requests.map((r) => r.id)).toEqual(['5', '6']);
    expect(root().querySelector('.protocol-title')?.textContent?.trim()).toBe('Estudio de prueba seis');
  });

  it('al recargar el mismo :id después de Asignar Pares conserva cabecera, pestañas y pestaña abierta, sin "Cargando"', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, protocolWith('5', 'Estudio de prueba cinco'));

    button('person_addAsignar Pares')?.click();
    harness.detectChanges();

    expect(requests.map((r) => r.id)).toEqual(['5', '5']);
    expect(root().textContent).not.toContain(LOADING_TEXT);
    expect(root().querySelector('.protocol-title')?.textContent?.trim()).toBe('Estudio de prueba cinco');
    expect(root().querySelectorAll('.tab-strip .tab-item').length).toBeGreaterThan(0);
    expect(root().querySelector('.tab-prueba')).not.toBeNull();
    expect(router.url).toBe('/workspace/5/info');
    expect(TabPruebaComponent.created).toBe(1);

    respond(1, protocolWith('5', 'Estudio de prueba cinco'));
    expect(TabPruebaComponent.created).toBe(1);
  });

  it('sin investigador principal no muestra el chip; con investigador, sí', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, protocolWith('5', 'Estudio de prueba cinco', ''));

    expect(root().querySelector('.owner-chip')).toBeNull();
    expect(root().textContent).not.toContain('Cargando...');

    await harness.navigateByUrl('/workspace/6/info');
    respond(1, protocolWith('6', 'Estudio de prueba seis'));
    expect(root().querySelector('.owner-chip')?.textContent).toContain('Investigador Prueba');
  });
});

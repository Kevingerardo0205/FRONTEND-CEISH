import { Stage } from '@domain/value-objects/stage.vo';
import { TestBed } from '@angular/core/testing';
import { Component, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, provideRouter, Router, UrlTree } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, of, Subject } from 'rxjs';

import { ProtocolWorkspaceComponent } from './protocol-workspace.component';
import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { Role, RoleCode } from '@domain/value-objects/role.vo';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { RoleHome } from '@infrastructure/guards/role-home.guard';
import { TERMS_NOT_ACCEPTED_REASON } from '@domain/entities/peer-assignment-composition';
import { ProtocolHeaderData, ProtocolHeaderPort } from '../../../domain/protocol-header';

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

/** Estados que abren alguna acción de la cabecera (EDIT_PROTOCOL, VALIDATE_ALL, ASSIGN_EVALUATORS de PRESIDENTE). */
const ACTION_STATES: StateName[] = ['ENVIADO', 'RECEPCION_APROBADA', 'CON_OBSERVACIONES'];

/**
 * Tabla aprobada del Paso 0 de S-1f (F10 D13), referencia de la prueba: etiqueta, pestañas
 * de estado (Validación, Seguimiento) y acciones de SECRETARIA, PRESIDENTE (F10 D20, con los
 * tiempos aceptados) e INVESTIGADOR; ventana para INVESTIGADOR sin tiempos aceptados.
 */
const EXPECTED: Record<
  StateName,
  {
    label: string;
    validation: boolean;
    followUp: boolean;
    secretaria: string[];
    presidente: string[];
    investigador: string[];
    modal: boolean;
  }
> = {
  BORRADOR: { label: 'Borrador', validation: false, followUp: false, secretaria: [], presidente: [], investigador: [], modal: false },
  ENVIADO: { label: 'Por validar', validation: true, followUp: false, secretaria: ['VALIDATE_ALL'], presidente: [], investigador: [], modal: false },
  CON_OBSERVACIONES: { label: 'Con observaciones', validation: true, followUp: false, secretaria: [], presidente: [], investigador: ['EDIT_PROTOCOL'], modal: false },
  POR_SUBSANAR: { label: 'Pendiente de subsanación', validation: true, followUp: false, secretaria: [], presidente: [], investigador: ['EDIT_PROTOCOL'], modal: false },
  ARCHIVADO: { label: 'Archivado', validation: true, followUp: false, secretaria: [], presidente: [], investigador: [], modal: false },
  RECEPCION_APROBADA: { label: 'Recepción aprobada', validation: true, followUp: false, secretaria: [], presidente: ['ASSIGN_EVALUATORS'], investigador: [], modal: true },
  EN_EVALUACION: { label: 'En evaluación', validation: true, followUp: false, secretaria: [], presidente: [], investigador: [], modal: false },
  DISCREPANCIA: { label: 'Discrepancia de riesgo', validation: true, followUp: false, secretaria: [], presidente: [], investigador: [], modal: false },
  APROBADO: { label: 'Aprobado', validation: true, followUp: true, secretaria: [], presidente: [], investigador: [], modal: false },
  APROBADO_CON_CONDICION: { label: 'Aprobado con condiciones', validation: true, followUp: true, secretaria: [], presidente: [], investigador: [], modal: false },
  RECHAZADO: { label: 'Rechazado', validation: true, followUp: false, secretaria: [], presidente: [], investigador: [], modal: false },
  NUEVA_VERSION: { label: 'Nueva versión en revisión documental', validation: true, followUp: false, secretaria: [], presidente: [], investigador: [], modal: false },
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

/** Encabezado ficticio sin rellenos (F10 D18); etapa del backend (D19). Sin la clave riskLevel. */
const HEADER: ProtocolHeaderData = {
  code: 'CEISH-PRUEBA-005',
  version: '2.0',
  title: PROTOCOL_TITLE,
  riskLevel: undefined,
  stage: Stage.fromBackend('ASIGNACION'),
};

function workspaceMock(
  protocolSignal: WritableSignal<ProtocolEntity | null>,
  headerSignal: WritableSignal<ProtocolHeaderData | null> = signal<ProtocolHeaderData | null>(HEADER),
) {
  return {
    protocol: protocolSignal,
    header: headerSignal,
    evaluations: signal([]),
    error: signal<string | null>(null),
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

    it('estado real ' + name + ': etiqueta, pestañas y acciones (Paso 0 de S-1f)', () => {
      const stateTabs = [
        ...(expected.validation ? ['validation'] : []),
        ...(expected.followUp ? ['follow-up'] : []),
      ];

      // Con los tiempos aceptados: "Asignar Pares" los exige desde S-1h (D15) y es de PRESIDENTE (D20).
      activeRoleSignal.set('SECRETARIA');
      setState(name, true);
      expect(page.statusLabel()).toBe(expected.label);
      expect(tabPaths()).toEqual(['info', ...stateTabs]);
      expect(actionIds()).toEqual(expected.secretaria);

      activeRoleSignal.set('PRESIDENTE');
      expect(actionIds()).toEqual(expected.presidente);

      activeRoleSignal.set('INVESTIGADOR');
      setState(name);
      expect(tabPaths()).toEqual(['info', ...stateTabs]);
      expect(actionIds()).toEqual(expected.investigador);
      expect(page.showAcceptanceModal()).toBe(expected.modal);

      setState(name, true);
      expect(page.showAcceptanceModal()).toBeFalse();
    });
  }

  it('Asignar Pares sale solo en la etapa ASIGNACION y solo para PRESIDENTE (F10 D20 (2))', () => {
    for (const name of Object.keys(STATE) as StateName[]) {
      setState(name, true);
      activeRoleSignal.set('PRESIDENTE');
      expect(actionIds().includes('ASSIGN_EVALUATORS'))
        .withContext('PRESIDENTE con ' + name)
        .toBe(name === 'RECEPCION_APROBADA');
      activeRoleSignal.set('SECRETARIA');
      expect(actionIds()).withContext('SECRETARIA con ' + name).not.toContain('ASSIGN_EVALUATORS');
    }
  });

  it('Asignar Pares exige la aceptación de tiempos; sin ella, PRESIDENTE ve el aviso y SECRETARIA no (F10 D20 (3))', () => {
    activeRoleSignal.set('PRESIDENTE');
    setState('RECEPCION_APROBADA');
    expect(actionIds()).not.toContain('ASSIGN_EVALUATORS');
    expect(page.awaitingTimelineAcceptance()).toBeTrue();

    setState('RECEPCION_APROBADA', true);
    expect(actionIds()).toContain('ASSIGN_EVALUATORS');
    expect(page.awaitingTimelineAcceptance()).toBeFalse();

    for (const role of ['SECRETARIA', 'INVESTIGADOR'] as RoleCode[]) {
      activeRoleSignal.set(role);
      setState('RECEPCION_APROBADA');
      expect(page.awaitingTimelineAcceptance()).withContext(role).toBeFalse();
    }
  });

  it('statusId 25 nunca cae a la recepción: sin Asignar Pares', () => {
    activeRoleSignal.set('PRESIDENTE');
    setState('APROBADO_CON_CONDICION');

    expect(page.statusCode()).toBe('APROBADO_CON_CONDICION');
    expect(actionIds()).toEqual([]);
  });

  it('un statusId desconocido no cae a la recepción: sin acciones y "Estado no reconocido"', () => {
    activeRoleSignal.set('SECRETARIA');
    protocolSignal.set(createProtocol({ reception: 'COMPLETO', statusId: 99 }));

    expect(page.statusCode()).toBeNull();
    expect(actionIds()).toEqual([]);
    expect(page.statusLabel()).toBe('Estado no reconocido');
  });

  it('SECRETARIA ve las pestañas y acciones permitidas en cada estado', () => {
    activeRoleSignal.set('SECRETARIA');

    setState('ENVIADO');
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['VALIDATE_ALL']);

    // F10 D20 (2): la Secretaría ya no asigna.
    setState('RECEPCION_APROBADA', true);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual([]);

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

  it('PRESIDENTE ve Resumen, Validación (solo lectura, F11 EP2) y Seguimiento aprobado, sin Evaluación; su única acción es Asignar Pares con los tiempos aceptados (D20)', () => {
    activeRoleSignal.set('PRESIDENTE');

    setState('RECEPCION_APROBADA', true);
    expect(tabPaths()).toEqual(['info', 'assignment', 'validation']);
    expect(actionIds()).toEqual(['ASSIGN_EVALUATORS']);

    setState('APROBADO');
    expect(tabPaths()).toEqual(['info', 'validation', 'follow-up']);
    expect(actionIds()).toEqual([]);

    for (const name of ACTION_STATES) {
      setState(name);
      expect(tabPaths()).toEqual(['info', 'validation']);
      expect(actionIds()).toEqual([]);
    }

    // Borrador: sin Validación, como para los demás roles.
    setState('BORRADOR');
    expect(tabPaths()).toEqual(['info']);
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

  it('retorna a la lista para assignment-list y usa el inicio como fallback', () => {
    const navigate = TestBed.inject(Router).navigate as jasmine.Spy;
    activeRoleSignal.set('PRESIDENTE');
    setState('RECEPCION_APROBADA', true);
    page.returnOrigin.set('assignment-list');

    page.returnToAssignmentContext();

    expect(navigate).toHaveBeenCalledWith(['/dashboard/evaluations/assignment']);

    navigate.calls.reset();
    page.returnOrigin.set(null);
    const goHome = spyOn(page, 'goHome');
    page.returnToAssignmentContext();
    expect(goHome).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('retorna al formulario del mismo protocolo dentro del workspace para assignment-form', () => {
    const navigate = TestBed.inject(Router).navigate as jasmine.Spy;
    setState('RECEPCION_APROBADA', true);
    page.returnOrigin.set('assignment-form');

    page.returnToAssignmentContext();

    expect(navigate).toHaveBeenCalledWith(['/dashboard/protocols/workspace', 5, 'assignment']);
  });

  it('conserva el origen al ejecutar Asignar Pares desde el workspace', () => {
    const navigate = TestBed.inject(Router).navigate as jasmine.Spy;
    activeRoleSignal.set('PRESIDENTE');
    setState('RECEPCION_APROBADA', true);
    page.returnOrigin.set('assignment-list');

    page.onExecuteAction('ASSIGN_EVALUATORS');

    expect(navigate).toHaveBeenCalledWith(
      ['/dashboard/protocols/workspace', 5, 'assignment'],
      { queryParams: { origin: 'assignment-list' } },
    );
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
  let headerSignal: WritableSignal<ProtocolHeaderData | null>;
  let activeRoleSignal: WritableSignal<RoleCode | null>;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(createProtocol(STATE.RECEPCION_APROBADA, true));
    headerSignal = signal<ProtocolHeaderData | null>(HEADER);
    activeRoleSignal = signal<RoleCode | null>('SECRETARIA');
    const workspace = workspaceMock(protocolSignal, headerSignal);

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
      ],
    })
      .overrideComponent(ProtocolWorkspaceComponent, {
        remove: { providers: [ProtocolWorkspaceService] },
        add: { providers: [{ provide: ProtocolWorkspaceService, useValue: workspace }] },
      })
      .compileComponents();
  });

  it('oculta Historial y Finalizar; Asignar Pares sale para PRESIDENTE con COMPLETO y no para SECRETARIA (F10 D20)', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const buttonLabels = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          'app-protocol-header .protocol-header__action .header-action__button',
        ) as NodeListOf<HTMLButtonElement>,
        (button) => button.querySelector('span')?.textContent?.trim(),
      );

    expect(buttonLabels()).not.toContain('Historial');
    expect(buttonLabels()).not.toContain('Finalizar');
    expect(buttonLabels()).not.toContain('Asignar Pares');

    activeRoleSignal.set('PRESIDENTE');
    fixture.detectChanges();
    expect(buttonLabels()).toContain('Asignar Pares');
  });

  it('muestra la etiqueta y la barra de 6 etapas con la etapa del backend como actual (F10 D19)', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.protocol-header__status .chip')?.textContent?.trim()).toBe(
      'Recepción aprobada',
    );
    expect(root.querySelectorAll('app-stage-bar li').length).toBe(6);
    expect(root.querySelector('app-stage-bar [aria-current="step"]')?.getAttribute('data-stage')).toBe(
      'ASIGNACION',
    );
  });

  it('D19: APROBADO con etapa SEGUIMIENTO del backend marca Seguimiento (sin cálculo desde el estado)', () => {
    protocolSignal.set(createProtocol(STATE.APROBADO, true));
    headerSignal.set({ ...HEADER, stage: Stage.fromBackend('SEGUIMIENTO') });
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-stage-bar [aria-current="step"]')?.getAttribute('data-stage')).toBe(
      'SEGUIMIENTO',
    );
  });

  it('D19: sin etapa del backend (null o desconocida) no muestra la barra, aunque el estado se reconozca', () => {
    headerSignal.set({ ...HEADER, stage: null });
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-stage-bar')).toBeNull();
    expect(root.querySelector('.protocol-header__status .chip')?.textContent?.trim()).toBe(
      'Recepción aprobada',
    );
  });

  it('sin estado reconocido el chip dice "Estado no reconocido" en gris (F02 §5.3)', () => {
    protocolSignal.set(createProtocol({ reception: 'COMPLETO', statusId: 99 }));
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.protocol-header__status .chip')?.textContent?.trim()).toBe(
      'Estado no reconocido',
    );
    expect(root.querySelector('.protocol-header__status .chip')?.classList).toContain('chip--gris');
  });

  it('D18: el encabezado es app-protocol-header, sin premium-header', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.premium-header')).toBeNull();
    expect(root.querySelector('.progress-scaffold')).toBeNull();
    expect(root.querySelector('app-protocol-header h1')?.textContent?.trim()).toBe(PROTOCOL_TITLE);
  });

  it('D18: chip neutro con el código y la versión "2.0" como v2, y el estado con su tono', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.protocol-header__code .chip')?.textContent?.trim()).toBe(
      'CEISH-PRUEBA-005 · v2',
    );
    // COMPLETO: ProtocolUI.class → pending → ámbar (regla T14b de F00).
    expect(root.querySelector('.protocol-header__status .chip')?.classList).toContain('chip--ambar');
  });

  it('D18: sin código y con una versión que no se puede leer, no hay chip neutro ni relleno', () => {
    headerSignal.set({ ...HEADER, code: null, version: '2.5' });
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.protocol-header__code')).toBeNull();
    expect(root.textContent).not.toContain('S/C');
    expect(root.textContent).not.toContain('v1');
  });

  it('D18/D19: la línea de datos muestra el nivel de riesgo; sin la clave no aparece', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.protocol-header__facts')).toBeNull();

    headerSignal.set({ ...HEADER, riskLevel: 'Riesgo mínimo' });
    fixture.detectChanges();
    expect(root.querySelector('.protocol-header__facts')?.textContent?.trim()).toBe(
      'Nivel de riesgo: Riesgo mínimo',
    );
  });

  it('D19: riskLevel null es un estado real: «Nivel de riesgo: Sin fijar»', () => {
    headerSignal.set({ ...HEADER, riskLevel: null });
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.protocol-header__facts')?.textContent?.trim()).toBe(
      'Nivel de riesgo: Sin fijar',
    );
  });

  it('D18: sin título muestra el aviso con Reintentar en lugar del encabezado, y las pestañas siguen', () => {
    headerSignal.set({ ...HEADER, title: null });
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-protocol-header')).toBeNull();
    expect(root.querySelector('.workspace-header app-error-state')?.textContent).toContain(
      'No pudimos leer el título de este protocolo.',
    );
    expect(root.textContent).not.toContain('Sin título');
    expect(root.querySelectorAll('.tab-strip .tab-item').length).toBeGreaterThan(0);
  });

  it('D18: Asignar Pares va en la ranura de acción del encabezado', () => {
    activeRoleSignal.set('PRESIDENTE');
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const action = (fixture.nativeElement as HTMLElement).querySelector(
      'app-protocol-header .protocol-header__action',
    ) as HTMLElement;

    expect(action.querySelector('[protocolHeaderAction]')).not.toBeNull();
    expect(action.textContent).toContain('Asignar Pares');
    expect(action.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('D18: sin acción ni aviso, la ranura de acción queda vacía', () => {
    protocolSignal.set(createProtocol(STATE.EN_EVALUACION, true));
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const action = (fixture.nativeElement as HTMLElement).querySelector(
      '.protocol-header__action',
    ) as HTMLElement;

    expect(action.children.length).toBe(0);
  });

  it('D18: el espacio no agrega otro <main> (el del AppShell es el único landmark main)', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('main, [role="main"]')).toBeNull();
    expect(root.querySelector('.content-viewport router-outlet')).not.toBeNull();
  });

  it('D18: el nav de las pestañas tiene aria-label "Pestañas del protocolo"', () => {
    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('nav')?.getAttribute('aria-label'),
    ).toBe('Pestañas del protocolo');
  });

  it('D18 (EARS 51): los estilos del espacio no tienen colores hexadecimales ni rgba', () => {
    // Estilos ya compilados del componente (metadatos de Angular).
    const css = (
      (ProtocolWorkspaceComponent as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles ?? []
    ).join('\n');

    expect(css.length).toBeGreaterThan(0);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/rgba?\(/i);
    expect(css).toContain('var(--c-');
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
  let activeRole: WritableSignal<RoleCode | null>;

  function protocolWith(id: string, title: string, principalInvestigator = 'Investigador Prueba'): ProtocolEntity {
    return { ...createProtocol(STATE.RECEPCION_APROBADA, true), id, title, principalInvestigator };
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
    activeRole = signal<RoleCode | null>('SECRETARIA');
    const getById = jasmine.createSpy('getById').and.callFake((id: string) => {
      const response = new Subject<ProtocolEntity>();
      requests.push({ id, response });
      return response;
    });
    const headerFromLastRequest = (id: string) => {
      const last = requests[requests.length - 1];
      expect(last.id).toBe(id);
      return last.response.pipe(
        map(
          (p): ProtocolHeaderData => ({
            code: p.code || null,
            version: '1.0',
            title: p.title,
            riskLevel: undefined,
            stage: Stage.fromBackend('ASIGNACION'),
          }),
        ),
      );
    };

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
        // F10 D18: el encabezado responde con la misma respuesta (y el mismo error) del protocolo.
        { provide: ProtocolHeaderPort, useValue: { get: headerFromLastRequest } },
        {
          provide: IEvaluationRepositoryPort,
          useValue: { getByProtocolId: jasmine.createSpy('getByProtocolId').and.returnValue(of([])) },
        },
        {
          provide: AuthFacade,
          useValue: { currentUser: () => ({ rol: 'SECRETARIA', roles: ['SECRETARIA'] }) },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole } },
        { provide: RoleHome, useValue: { urlTree: () => HOME_TREE } },
      ],
    });
    TestBed.overrideComponent(ProtocolWorkspaceComponent, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
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
    expect(root().querySelector('.protocol-header__title')?.textContent?.trim()).toBe('Estudio de prueba cinco');
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
    expect(root().querySelector('.protocol-header__title')?.textContent?.trim()).toBe('Estudio de prueba seis');
    expect(TabPruebaComponent.created).toBe(2);
  });

  it('la respuesta tardía del :id anterior no se muestra: gana el último :id', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    await harness.navigateByUrl('/workspace/6/info');
    respond(1, protocolWith('6', 'Estudio de prueba seis'));

    respond(0, protocolWith('5', 'Estudio de prueba cinco'));

    expect(requests.map((r) => r.id)).toEqual(['5', '6']);
    expect(root().querySelector('.protocol-header__title')?.textContent?.trim()).toBe('Estudio de prueba seis');
  });

  /** Recarga del mismo :id (D14); desde F10 D20 ya no la dispara Asignar Pares, que navega. */
  function reloadSameId(): void {
    (harness.routeDebugElement?.componentInstance as ProtocolWorkspaceComponent).reload();
    harness.detectChanges();
  }

  it('al recargar el mismo :id conserva cabecera, pestañas y pestaña abierta, sin "Cargando"', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, protocolWith('5', 'Estudio de prueba cinco'));

    reloadSameId();

    expect(requests.map((r) => r.id)).toEqual(['5', '5']);
    expect(root().textContent).not.toContain(LOADING_TEXT);
    expect(root().querySelector('.protocol-header__title')?.textContent?.trim()).toBe('Estudio de prueba cinco');
    expect(root().querySelectorAll('.tab-strip .tab-item').length).toBeGreaterThan(0);
    expect(root().querySelector('.tab-prueba')).not.toBeNull();
    expect(router.url).toBe('/workspace/5/info');
    expect(TabPruebaComponent.created).toBe(1);

    respond(1, protocolWith('5', 'Estudio de prueba cinco'));
    expect(TabPruebaComponent.created).toBe(1);
  });

  it('PRESIDENTE sin aceptación de tiempos no ve Asignar Pares y la cabecera dice que falta (F10 D20 (3))', async () => {
    activeRole.set('PRESIDENTE');
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, { ...protocolWith('5', 'Estudio de prueba cinco'), isTimelineTermsAccepted: false });

    expect(button('person_addAsignar Pares')).toBeUndefined();
    expect(root().querySelector('.header-notice')?.textContent?.trim()).toBe(
      'El investigador aún no acepta los tiempos del comité.',
    );
    expect(TERMS_NOT_ACCEPTED_REASON).toBe('El investigador aún no acepta los tiempos del comité.');

    await harness.navigateByUrl('/workspace/6/info');
    respond(1, protocolWith('6', 'Estudio de prueba seis'));
    expect(button('person_addAsignar Pares')).toBeDefined();
    expect(root().querySelector('.header-notice')).toBeNull();
  });

  it('si falla la recarga del mismo :id conserva los datos y avisa "No pudimos actualizar el protocolo."; Reintentar vuelve a pedirlo (F10 D15)', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, protocolWith('5', 'Estudio de prueba cinco'));
    reloadSameId();
    spyOn(console, 'error');
    fail(1, 'fallo de red', 500);

    expect(root().querySelector('.protocol-header__title')?.textContent?.trim()).toBe('Estudio de prueba cinco');
    expect(root().querySelector('.tab-prueba')).not.toBeNull();
    expect(root().querySelector('.refresh-error')?.textContent).toContain('No pudimos actualizar el protocolo.');
    expect(root().textContent).not.toContain(FAILED_TEXT);

    (root().querySelector('.refresh-error button') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(requests.map((r) => r.id)).toEqual(['5', '5', '5']);
    expect(root().querySelector('.refresh-error')).toBeNull();

    respond(2, protocolWith('5', 'Estudio de prueba cinco'));
    expect(root().querySelector('.refresh-error')).toBeNull();
    expect(TabPruebaComponent.created).toBe(1);
  });

  it('Asignar Pares lleva al formulario de F03 del protocolo, sin abrir un modal (F10 D20 (2))', async () => {
    activeRole.set('PRESIDENTE');
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, protocolWith('5', 'Estudio de prueba cinco'));
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    button('person_addAsignar Pares')?.click();

    expect(navigate).toHaveBeenCalledOnceWith(['/dashboard/evaluations/assignment', '5']);
    expect(requests.length).toBe(1);
  });

  it('con SECRETARIA activa el espacio no ofrece Asignar Pares ni el aviso de tiempos (F10 D20)', async () => {
    await harness.navigateByUrl('/workspace/5/info');
    respond(0, { ...protocolWith('5', 'Estudio de prueba cinco'), isTimelineTermsAccepted: false });
    expect(root().querySelector('.header-notice')).toBeNull();

    await harness.navigateByUrl('/workspace/6/info');
    respond(1, protocolWith('6', 'Estudio de prueba seis'));
    expect(button('person_addAsignar Pares')).toBeUndefined();
  });

  it('el encabezado no muestra el investigador principal: mostrarlo queda pendiente de decisión (F10 D18 (1))', async () => {
    await harness.navigateByUrl('/workspace/6/info');
    respond(0, protocolWith('6', 'Estudio de prueba seis'));

    const header = root().querySelector('app-protocol-header') as HTMLElement;
    expect(header.textContent).not.toContain('Investigador Prueba');
    expect(header.textContent).not.toContain('Cargando...');
    expect(root().querySelector('.owner-chip')).toBeNull();
  });
});

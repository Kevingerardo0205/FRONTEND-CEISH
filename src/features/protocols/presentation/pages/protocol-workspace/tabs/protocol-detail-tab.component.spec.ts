import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';

import { ProtocolDetailTabPage } from './protocol-detail-tab.component';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { RoleCode } from '@domain/value-objects/role.vo';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import {
  WORKSPACE_ACTION_ROLES,
  WORKSPACE_SECTION_ROLES,
  WorkspaceAction,
  WorkspaceSection,
} from '../../../../domain/workspace-tab-roles';

/**
 * F10 D17: el Resumen decide con el rol activo (`ActiveRoleFacade`).
 *
 * Dato de prueba: en varias pruebas el campo antiguo `currentUser().rol` lleva un rol distinto
 * del rol activo, solo para asegurar que se usa el rol activo (si el código volviera a `.rol`,
 * la prueba fallaría). Esas cuentas no existen: el rol INVESTIGADOR es exclusivo (D17 (1)) y la
 * única cuenta con dos roles posible es PRESIDENTE + EVALUADOR.
 * El componente ya no usa `AuthFacade`; el simulado se da para que una vuelta a `.rol` falle por
 * la comprobación y no por el inyector.
 */
describe('ProtocolDetailTabPage - edicion de protocolo', () => {
  let page: ProtocolDetailTabPage;
  let protocolSignal: WritableSignal<ProtocolEntity | null>;
  let activeRole: WritableSignal<RoleCode | null>;
  let legacyRol: string;

  function create(active: RoleCode, legacy: string): void {
    activeRole.set(active);
    legacyRol = legacy;
    page = TestBed.createComponent(ProtocolDetailTabPage).componentInstance;
  }

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(null);
    activeRole = signal<RoleCode | null>(null);
    legacyRol = '';
    await TestBed.configureTestingModule({
      imports: [ProtocolDetailTabPage],
      providers: [
        {
          provide: ProtocolWorkspaceService,
          useValue: { protocol: protocolSignal, evaluations: signal([]) },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole } },
        {
          provide: AuthFacade,
          useValue: { currentUser: () => ({ rol: legacyRol }) },
        },
        {
          provide: AuditUseCase,
          useValue: {
            getProtocolTrail: jasmine.createSpy('getProtocolTrail').and.returnValue(of([])),
          },
        },
      ],
    })
      .overrideComponent(ProtocolDetailTabPage, { set: { template: '' } })
      .compileComponents();
  });

  function setStatus(status: string): void {
    protocolSignal.set({
      id: '5',
      title: 'Estudio de prueba del investigador',
      investigatorId: '30',
      status,
      type: 'INVESTIGACION',
      documents: [],
      version: 1,
    } as unknown as ProtocolEntity);
  }

  it('rol INVESTIGADOR y BORRADOR devuelve isEditable false sin distinguir mayusculas', () => {
    // Dato de prueba (cuenta que no existe): campo antiguo SECRETARIA, rol activo INVESTIGADOR.
    create('INVESTIGADOR', 'SECRETARIA');
    setStatus('BORRADOR');
    expect(page.isEditable()).toBeFalse();

    setStatus('borrador');
    expect(page.isEditable()).toBeFalse();
  });

  it('rol INVESTIGADOR y INCOMPLETO conserva isEditable true', () => {
    // Dato de prueba (cuenta que no existe): campo antiguo SECRETARIA, rol activo INVESTIGADOR.
    create('INVESTIGADOR', 'SECRETARIA');
    setStatus('INCOMPLETO');
    expect(page.isEditable()).toBeTrue();
  });

  it('con SECRETARIA activa no hay Editar aunque el estado lo abra (D17 (3))', () => {
    // Dato de prueba (cuenta que no existe): campo antiguo INVESTIGADOR, rol activo SECRETARIA.
    create('SECRETARIA', 'INVESTIGADOR');
    setStatus('INCOMPLETO');
    expect(page.isEditable()).toBeFalse();
  });

  it('con PRESIDENTE activo (cuenta PRESIDENTE + EVALUADOR) no hay Editar (D17 (3))', () => {
    create('PRESIDENTE', 'EVALUADOR');
    setStatus('INCOMPLETO');
    expect(page.isEditable()).toBeFalse();
  });
});

/**
 * F10 S-1g (D14, EARS 28) y S-1e (D17 (2), EARS 43): el Resumen pide las evaluaciones y muestra el
 * cuerpo evaluador solo con el rol activo en `EVALUATOR_PANEL`; un error no se muestra como "sin
 * evaluadores". Plantilla real.
 * Con EVALUADOR activo (también en la cuenta PRESIDENTE + EVALUADOR) el Resumen no se abre: lo
 * prueba `workspace-routes.spec.ts` ("decide con el rol activo entre PRESIDENTE y EVALUADOR").
 */
describe('ProtocolDetailTabPage - cuerpo evaluador (F10 D14 y D17)', () => {
  const ERROR_TEXT = 'No pudimos cargar el cuerpo evaluador.';
  const EMPTY_TEXT = 'No se han asignado evaluadores a este protocolo aún.';

  let workspace: {
    protocol: WritableSignal<ProtocolEntity | null>;
    evaluations: WritableSignal<unknown[]>;
    evaluationsLoading: WritableSignal<boolean>;
    evaluationsError: WritableSignal<boolean>;
    loadEvaluations: jasmine.Spy;
    refreshEvaluations: jasmine.Spy;
  };

  async function render(active: RoleCode, legacyRol: string): Promise<HTMLElement> {
    workspace = {
      protocol: signal<ProtocolEntity | null>({
        id: '5',
        title: 'Estudio de prueba del investigador',
        investigatorId: '30',
        status: 'COMPLETO',
        type: 'INVESTIGACION',
        documents: [],
        version: 1,
      } as unknown as ProtocolEntity),
      evaluations: signal<unknown[]>([]),
      evaluationsLoading: signal(false),
      evaluationsError: signal(false),
      loadEvaluations: jasmine.createSpy('loadEvaluations'),
      refreshEvaluations: jasmine.createSpy('refreshEvaluations'),
    };
    await TestBed.configureTestingModule({
      imports: [ProtocolDetailTabPage],
      providers: [
        provideRouter([]),
        { provide: ProtocolWorkspaceService, useValue: workspace },
        { provide: ActiveRoleFacade, useValue: { activeRole: signal<RoleCode | null>(active) } },
        { provide: AuthFacade, useValue: { currentUser: () => ({ rol: legacyRol }) } },
        {
          provide: AuditUseCase,
          useValue: { getProtocolTrail: jasmine.createSpy('getProtocolTrail').and.returnValue(of([])) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProtocolDetailTabPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('con SECRETARIA activa muestra el cuerpo evaluador y pide las evaluaciones del protocolo abierto', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo INVESTIGADOR, rol activo SECRETARIA.
    const el = await render('SECRETARIA', 'INVESTIGADOR');

    expect(el.querySelector('.evaluators-section')).not.toBeNull();
    expect(workspace.loadEvaluations).toHaveBeenCalledOnceWith('5');
  });

  it('con PRESIDENTE activo muestra el cuerpo evaluador y pide las evaluaciones', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo INVESTIGADOR, rol activo PRESIDENTE.
    const el = await render('PRESIDENTE', 'INVESTIGADOR');

    expect(el.querySelector('.evaluators-section')).not.toBeNull();
    expect(workspace.loadEvaluations).toHaveBeenCalledOnceWith('5');
  });

  it('cuenta PRESIDENTE + EVALUADOR con PRESIDENTE activo ve el cuerpo evaluador aunque el campo antiguo diga EVALUADOR', async () => {
    const el = await render('PRESIDENTE', 'EVALUADOR');

    expect(el.querySelector('.evaluators-section')).not.toBeNull();
    expect(workspace.loadEvaluations).toHaveBeenCalledOnceWith('5');
  });

  it('con INVESTIGADOR activo no muestra el cuerpo evaluador ni pide las evaluaciones', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo SECRETARIA, rol activo INVESTIGADOR.
    const el = await render('INVESTIGADOR', 'SECRETARIA');

    expect(el.querySelector('.evaluators-section')).toBeNull();
    expect(el.textContent).not.toContain('Miembros');
    expect(workspace.loadEvaluations).not.toHaveBeenCalled();
  });

  it('con EVALUADOR activo no muestra el cuerpo evaluador ni pide las evaluaciones', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo PRESIDENTE, rol activo EVALUADOR.
    // EVALUADOR no abre el Resumen (guard D10); la regla del componente también lo deja fuera.
    const el = await render('EVALUADOR', 'PRESIDENTE');

    expect(el.querySelector('.evaluators-section')).toBeNull();
    expect(workspace.loadEvaluations).not.toHaveBeenCalled();
  });

  it('si fallan muestra "No pudimos cargar el cuerpo evaluador." con Reintentar, nunca "No se han asignado…"', async () => {
    const el = await render('SECRETARIA', 'SECRETARIA');
    workspace.evaluationsError.set(true);
    TestBed.tick();

    expect(el.textContent).toContain(ERROR_TEXT);
    expect(el.textContent).not.toContain(EMPTY_TEXT);
    expect(el.textContent).not.toContain('0 Miembros');

    const retry = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Reintentar',
    );
    retry?.click();
    expect(workspace.refreshEvaluations).toHaveBeenCalledTimes(1);
  });

  it('sin error y sin evaluadores muestra "No se han asignado…"; mientras carga, no', async () => {
    const el = await render('SECRETARIA', 'SECRETARIA');

    expect(el.textContent).toContain(EMPTY_TEXT);
    expect(el.textContent).not.toContain(ERROR_TEXT);

    workspace.evaluationsLoading.set(true);
    TestBed.tick();
    expect(el.textContent).not.toContain(EMPTY_TEXT);
    // F10 D15: mientras carga lo dice.
    expect(el.querySelector('app-loading-state')?.textContent).toContain('Cargando el cuerpo evaluador…');
  });
});

/** F10 D12 y D17: las tablas del dominio, contra su copia escrita a mano desde la spec. */
/**
 * F10 D19 (EP1b, EARS 54 y 55): la pestaña Información muestra el investigador principal, el nombre
 * del tipo de estudio y el nivel de riesgo; si faltan, los textos vacíos de la spec. Plantilla real.
 * Datos ficticios.
 */
describe('ProtocolDetailTabPage - datos de Información (F10 D19)', () => {
  const BASE = {
    id: '5',
    title: 'Estudio de prueba del investigador',
    investigatorId: '30',
    status: 'COMPLETO',
    type: '',
    studyTypeCode: 'OBS',
    documents: [],
    version: 1,
  };

  async function render(overrides: Partial<ProtocolEntity>): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [ProtocolDetailTabPage],
      providers: [
        provideRouter([]),
        {
          provide: ProtocolWorkspaceService,
          useValue: {
            protocol: signal<ProtocolEntity | null>({ ...BASE, ...overrides } as ProtocolEntity),
            evaluations: signal([]),
            evaluationsLoading: signal(false),
            evaluationsError: signal(false),
            loadEvaluations: jasmine.createSpy('loadEvaluations'),
            refreshEvaluations: jasmine.createSpy('refreshEvaluations'),
          },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole: signal<RoleCode | null>('INVESTIGADOR') } },
        { provide: AuthFacade, useValue: { currentUser: () => ({ rol: 'INVESTIGADOR' }) } },
        {
          provide: AuditUseCase,
          useValue: { getProtocolTrail: jasmine.createSpy('getProtocolTrail').and.returnValue(of([])) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProtocolDetailTabPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(el: HTMLElement, testId: string): string | undefined {
    return el.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  }

  it('muestra el nombre del investigador principal, el nombre del tipo de estudio y el riesgo', async () => {
    const el = await render({
      principalInvestigator: 'Investigador de prueba',
      studyType: 'Observacional de prueba',
      riskLevel: 'Riesgo mínimo',
    });

    expect(text(el, 'principal-investigator')).toBe('Investigador de prueba');
    expect(text(el, 'study-type')).toBe('Observacional de prueba');
    expect(text(el, 'risk-level')).toBe('Riesgo mínimo');
    expect(el.textContent).not.toContain('OBS');
  });

  it('sin datos usa los textos vacíos de la spec, nunca «Cargando...» ni «[object Object]»', async () => {
    const el = await render({ principalInvestigator: '', studyType: null, riskLevel: null });

    expect(text(el, 'principal-investigator')).toBe('Sin investigador principal');
    expect(text(el, 'study-type')).toBe('Sin tipo de estudio');
    expect(text(el, 'risk-level')).toBe('Sin fijar');
    expect(el.textContent).not.toContain('Cargando...');
    expect(el.textContent).not.toContain('[object Object]');
  });

  it('el nivel de riesgo se muestra siempre, aunque no haya otros detalles adicionales', async () => {
    const el = await render({ riskLevel: undefined });

    expect(text(el, 'risk-level')).toBe('Sin fijar');
  });
});

describe('Tablas de roles del espacio del protocolo (F10 D12, D17 y D20)', () => {
  const EXPECTED_SECTION_ROLES: Record<WorkspaceSection, RoleCode[]> = {
    EVALUATOR_PANEL: ['SECRETARIA', 'PRESIDENTE'],
  };
  const EXPECTED_ACTION_ROLES: Record<WorkspaceAction, RoleCode[]> = {
    EDIT_PROTOCOL: ['INVESTIGADOR'],
    VALIDATE_ALL: ['SECRETARIA'],
    // F10 D20 (2): solo la Presidenta asigna (TSK-002-N52).
    ASSIGN_EVALUATORS: ['PRESIDENTE'],
    SUBMIT_CORRECTIONS: ['INVESTIGADOR'],
  };

  it('WORKSPACE_SECTION_ROLES es la de D17 (2): el cuerpo evaluador solo con SECRETARIA y PRESIDENTE', () => {
    expect(WORKSPACE_SECTION_ROLES).toEqual(EXPECTED_SECTION_ROLES);
  });

  it('WORKSPACE_ACTION_ROLES es la de D12, D17 (4) y D20 (2)', () => {
    expect(WORKSPACE_ACTION_ROLES).toEqual(EXPECTED_ACTION_ROLES);
  });
});

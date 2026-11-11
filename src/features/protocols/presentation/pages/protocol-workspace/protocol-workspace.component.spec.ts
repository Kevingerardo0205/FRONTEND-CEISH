import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { ProtocolWorkspaceComponent } from './protocol-workspace.component';
import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { Role, RoleCode } from '@domain/value-objects/role.vo';

const PROTOCOL_TITLE = 'Estudio de prueba del investigador';

/** Estados que abren alguna acción de la cabecera (EDIT_PROTOCOL, VALIDATE_ALL, ASSIGN_EVALUATORS). */
const ACTION_STATUSES = [
  ProtocolStatus.EN_REVISION_SECRETARIA,
  ProtocolStatus.COMPLETO,
  ProtocolStatus.INCOMPLETO,
];

function createProtocol(status: string, isTimelineTermsAccepted = false): ProtocolEntity {
  return {
    id: '5',
    title: PROTOCOL_TITLE,
    investigatorId: '30',
    status,
    type: 'INVESTIGACION',
    documents: [],
    version: 1,
    isTimelineTermsAccepted,
  } as unknown as ProtocolEntity;
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
    const workspace = {
      protocol: protocolSignal,
      evaluations: signal([]),
      loadProtocol: jasmine.createSpy('loadProtocol').and.returnValue(of(null)),
      updateProtocol: jasmine.createSpy('updateProtocol'),
    };

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

  function setStatus(status: string): void {
    protocolSignal.set(createProtocol(status));
  }

  function tabPaths(): string[] {
    return page.tabConfig().map((tab) => tab.path);
  }

  function actionIds(): string[] {
    return page.contextualActions().map((action) => action.id);
  }

  it('INVESTIGADOR con BORRADOR no recibe EDIT_PROTOCOL incluso con distinto uso de mayusculas', () => {
    setStatus('BORRADOR');
    expect(actionIds()).toEqual([]);

    setStatus('borrador');
    expect(actionIds()).toEqual([]);
  });

  it('INVESTIGADOR con INCOMPLETO conserva EDIT_PROTOCOL', () => {
    setStatus('INCOMPLETO');
    expect(actionIds()).toEqual(['EDIT_PROTOCOL']);
  });

  it('SECRETARIA ve las pestañas y acciones permitidas en cada estado', () => {
    activeRoleSignal.set('SECRETARIA');

    setStatus(ProtocolStatus.EN_REVISION_SECRETARIA);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['VALIDATE_ALL']);

    setStatus(ProtocolStatus.COMPLETO);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['ASSIGN_EVALUATORS']);

    setStatus(ProtocolStatus.INCOMPLETO);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['ASSIGN_EVALUATORS']);

    setStatus(ProtocolStatus.EN_EVALUACION);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual([]);

    setStatus(ProtocolStatus.APPROVED);
    expect(tabPaths()).toEqual(['info', 'validation', 'follow-up']);
    expect(actionIds()).toEqual([]);
  });

  it('PRESIDENTE ve Resumen y Seguimiento aprobado, sin Evaluación ni acciones', () => {
    activeRoleSignal.set('PRESIDENTE');

    setStatus(ProtocolStatus.APPROVED);
    expect(tabPaths()).toEqual(['info', 'follow-up']);
    expect(actionIds()).toEqual([]);

    for (const status of [
      ProtocolStatus.EN_REVISION_SECRETARIA,
      ProtocolStatus.COMPLETO,
      ProtocolStatus.INCOMPLETO,
    ]) {
      setStatus(status);
      expect(tabPaths()).toEqual(['info']);
      expect(actionIds()).toEqual([]);
    }
  });

  it('EVALUADOR no ve ninguna pestaña del espacio, ni acciones ni ventana de aceptación', () => {
    activeRoleSignal.set('EVALUADOR');

    setStatus(ProtocolStatus.EN_EVALUACION);
    expect(tabPaths()).toEqual([]);
    expect(actionIds()).toEqual([]);

    setStatus(ProtocolStatus.APPROVED);
    expect(tabPaths()).toEqual([]);
    expect(actionIds()).toEqual([]);

    for (const status of ACTION_STATUSES) {
      setStatus(status);
      expect(actionIds()).toEqual([]);
    }

    setStatus(ProtocolStatus.COMPLETO);
    expect(page.showAcceptanceModal()).toBeFalse();
  });

  it('INVESTIGADOR ve Resumen, Validación y Seguimiento aprobado; completa INCOMPLETO y acepta tiempos en COMPLETO', () => {
    activeRoleSignal.set('INVESTIGADOR');

    setStatus(ProtocolStatus.APPROVED);
    expect(tabPaths()).toEqual(['info', 'validation', 'follow-up']);
    expect(actionIds()).toEqual([]);

    setStatus(ProtocolStatus.INCOMPLETO);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual(['EDIT_PROTOCOL']);

    setStatus(ProtocolStatus.COMPLETO);
    expect(tabPaths()).toEqual(['info', 'validation']);
    expect(actionIds()).toEqual([]);
    expect(page.showAcceptanceModal()).toBeTrue();

    setStatus(ProtocolStatus.EN_REVISION_SECRETARIA);
    expect(actionIds()).toEqual([]);
  });

  it('PRESIDENTE y EVALUADOR con EVALUADOR activo no ven ninguna pestaña ni acciones', () => {
    currentUserRoles = ['PRESIDENTE', 'EVALUADOR'];
    currentUserRol = 'PRESIDENTE';
    activeRoleSignal.set('EVALUADOR');

    setStatus(ProtocolStatus.APPROVED);
    expect(tabPaths()).toEqual([]);
    expect(actionIds()).toEqual([]);

    for (const status of ACTION_STATUSES) {
      setStatus(status);
      expect(tabPaths()).toEqual([]);
      expect(actionIds()).toEqual([]);
    }
  });

  it('INVESTIGADOR y EVALUADOR siguen solo el rol activo y cambian acciones y ventana al cambiarlo', () => {
    currentUserRoles = ['INVESTIGADOR', 'EVALUADOR'];
    currentUserRol = 'INVESTIGADOR';
    activeRoleSignal.set('EVALUADOR');

    setStatus(ProtocolStatus.INCOMPLETO);
    expect(actionIds()).toEqual([]);

    setStatus(ProtocolStatus.COMPLETO);
    expect(page.showAcceptanceModal()).toBeFalse();

    activeRoleSignal.set('INVESTIGADOR');
    setStatus(ProtocolStatus.INCOMPLETO);
    expect(actionIds()).toEqual(['EDIT_PROTOCOL']);

    setStatus(ProtocolStatus.COMPLETO);
    expect(page.showAcceptanceModal()).toBeTrue();
  });
});

describe('ProtocolWorkspaceComponent - sin pestaña Evaluación (F10 D11, S-1c)', () => {
  it('ningún rol activo ve la pestaña Evaluación en ningún estado', async () => {
    const protocolSignal = signal<ProtocolEntity | null>(null);
    const activeRoleSignal = signal<RoleCode | null>(null);
    const workspace = {
      protocol: protocolSignal,
      evaluations: signal([]),
      loadProtocol: jasmine.createSpy('loadProtocol').and.returnValue(of(null)),
      updateProtocol: jasmine.createSpy('updateProtocol'),
    };
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
      for (const status of Object.values(ProtocolStatus)) {
        protocolSignal.set(createProtocol(status));
        expect(page.tabConfig().map((tab) => tab.path))
          .withContext(role.code + ' con ' + status)
          .not.toContain('evaluation');
      }
    }
  });
});

describe('ProtocolWorkspaceComponent - template real', () => {
  let protocolSignal: WritableSignal<ProtocolEntity | null>;
  let activeRoleSignal: WritableSignal<RoleCode | null>;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(createProtocol(ProtocolStatus.COMPLETO));
    activeRoleSignal = signal<RoleCode | null>('SECRETARIA');
    const workspace = {
      protocol: protocolSignal,
      evaluations: signal([]),
      loadProtocol: jasmine.createSpy('loadProtocol').and.returnValue(of(null)),
      updateProtocol: jasmine.createSpy('updateProtocol'),
    };

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
});

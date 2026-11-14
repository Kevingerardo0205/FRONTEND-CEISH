import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';

import { ProtocolDetailTabPage } from './protocol-detail-tab.component';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';

describe('ProtocolDetailTabPage - edicion de protocolo', () => {
  let page: ProtocolDetailTabPage;
  let protocolSignal: WritableSignal<ProtocolEntity | null>;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(null);
    await TestBed.configureTestingModule({
      imports: [ProtocolDetailTabPage],
      providers: [
        {
          provide: ProtocolWorkspaceService,
          useValue: { protocol: protocolSignal, evaluations: signal([]) },
        },
        {
          provide: AuthFacade,
          useValue: { currentUser: () => ({ rol: 'INVESTIGADOR' }) },
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

    page = TestBed.createComponent(ProtocolDetailTabPage).componentInstance;
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
    setStatus('BORRADOR');
    expect(page.isEditable()).toBeFalse();

    setStatus('borrador');
    expect(page.isEditable()).toBeFalse();
  });

  it('rol INVESTIGADOR y INCOMPLETO conserva isEditable true', () => {
    setStatus('INCOMPLETO');
    expect(page.isEditable()).toBeTrue();
  });
});

/**
 * F10 S-1g (D14, EARS 28): el Resumen pide las evaluaciones solo cuando muestra el cuerpo
 * evaluador (`showEvaluators()`, con `currentUser().rol` hasta S-1e) y un error no se muestra
 * como "sin evaluadores". Plantilla real.
 */
describe('ProtocolDetailTabPage - cuerpo evaluador (F10 D14, S-1g)', () => {
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

  async function render(rol: string): Promise<HTMLElement> {
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
        { provide: AuthFacade, useValue: { currentUser: () => ({ rol }) } },
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

  it('con SECRETARIA pide las evaluaciones del protocolo abierto', async () => {
    await render('SECRETARIA');

    expect(workspace.loadEvaluations).toHaveBeenCalledOnceWith('5');
  });

  it('con INVESTIGADOR no pide las evaluaciones', async () => {
    await render('INVESTIGADOR');

    expect(workspace.loadEvaluations).not.toHaveBeenCalled();
  });

  it('si fallan muestra "No pudimos cargar el cuerpo evaluador." con Reintentar, nunca "No se han asignado…"', async () => {
    const el = await render('SECRETARIA');
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
    const el = await render('SECRETARIA');

    expect(el.textContent).toContain(EMPTY_TEXT);
    expect(el.textContent).not.toContain(ERROR_TEXT);

    workspace.evaluationsLoading.set(true);
    TestBed.tick();
    expect(el.textContent).not.toContain(EMPTY_TEXT);
    // F10 D15: mientras carga lo dice.
    expect(el.querySelector('app-loading-state')?.textContent).toContain('Cargando el cuerpo evaluador…');
  });
});


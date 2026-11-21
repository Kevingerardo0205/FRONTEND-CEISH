import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ProtocolValidationDetailPage } from './protocol-validation-detail.page';
import { LoadValidationDetailUseCase } from '../../../application/use-cases/load-validation-detail.use-case';
import { ValidateChecklistItemUseCase } from '../../../application/use-cases/validate-checklist-item.use-case';
import { FinalizeDocumentaryValidationUseCase } from '../../../application/use-cases/finalize-documentary-validation.use-case';
import { DownloadProtocolDocumentUseCase } from '../../../application/use-cases/download-protocol-document.use-case';
import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';
import { ValidationDetailResponse } from '@domain/entities/protocol.entity';
import { RoleCode } from '@domain/value-objects/role.vo';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';

/**
 * F10 S-1e (D17 (4), EARS 45): la pestaña Validación del espacio elige la vista con el rol activo
 * (`WORKSPACE_ACTION_ROLES.SUBMIT_CORRECTIONS`). Plantilla real, dentro del espacio.
 *
 * Dato de prueba: el campo antiguo `currentUser().rol` lleva un rol distinto del rol activo, solo
 * para asegurar que se usa el rol activo (si el código volviera a `.rol`, la prueba fallaría).
 * Esas cuentas no existen: el rol INVESTIGADOR es exclusivo (D17 (1)). La página ya no usa
 * `AuthFacade`; el simulado se da para que una vuelta a `.rol` falle por la comprobación y no por
 * el inyector.
 * EVALUADOR no abre la pestaña (guard D10, `workspace-routes.spec.ts`); PRESIDENTE la abre en
 * solo lectura desde F11 EP2 (bloque de abajo).
 */
describe('ProtocolValidationDetailPage - vista por rol activo (F10 D17)', () => {
  const SECRETARIA_ACTION = 'NOTIFICAR OBSERVACIONES AL INVESTIGADOR';
  const INVESTIGADOR_ACTION = 'ENVIAR SUBSANACIÓN';

  const DETAIL: ValidationDetailResponse = {
    header: {
      id: 5,
      ceishCode: 'TRÁMITE EN PROCESO',
      title: 'Estudio de prueba del investigador',
      submissionDate: '2026-11-10',
      investigator: 'Usuario Prueba',
      studyType: 'INVESTIGACION',
    },
    checklist: [
      {
        id: 1,
        code: 'DOC_1',
        name: 'Documento de prueba',
        status: 'RECHAZADO',
        observations: 'Falta la firma',
        attachedDocument: null,
      },
    ],
    globalStatus: {
      isComplete: false,
      status: 'REQUIERE_SUBSANACION_DOC',
      hasMissingItems: true,
      missingItemsList: 'Documento de prueba',
      submissionDeadline: null,
    },
  };

  async function render(
    active: RoleCode,
    legacyRol: string,
    status = 'REQUIERE_SUBSANACION_DOC',
  ): Promise<{ page: ProtocolValidationDetailPage; el: HTMLElement }> {
    await TestBed.configureTestingModule({
      imports: [ProtocolValidationDetailPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '5' } }, parent: null } },
        {
          provide: LoadValidationDetailUseCase,
          useValue: { execute: jasmine.createSpy('execute').and.returnValue(of(DETAIL)) },
        },
        { provide: ValidateChecklistItemUseCase, useValue: {} },
        { provide: FinalizeDocumentaryValidationUseCase, useValue: {} },
        { provide: DownloadProtocolDocumentUseCase, useValue: {} },
        { provide: S3StorageService, useValue: {} },
        { provide: ProtocoloService, useValue: {} },
        {
          provide: ProtocolWorkspaceService,
          useValue: { protocol: signal({ id: '5', status }) },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole: signal<RoleCode | null>(active) } },
        { provide: AuthFacade, useValue: { currentUser: () => ({ rol: legacyRol }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProtocolValidationDetailPage);
    fixture.detectChanges();
    return { page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('con SECRETARIA activa muestra la vista de la Secretaría, sin "Enviar subsanación"', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo INVESTIGADOR, rol activo SECRETARIA.
    const { page, el } = await render('SECRETARIA', 'INVESTIGADOR');

    expect(page.isInvestigador()).toBeFalse();
    expect(el.textContent).toContain(SECRETARIA_ACTION);
    expect(el.textContent).not.toContain(INVESTIGADOR_ACTION);
  });

  it('con INVESTIGADOR activo y el protocolo por subsanar muestra "Enviar subsanación", sin la acción de la Secretaría', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo SECRETARIA, rol activo INVESTIGADOR.
    const { page, el } = await render('INVESTIGADOR', 'SECRETARIA');

    expect(page.isInvestigador()).toBeTrue();
    expect(page.isSubsanacionMode()).toBeTrue();
    expect(el.textContent).toContain(INVESTIGADOR_ACTION);
    expect(el.textContent).not.toContain(SECRETARIA_ACTION);
  });

  it('con INVESTIGADOR activo y el protocolo en evaluación queda solo lectura, sin ninguna de las dos acciones', async () => {
    // Dato de prueba (cuenta que no existe): campo antiguo SECRETARIA, rol activo INVESTIGADOR.
    const { page, el } = await render('INVESTIGADOR', 'SECRETARIA', 'EN_EVALUACION');

    expect(page.isReadOnlyMode()).toBeTrue();
    expect(el.textContent).not.toContain(INVESTIGADOR_ACTION);
    expect(el.textContent).not.toContain(SECRETARIA_ACTION);
  });

  for (const active of ['PRESIDENTE', 'EVALUADOR'] as RoleCode[]) {
    it(`con ${active} activo no da la vista de subsanación`, async () => {
      // Dato de prueba (cuenta que no existe): campo antiguo INVESTIGADOR.
      const { page } = await render(active, 'INVESTIGADOR');

      expect(page.isInvestigador()).toBeFalse();
      expect(page.isSubsanacionMode()).toBeFalse();
    });
  }
});

/**
 * F11 EP2 (spec-ui §4, EARS F11-2 a F11-7): con PRESIDENTE activa la pestaña Validación es de solo
 * lectura; con la recepción ya validada (`isFinalized`) el cuadro de observaciones generales de la
 * SECRETARIA queda deshabilitado (V9). Plantilla real, dentro del espacio. Datos de prueba ficticios.
 */
describe('ProtocolValidationDetailPage - solo lectura de la PRESIDENTE (F11 EP2)', () => {
  const GENERAL_OBSERVATIONS = 'Falta la firma del tutor en el anexo de prueba';

  function detail(finalized: boolean): ValidationDetailResponse {
    return {
      header: {
        id: 7,
        ceishCode: finalized ? 'CEISH-PRUEBA-001' : 'CEISH-PRUEBA-002',
        title: 'Estudio de prueba para la lectura',
        submissionDate: '2026-11-10',
        investigator: 'Usuario Prueba',
        studyType: 'INVESTIGACION',
      },
      checklist: [
        {
          id: 11,
          code: 'DOC_1',
          name: 'Documento de prueba',
          status: finalized ? 'APROBADO' : 'RECHAZADO',
          observations: finalized ? null : 'Página ilegible',
          attachedDocument: {
            id: 99,
            fileName: 'documento-prueba.pdf',
            path: 'protocols/7/documento-prueba.pdf',
            isValidated: finalized,
            uploadedAt: '2026-11-10',
            originalPageCount: 4,
            pageCount: 3,
          },
        },
      ],
      globalStatus: {
        isComplete: finalized,
        status: finalized ? 'COMPLETO' : 'EN_REVISION_SECRETARIA',
        hasMissingItems: !finalized,
        missingItemsList: GENERAL_OBSERVATIONS,
        submissionDeadline: null,
      },
    };
  }

  let validateItem: jasmine.Spy;
  let finalize: jasmine.Spy;
  let downloadUrl: jasmine.Spy;

  async function render(
    active: RoleCode,
    finalized: boolean,
  ): Promise<{ page: ProtocolValidationDetailPage; el: HTMLElement }> {
    validateItem = jasmine.createSpy('validateItem').and.returnValue(of({}));
    finalize = jasmine.createSpy('finalize').and.returnValue(of({}));
    downloadUrl = jasmine
      .createSpy('getDocumentDownloadUrl')
      .and.returnValue(of({ downloadUrl: 'https://ejemplo.invalid/documento-prueba.pdf' }));
    const status = finalized ? 'COMPLETO' : 'EN_REVISION_SECRETARIA';
    await TestBed.configureTestingModule({
      imports: [ProtocolValidationDetailPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '7' } }, parent: null } },
        {
          provide: LoadValidationDetailUseCase,
          useValue: { execute: jasmine.createSpy('execute').and.returnValue(of(detail(finalized))) },
        },
        { provide: ValidateChecklistItemUseCase, useValue: { execute: validateItem } },
        { provide: FinalizeDocumentaryValidationUseCase, useValue: { execute: finalize } },
        { provide: DownloadProtocolDocumentUseCase, useValue: {} },
        { provide: S3StorageService, useValue: { getDocumentDownloadUrl: downloadUrl } },
        { provide: ProtocoloService, useValue: {} },
        {
          provide: ProtocolWorkspaceService,
          useValue: { protocol: signal({ id: '7', status }) },
        },
        { provide: ActiveRoleFacade, useValue: { activeRole: signal<RoleCode | null>(active) } },
        { provide: AuthFacade, useValue: { currentUser: () => ({ rol: active }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProtocolValidationDetailPage);
    fixture.detectChanges();
    // El `[disabled]` de ngModel se aplica después de un ciclo.
    await fixture.whenStable();
    fixture.detectChanges();
    return { page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  for (const finalized of [false, true]) {
    const label = finalized ? 'con la recepción validada' : 'en revisión de la Secretaría';

    it(`PRESIDENTE ${label}: sin Aprobar ni Rechazar ni campos de páginas u observación (F11-2)`, async () => {
      const { el } = await render('PRESIDENTE', finalized);

      expect(el.querySelectorAll('.btn-group-validation').length).toBe(0);
      expect(el.querySelectorAll('input.pages-input').length).toBe(0);
      expect(el.querySelectorAll('input.mini-input').length).toBe(0);
    });

    it(`PRESIDENTE ${label}: sin el cuadro de observaciones generales (F11-2)`, async () => {
      const { el } = await render('PRESIDENTE', finalized);

      expect(el.querySelectorAll('textarea').length).toBe(0);
    });

    it(`PRESIDENTE ${label}: sin Finalizar, sin constancia y sin aviso legal (F11-2, V8)`, async () => {
      const { el } = await render('PRESIDENTE', finalized);

      expect(el.querySelectorAll('.btn-finalize').length).toBe(0);
      expect(el.querySelectorAll('.btn-cert').length).toBe(0);
      expect(el.querySelectorAll('.legal-disclaimer').length).toBe(0);
    });

    it(`PRESIDENTE ${label}: ve estado, páginas, observaciones y progreso en lectura (F11-3)`, async () => {
      const { page, el } = await render('PRESIDENTE', finalized);

      expect(page.canValidate()).toBeFalse();
      expect(page.isReadOnlyMode()).toBeTrue();
      const badge = el.querySelector('.badge-status-simple');
      expect(badge?.textContent?.trim()).toBe(finalized ? 'APROBADO' : 'RECHAZADO');
      expect(el.textContent).toContain('Decl: 4');
      expect(el.textContent).toContain('Validadas: 3');
      expect(el.textContent).toContain('Observaciones de la Secretaría');
      expect(el.textContent).toContain(GENERAL_OBSERVATIONS);
      expect(el.querySelector('.progress-container')?.textContent).toContain(
        'Progreso de validación',
      );
      if (!finalized) {
        expect(el.querySelector('.observations-display-box')?.textContent).toContain(
          'Página ilegible',
        );
      }
    });
  }

  it('PRESIDENTE abre el documento con «Ver documento cargado» (F11-4)', async () => {
    const open = spyOn(window, 'open');
    const { el } = await render('PRESIDENTE', false);

    const button = el.querySelector<HTMLButtonElement>('td button[mat-icon-button]');
    button?.click();

    expect(downloadUrl).toHaveBeenCalledOnceWith(99);
    expect(open).toHaveBeenCalledOnceWith('https://ejemplo.invalid/documento-prueba.pdf', '_blank');
  });

  it('PRESIDENTE: validar, cambiar páginas y finalizar no llaman al backend (F11-5)', async () => {
    const { page } = await render('PRESIDENTE', false);
    const item = page.checklist()[0];

    page.onValidateItem(item, 1);
    page.onChangePageCount(item);
    page.onFinalize();

    expect(validateItem).not.toHaveBeenCalled();
    expect(finalize).not.toHaveBeenCalled();
  });

  it('SECRETARIA con la recepción validada: el cuadro de observaciones generales está deshabilitado (F11-6, V9)', async () => {
    const { page, el } = await render('SECRETARIA', true);

    expect(page.isFinalized()).toBeTrue();
    expect(el.querySelector('textarea')?.disabled).toBeTrue();
  });

  it('SECRETARIA en revisión: conserva el cuadro editable y sus controles (F11-7)', async () => {
    const { page, el } = await render('SECRETARIA', false);

    expect(page.canValidate()).toBeTrue();
    expect(el.querySelector('textarea')?.disabled).toBeFalse();
    expect(el.querySelectorAll('.btn-group-validation').length).toBe(1);
    expect(el.querySelectorAll('.btn-finalize').length).toBe(1);
    expect(el.querySelectorAll('.btn-cert').length).toBe(1);
  });
});

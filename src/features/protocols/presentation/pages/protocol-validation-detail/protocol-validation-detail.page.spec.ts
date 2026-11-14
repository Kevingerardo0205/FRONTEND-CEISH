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
 * PRESIDENTE y EVALUADOR no abren la pestaña (guard D10, `workspace-routes.spec.ts`).
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

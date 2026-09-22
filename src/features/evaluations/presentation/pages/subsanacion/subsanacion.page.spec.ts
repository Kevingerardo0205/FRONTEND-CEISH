import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubsanacionPage } from './subsanacion.page';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { RequirementStatus, ChecklistRequirement } from '@features/investigador/domain/dtos/crear-protocolo.dto';

describe('SubsanacionPage', () => {
  let component: SubsanacionPage;
  let fixture: ComponentFixture<SubsanacionPage>;

  let mockRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockEvalRepo: jasmine.SpyObj<IEvaluationRepositoryPort>;
  let mockProtocolRepo: jasmine.SpyObj<IProtocolRepositoryPort>;
  let mockDocumentRepo: jasmine.SpyObj<IDocumentRepositoryPort>;
  let mockResolutionRepo: jasmine.SpyObj<IResolutionRepositoryPort>;
  let mockProtocoloService: jasmine.SpyObj<ProtocoloService>;
  let mockS3StorageService: jasmine.SpyObj<S3StorageService>;

  beforeEach(async () => {
    mockRoute = {
      queryParams: of({ protocolId: '123' })
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['currentUser', 'hasRole', 'hasAnyRole']);
    mockEvalRepo = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getProtocolObservations']);
    mockProtocolRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getDocumentHistory', 'getReceptionProtocols']);
    
    // Evitar pasar array vacío a createSpyObj
    mockDocumentRepo = jasmine.createSpyObj('IDocumentRepositoryPort', ['downloadDocument']);
    mockResolutionRepo = jasmine.createSpyObj('IResolutionRepositoryPort', ['getResolutionByProtocolId']);
    
    mockProtocoloService = jasmine.createSpyObj('ProtocoloService', ['obtenerProtocolo', 'getChecklist', 'subirDocumento', 'finalizarProtocolo', 'misProtocolosSubsanar']);
    mockS3StorageService = jasmine.createSpyObj('S3StorageService', ['getDocumentDownloadUrl']);

    mockAuthFacade.currentUser.and.returnValue({ id: 1, email: 'inv@test.com', rol: 'INVESTIGADOR' } as any);
    mockAuthFacade.hasRole.and.returnValue(true);
    mockProtocoloService.obtenerProtocolo.and.returnValue(of({
      id: 123,
      codigoCeish: 'CEISH-123',
      titulo: 'Test Protocol',
      estado: 'EVALUACION_SUBSANACIONES',
      investigadorPrincipal: 'Juan Perez'
    } as any));
    mockEvalRepo.getProtocolObservations.and.returnValue(of([]));
    mockProtocoloService.getChecklist.and.returnValue(of([]));
    mockProtocolRepo.getDocumentHistory.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SubsanacionPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: IEvaluationRepositoryPort, useValue: mockEvalRepo },
        { provide: IProtocolRepositoryPort, useValue: mockProtocolRepo },
        { provide: IDocumentRepositoryPort, useValue: mockDocumentRepo },
        { provide: IResolutionRepositoryPort, useValue: mockResolutionRepo },
        { provide: ProtocoloService, useValue: mockProtocoloService },
        { provide: S3StorageService, useValue: mockS3StorageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubsanacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Lógica de Bloqueo de Requisitos (Fase 5)', () => {
    it('debe bloquear requisitos APROBADO, VALIDADO y NO_APLICA', () => {
      const reqAprobado: ChecklistRequirement = { id: 1, requirementCode: 'REQ-01', requirementName: 'Req 1', status: RequirementStatus.APROBADO };
      const reqValidado: ChecklistRequirement = { id: 2, requirementCode: 'REQ-02', requirementName: 'Req 2', status: RequirementStatus.VALIDADO };
      const reqNoAplica: ChecklistRequirement = { id: 3, requirementCode: 'REQ-03', requirementName: 'Req 3', status: RequirementStatus.NO_APLICA };

      expect(component.isRequirementLocked(reqAprobado)).toBeTrue();
      expect(component.isRequirementLocked(reqValidado)).toBeTrue();
      expect(component.isRequirementLocked(reqNoAplica)).toBeTrue();
    });

    it('debe permitir carga en requisitos NO_PRESENTADO', () => {
      const reqNoPresentado: ChecklistRequirement = { id: 4, requirementCode: 'REQ-04', requirementName: 'Req 4', status: RequirementStatus.NO_PRESENTADO };
      expect(component.isRequirementLocked(reqNoPresentado)).toBeFalse();
    });

    it('debe bloquear requisito PRESENTADO si ya tiene un archivo físico en el expediente', () => {
      const reqPresentado: ChecklistRequirement = { id: 5, requirementCode: 'REQ-05', requirementName: 'Req 5', status: RequirementStatus.PRESENTADO };
      
      component.protocolDocuments.set([
        { id: 999, name: 'file.pdf', path: 'protocols/123/requirements/5/file.pdf', type: 'REQ-05' }
      ]);

      expect(component.isRequirementLocked(reqPresentado)).toBeTrue();
    });

    it('debe permitir carga en requisito PRESENTADO si NO tiene archivo en el expediente', () => {
      const reqPresentado: ChecklistRequirement = { id: 5, requirementCode: 'REQ-05', requirementName: 'Req 5', status: RequirementStatus.PRESENTADO };
      
      component.protocolDocuments.set([]);

      expect(component.isRequirementLocked(reqPresentado)).toBeFalse();
    });
  });

  describe('Cálculo de Pendientes y Validación de Envío (Fase 5)', () => {
    it('debe calcular correctamente los pendientes excluyendo los bloqueados y NO_APLICA', () => {
      component.checklist.set([
        { id: 1, requirementCode: 'REQ-01', requirementName: 'Req 1', status: RequirementStatus.APROBADO },
        { id: 2, requirementCode: 'REQ-02', requirementName: 'Req 2', status: RequirementStatus.NO_APLICA },
        { id: 3, requirementCode: 'REQ-03', requirementName: 'Req 3', status: RequirementStatus.NO_PRESENTADO },
        { id: 4, requirementCode: 'REQ-04', requirementName: 'Req 4', status: RequirementStatus.PRESENTADO }
      ]);
      component.protocolDocuments.set([]);

      expect(component.pendingRequirementsCount()).toBe(2);
      expect(component.isReadyToSubmit()).toBeFalse();
    });

    it('debe habilitar el envío cuando todos los pendientes sean cargados', () => {
      component.checklist.set([
        { id: 1, requirementCode: 'REQ-01', requirementName: 'Req 1', status: RequirementStatus.APROBADO },
        { id: 2, requirementCode: 'REQ-02', requirementName: 'Req 2', status: RequirementStatus.PRESENTADO }
      ]);
      
      component.protocolDocuments.set([
        { id: 999, name: 'document.pdf', path: 'protocols/123/requirements/2/document.pdf', type: 'REQ-02' }
      ]);

      expect(component.pendingRequirementsCount()).toBe(0);
      expect(component.isReadyToSubmit()).toBeTrue();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AiAssistantAdminPage } from './ai-assistant-admin.page';
import { IAiAssistantAdminRepositoryPort } from '@domain/ports/IAiAssistantAdminRepositoryPort';
import { AiAssistantSharedService } from '@shared/components/ai-assistant/ai-assistant-shared.service';

describe('AiAssistantAdminPage', () => {
  let component: AiAssistantAdminPage;
  let fixture: ComponentFixture<AiAssistantAdminPage>;
  let mockAdminRepo: jasmine.SpyObj<IAiAssistantAdminRepositoryPort>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let sharedService: AiAssistantSharedService;

  beforeEach(async () => {
    mockAdminRepo = jasmine.createSpyObj<IAiAssistantAdminRepositoryPort>('IAiAssistantAdminRepositoryPort', [
      'getConfig',
      'uploadPet',
      'updateRoles'
    ]);
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    mockAdminRepo.getConfig.and.returnValue(of({
      petFileName: 'Reglamento_PET_2026.pdf',
      allowedRoles: ['ADMIN_TI', 'PRESIDENTE'],
      updatedAt: new Date('2026-08-15T10:00:00Z')
    }));

    await TestBed.configureTestingModule({
      imports: [
        AiAssistantAdminPage,
        NoopAnimationsModule
      ],
      providers: [
        { provide: IAiAssistantAdminRepositoryPort, useValue: mockAdminRepo },
        { provide: MatSnackBar, useValue: mockSnackBar },
        AiAssistantSharedService
      ]
    }).compileComponents();

    sharedService = TestBed.inject(AiAssistantSharedService);
    spyOn(sharedService, 'clearChat');

    fixture = TestBed.createComponent(AiAssistantAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial config on init', () => {
    expect(component).toBeTruthy();
    expect(component.petFileName()).toBe('Reglamento_PET_2026.pdf');
    expect(component.selectedRoles()).toEqual(['ADMIN_TI', 'PRESIDENTE']);
    expect(mockAdminRepo.getConfig).toHaveBeenCalled();
  });

  it('should toggle role in selectedRoles list', () => {
    // Agregar EVALUADOR
    component.toggleRole('EVALUADOR');
    expect(component.selectedRoles()).toContain('EVALUADOR');

    // Quitar EVALUADOR
    component.toggleRole('EVALUADOR');
    expect(component.selectedRoles()).not.toContain('EVALUADOR');
  });

  it('should upload valid PDF file successfully', () => {
    const dummyFile = new File(['dummy pdf content'], 'Nuevo_PET.pdf', { type: 'application/pdf' });
    mockAdminRepo.uploadPet.and.returnValue(of({
      message: 'PET actualizado',
      petFileName: 'Nuevo_PET.pdf',
      characterCount: 15400
    }));

    component.selectedFile.set(dummyFile);
    component.uploadPdf();

    expect(mockAdminRepo.uploadPet).toHaveBeenCalledWith(dummyFile);
    expect(component.petFileName()).toBe('Nuevo_PET.pdf');
    expect(sharedService.clearChat).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should save roles configuration successfully', () => {
    mockAdminRepo.updateRoles.and.returnValue(of({
      message: 'Roles actualizados',
      allowedRoles: ['ADMIN_TI', 'PRESIDENTE', 'SECRETARIA']
    }));

    component.selectedRoles.set(['ADMIN_TI', 'PRESIDENTE', 'SECRETARIA']);
    component.saveRolesConfig();

    expect(mockAdminRepo.updateRoles).toHaveBeenCalledWith(['ADMIN_TI', 'PRESIDENTE', 'SECRETARIA']);
    expect(sharedService.clearChat).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should reset roles configuration to initial', () => {
    component.selectedRoles.set(['INVESTIGADOR']);
    component.resetRolesConfig();

    expect(component.selectedRoles()).toEqual(['ADMIN_TI', 'PRESIDENTE']);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RoleFormDialogComponent, RoleDialogData } from './role-form-dialog.component';

describe('RoleFormDialogComponent', () => {
  let component: RoleFormDialogComponent;
  let fixture: ComponentFixture<RoleFormDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<RoleFormDialogComponent>>;

  const mockDialogData: RoleDialogData = {
    mode: 'create',
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RoleFormDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse con formulario inválido por defecto en modo creación', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBeFalse();
    expect(component.roleForm.valid).toBeFalse();
  });

  it('debe transformar el código a mayúsculas y guiones bajos en el evento input', () => {
    const inputEvent = { target: { value: 'par evaluador' } } as unknown as Event;
    component.onCodeInput(inputEvent);
    expect(component.roleForm.get('code')?.value).toBe('PAR_EVALUADOR');
  });

  it('debe cerrar el diálogo enviando el payload al enviar un formulario válido', () => {
    component.roleForm.patchValue({
      code: 'AUDITOR_EXTERNO',
      name: 'Auditor Externo',
      description: 'Responsable de auditoría externa',
    });

    expect(component.roleForm.valid).toBeTrue();
    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      code: 'AUDITOR_EXTERNO',
      name: 'Auditor Externo',
      description: 'Responsable de auditoría externa',
    });
  });

  it('debe cerrar sin datos al hacer clic en cancelar', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});

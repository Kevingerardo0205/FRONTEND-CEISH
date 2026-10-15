import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SuspendRoleDialogComponent, SuspendRoleDialogData } from './suspend-role-dialog.component';

describe('SuspendRoleDialogComponent', () => {
  let component: SuspendRoleDialogComponent;
  let fixture: ComponentFixture<SuspendRoleDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SuspendRoleDialogComponent>>;

  const mockData: SuspendRoleDialogData = {
    userId: '43',
    userName: 'Jaime David Camacho',
    roleCode: 'SECRETARIA',
    roleName: 'Secretaria Ejecutiva',
    validUntil: '2026-09-18T23:59:59.000Z'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [SuspendRoleDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SuspendRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar con formulario inválido (motivo requerido)', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBeFalse();
  });

  it('debe permitir sugerir motivos con setReason y habilitar formulario', () => {
    component.setReason('Retorno anticipado de la Secretaria titular a sus funciones');
    expect(component.form.get('reason')?.value).toBe('Retorno anticipado de la Secretaria titular a sus funciones');
    expect(component.form.valid).toBeTrue();
  });

  it('debe cerrar el diálogo retornando el motivo de suspensión al enviar', () => {
    component.form.patchValue({
      reason: 'Retorno anticipado titular'
    });

    component.onSubmit();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      reason: 'Retorno anticipado titular'
    });
  });

  it('debe cerrar el diálogo sin valor al invocar onCancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExtendRoleDialogComponent, ExtendRoleDialogData } from './extend-role-dialog.component';

describe('ExtendRoleDialogComponent', () => {
  let component: ExtendRoleDialogComponent;
  let fixture: ComponentFixture<ExtendRoleDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ExtendRoleDialogComponent>>;

  const mockData: ExtendRoleDialogData = {
    userId: '43',
    userName: 'Jaime David Camacho',
    roleCode: 'SECRETARIA',
    roleName: 'Secretaria Ejecutiva',
    currentValidUntil: '2026-09-18T23:59:59.000Z',
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ExtendRoleDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtendRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar el formulario con fecha futura', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('validUntil')?.value).toBeTruthy();
  });

  it('debe aplicar presets de fecha (+15d, +1m, end_year) correctamente', () => {
    component.applyPreset('15d');
    const val15d = component.form.get('validUntil')?.value;
    expect(val15d).toBeTruthy();

    component.applyPreset('end_year');
    const valEndYear = component.form.get('validUntil')?.value;
    expect(valEndYear).toContain('-12-31');
  });

  it('debe autocompletar el motivo con setReason', () => {
    component.setReason('Prórroga por ampliación de licencia médica');
    expect(component.form.get('reason')?.value).toBe('Prórroga por ampliación de licencia médica');
  });

  it('debe cerrar el diálogo retornando el resultado cuando el formulario es válido', () => {
    component.form.patchValue({
      validUntil: '2026-10-31',
      reason: 'Extensión aprobada por decanato',
    });

    component.onSubmit();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      validUntil: '2026-10-31',
      reason: 'Extensión aprobada por decanato',
    });
  });

  it('debe cerrar el diálogo sin valor al invocar onCancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});

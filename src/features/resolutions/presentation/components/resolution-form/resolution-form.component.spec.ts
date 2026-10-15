import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { ResolutionFormComponent } from './resolution-form.component';

describe('ResolutionFormComponent', () => {
  let component: ResolutionFormComponent;
  let fixture: ComponentFixture<ResolutionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        ResolutionFormComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResolutionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the form component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form for type 1 (approval)', () => {
    component.form.get('resolutionTypeId')?.setValue(1);
    
    // Debería ser inválido por defecto (falta observations)
    expect(component.form.valid).toBeFalse();

    component.form.get('observations')?.setValue('Valido');
    expect(component.form.valid).toBeTrue();
  });

  it('should validate form for type 2 (conditional approval)', () => {
    component.form.get('resolutionTypeId')?.setValue(2);
    
    // Debería requerir majorObservations y correctionProcedure
    expect(component.form.valid).toBeFalse();

    component.form.get('majorObservations')?.setValue('Mayores');
    expect(component.form.valid).toBeFalse();

    component.form.get('correctionProcedure')?.setValue('Procedimiento');
    expect(component.form.valid).toBeTrue();
  });

  it('should validate form for type 3 (rejection) requiring at least 20 chars', () => {
    component.form.get('resolutionTypeId')?.setValue(3);

    // Debería requerir majorObservations
    expect(component.form.valid).toBeFalse();

    component.form.get('majorObservations')?.setValue('Corto');
    expect(component.form.valid).toBeFalse();

    component.form.get('majorObservations')?.setValue('Justificación de rechazo con más de veinte caracteres.');
    expect(component.form.valid).toBeTrue();
  });

  it('should reset form and values correctly', () => {
    component.form.get('resolutionTypeId')?.setValue(2);
    component.form.get('majorObservations')?.setValue('Mayores');
    component.form.get('correctionProcedure')?.setValue('Procedimiento');

    component.resetForm();

    expect(component.form.get('resolutionTypeId')?.value).toBe(1);
    expect(component.form.get('majorObservations')?.value).toBe('');
    expect(component.form.get('observations')?.value).toBe('');
  });

  it('should emit onEmit event when onSubmit is called and form is valid', () => {
    spyOn(component.onEmit, 'emit');

    component.form.get('resolutionTypeId')?.setValue(1);
    component.form.get('observations')?.setValue('Aprobado');
    component.onSubmit();

    expect(component.onEmit.emit).toHaveBeenCalled();
  });
});

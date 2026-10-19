import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ModalReasignacionComponent, ModalReasignacionData, REASSIGN_SUCCESS_MESSAGE } from './modal-reasignacion.component';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ActiveAssignment } from '@domain/entities/peer-evaluation.entity';
import { EvaluationApiAdapter } from '@infrastructure/adapters/evaluation-api.adapter';
import { ACTIVE_ASSIGNMENTS_119_BODY, DASHBOARD_BODY, ERROR_400_BODY } from '../../../testing/reassignment.fixtures';

describe('ModalReasignacionComponent (RF-12.3)', () => {
  let fixture: ComponentFixture<ModalReasignacionComponent>;
  let component: ModalReasignacionComponent;
  let httpMock: HttpTestingController;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ModalReasignacionComponent>>;
  let snackSpy: jasmine.SpyObj<MatSnackBar>;

  const assignments = ACTIVE_ASSIGNMENTS_119_BODY.data.assignments as ActiveAssignment[];
  const ana = assignments[0]; // assignmentId 6, evaluatorId 39, METODOLOGICO

  function setup(outgoing: ActiveAssignment): void {
    const data: ModalReasignacionData = {
      outgoingAssignment: outgoing,
      activeEvaluatorIds: assignments.map(a => a.evaluatorId)
    };
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [ModalReasignacionComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IEvaluationRepositoryPort, useClass: EvaluationApiAdapter },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatSnackBar, useValue: snackSpy }
      ]
    });

    fixture = TestBed.createComponent(ModalReasignacionComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/api/evaluations/evaluators/dashboard').flush(DASHBOARD_BODY);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('para Ana (METODOLOGICO) solo ofrece a Patricio (38): excluye a la saliente, a 40 ya asignada y a los sin perfil', () => {
    setup(ana);
    expect(component.filteredCandidates().map(c => c.id)).toEqual([38]);
    expect(component.unrecognizedProfileCount()).toBe(5);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('5 evaluador(es) del catálogo no tienen un perfil reconocido');
  });

  it('envía el cuerpo real con replacementEvaluatorProfile = perfil del saliente y cierra con éxito', () => {
    setup(ana);
    component.form.setValue({
      newEvaluatorId: 38,
      reason: 'VENCIMIENTO',
      reasonDescription: '  Plazo reglamentario vencido sin entrega.  '
    });

    component.onConfirm();

    const req = httpMock.expectOne('/api/evaluations/reassign');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentAssignmentId: 6,
      replacementEvaluatorId: 38,
      replacementEvaluatorProfile: 'METODOLOGICO',
      reason: 'VENCIMIENTO',
      reasonDescription: 'Plazo reglamentario vencido sin entrega.'
    });
    req.flush({ data: { outgoingAssignment: {}, newAssignment: {}, auditHistory: {} }, statusCode: 201, message: 'Success' });

    expect(snackSpy.open).toHaveBeenCalledWith(REASSIGN_SUCCESS_MESSAGE, 'Cerrar', jasmine.any(Object));
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('saliente con perfil no reconocido: sin candidatos, mensaje claro y sin petición POST', () => {
    setup({ ...ana, evaluatorProfile: null });

    expect(component.filteredCandidates()).toEqual([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.outgoing-profile-error')?.textContent).toContain('no tiene un perfil reconocido');

    component.form.setValue({ newEvaluatorId: 38, reason: 'VENCIMIENTO', reasonDescription: 'Plazo reglamentario vencido.' });
    component.onConfirm();
    httpMock.expectNone('/api/evaluations/reassign');
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('error del backend al reasignar: muestra el mensaje real en el modal y no cierra', () => {
    setup(ana);
    component.form.setValue({ newEvaluatorId: 38, reason: 'VENCIMIENTO', reasonDescription: 'Plazo reglamentario vencido.' });
    component.onConfirm();

    httpMock.expectOne('/api/evaluations/reassign').flush(ERROR_400_BODY, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    // Sin ErrorInterceptor en este TestBed: el helper lee body.error.message del HttpErrorResponse crudo.
    expect(component.submitError()).toBe('Validation failed (numeric string is expected)');
    expect((fixture.nativeElement as HTMLElement).querySelector('.submit-error')?.textContent)
      .toContain('Validation failed (numeric string is expected)');
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('mantiene la validación de interfaz de 10 caracteres en la justificación', () => {
    setup(ana);
    component.form.patchValue({ newEvaluatorId: 38, reason: 'VENCIMIENTO', reasonDescription: 'Corto' });
    expect(component.form.get('reasonDescription')?.hasError('minlength')).toBeTrue();
  });

  it('cancelar cierra con null', () => {
    setup(ana);
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });
});

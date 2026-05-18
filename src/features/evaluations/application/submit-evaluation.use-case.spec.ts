import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SubmitEvaluationUseCase } from './submit-evaluation.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

describe('SubmitEvaluationUseCase', () => {
  let useCase: SubmitEvaluationUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;
  let notificationSpy: jasmine.SpyObj<NotificationBrokerService>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['submitEvaluation']);
    const nSpy = jasmine.createSpyObj('NotificationBrokerService', ['publish']);

    TestBed.configureTestingModule({
      providers: [
        SubmitEvaluationUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy },
        { provide: NotificationBrokerService, useValue: nSpy }
      ]
    });

    useCase = TestBed.inject(SubmitEvaluationUseCase);
    repoSpy = TestBed.inject(IEvaluationRepositoryPort) as jasmine.SpyObj<IEvaluationRepositoryPort>;
    notificationSpy = TestBed.inject(NotificationBrokerService) as jasmine.SpyObj<NotificationBrokerService>;
  });

  it('debe permitir el envío sin PDF si el resultado es APROBADO', (done) => {
    const formData = new FormData();
    const evaluationData = { result: 'APROBADO', assignmentId: '123' };
    formData.append('evaluationData', JSON.stringify(evaluationData));
    
    repoSpy.submitEvaluation.and.returnValue(of(undefined));

    useCase.execute(formData).subscribe({
      next: () => {
        expect(repoSpy.submitEvaluation).toHaveBeenCalled();
        expect(notificationSpy.publish).toHaveBeenCalledWith('EVALUATION_SUBMITTED', jasmine.any(Object));
        done();
      },
      error: fail
    });
  });

  it('debe fallar el envío si el resultado es NO_APROBADO y no hay PDF de sustento', (done) => {
    const formData = new FormData();
    const evaluationData = { result: 'NO_APROBADO', assignmentId: '123' };
    formData.append('evaluationData', JSON.stringify(evaluationData));

    useCase.execute(formData).subscribe({
      next: () => fail('Debería haber fallado por falta de PDF'),
      error: (error) => {
        expect(error.message).toContain('sustento en PDF es obligatorio');
        done();
      }
    });
  });

  it('debe permitir el envío si el resultado es CON_OBSERVACIONES y se adjunta un PDF', (done) => {
    const formData = new FormData();
    const evaluationData = { result: 'CON_OBSERVACIONES', assignmentId: '123' };
    formData.append('evaluationData', JSON.stringify(evaluationData));
    
    // Simular un archivo PDF
    const blob = new Blob(['dummy content'], { type: 'application/pdf' });
    formData.append('report', blob, 'informe.pdf');

    repoSpy.submitEvaluation.and.returnValue(of(undefined));

    useCase.execute(formData).subscribe({
      next: () => {
        expect(repoSpy.submitEvaluation).toHaveBeenCalled();
        done();
      },
      error: fail
    });
  });

  it('debe fallar si los datos de evaluación no son válidos (JSON corrupto)', (done) => {
    const formData = new FormData();
    formData.append('evaluationData', '{ invalid json }');

    useCase.execute(formData).subscribe({
      next: () => fail('Debería haber fallado por JSON inválido'),
      error: (error) => {
        expect(error.message).toContain('Error al procesar los datos');
        done();
      }
    });
  });
});

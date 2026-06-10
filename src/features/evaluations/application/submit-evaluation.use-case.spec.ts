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

  it('debe fallar el envío sin PDF si el resultado es APROBADO', (done) => {
    const payload = { result: 'APROBADO', assignmentId: '123' };

    useCase.execute(payload).subscribe({
      next: () => fail('Debería haber fallado por falta de PDF'),
      error: (error) => {
        expect(error.message).toContain('PDF firmado es obligatorio');
        done();
      }
    });
  });

  it('debe permitir el envío con PDF si el resultado es APROBADO', (done) => {
    const payload = { result: 'APROBADO', assignmentId: '123', reportPath: '/uploads/report123.pdf' };
    
    repoSpy.submitEvaluation.and.returnValue(of(undefined));

    useCase.execute(payload).subscribe({
      next: () => {
        expect(repoSpy.submitEvaluation).toHaveBeenCalledWith(payload);
        expect(notificationSpy.publish).toHaveBeenCalledWith('EVALUATION_SUBMITTED', jasmine.any(Object));
        done();
      },
      error: fail
    });
  });

  it('debe fallar el envío si el resultado es NO_APROBADO y no hay PDF', (done) => {
    const payload = { result: 'NO_APROBADO', assignmentId: '123' };

    useCase.execute(payload).subscribe({
      next: () => fail('Debería haber fallado por falta de PDF'),
      error: (error) => {
        expect(error.message).toContain('PDF firmado es obligatorio');
        done();
      }
    });
  });

  it('debe permitir el envío si el resultado es CON_OBSERVACIONES y se adjunta un PDF', (done) => {
    const payload = { result: 'CON_OBSERVACIONES', assignmentId: '123', reportPath: '/uploads/report123.pdf' };

    repoSpy.submitEvaluation.and.returnValue(of(undefined));

    useCase.execute(payload).subscribe({
      next: () => {
        expect(repoSpy.submitEvaluation).toHaveBeenCalledWith(payload);
        done();
      },
      error: fail
    });
  });
});

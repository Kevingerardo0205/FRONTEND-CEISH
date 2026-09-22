import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FinalizeDocumentaryValidationUseCase } from './finalize-documentary-validation.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ValidateDocumentaryUseCase } from './validate-documentary.use-case';

describe('FinalizeDocumentaryValidationUseCase', () => {
  let useCase: FinalizeDocumentaryValidationUseCase;
  let mockRepo: jasmine.SpyObj<IProtocolRepositoryPort>;
  let mockValidateDoc: jasmine.SpyObj<ValidateDocumentaryUseCase>;

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['verifyProtocol']);
    mockValidateDoc = jasmine.createSpyObj('ValidateDocumentaryUseCase', ['execute']);
    mockRepo.verifyProtocol.and.returnValue(of({ message: 'ok' }));
    mockValidateDoc.execute.and.returnValue(of({ message: 'ok', ceishCode: 'CEISH-001' } as any));

    TestBed.configureTestingModule({
      providers: [
        FinalizeDocumentaryValidationUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo },
        { provide: ValidateDocumentaryUseCase, useValue: mockValidateDoc }
      ]
    });

    useCase = TestBed.inject(FinalizeDocumentaryValidationUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call verifyProtocol then finalizeValidation in sequence', (done) => {
    useCase.execute('123', true, 'Todo correcto').subscribe({
      next: (res) => {
        expect(mockRepo.verifyProtocol).toHaveBeenCalledWith('123', true, 'Todo correcto');
        expect(mockValidateDoc.execute).toHaveBeenCalledWith('123');
        expect(res.ceishCode).toBe('CEISH-001');
        done();
      }
    });
  });

  it('should not call finalizeValidation if verifyProtocol fails', (done) => {
    mockRepo.verifyProtocol.and.returnValue(throwError(() => new Error('verify failed')));

    useCase.execute('123', true, 'obs').subscribe({
      error: (err) => {
        expect(err.message).toBe('verify failed');
        expect(mockValidateDoc.execute).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('should pass isComplete=false for incomplete validations', (done) => {
    useCase.execute('456', false, 'Faltan docs').subscribe({
      next: () => {
        expect(mockRepo.verifyProtocol).toHaveBeenCalledWith('456', false, 'Faltan docs');
        done();
      }
    });
  });
});

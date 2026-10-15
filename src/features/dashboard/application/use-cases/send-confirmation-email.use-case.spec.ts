import { TestBed } from '@angular/core/testing';
import { SendConfirmationEmailUseCase } from './send-confirmation-email.use-case';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { of } from 'rxjs';

describe('SendConfirmationEmailUseCase', () => {
  let useCase: SendConfirmationEmailUseCase;
  let mockRepository: jasmine.SpyObj<IUserAdminRepositoryPort>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IUserAdminRepositoryPort', ['sendConfirmationEmail']);
    mockRepository.sendConfirmationEmail.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        SendConfirmationEmailUseCase,
        { provide: IUserAdminRepositoryPort, useValue: mockRepository },
      ],
    });

    useCase = TestBed.inject(SendConfirmationEmailUseCase);
  });

  it('should call repository.sendConfirmationEmail with email', (done) => {
    useCase.execute('test@espoch.edu.ec').subscribe(() => {
      expect(mockRepository.sendConfirmationEmail).toHaveBeenCalledWith('test@espoch.edu.ec');
      done();
    });
  });
});

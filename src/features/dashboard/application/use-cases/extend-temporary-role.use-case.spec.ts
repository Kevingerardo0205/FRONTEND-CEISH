import { TestBed } from '@angular/core/testing';
import { ExtendTemporaryRoleUseCase } from './extend-temporary-role.use-case';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { of } from 'rxjs';

describe('ExtendTemporaryRoleUseCase', () => {
  let useCase: ExtendTemporaryRoleUseCase;
  let mockRepository: jasmine.SpyObj<IUserAdminRepositoryPort>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IUserAdminRepositoryPort', ['extendTemporaryRole']);
    mockRepository.extendTemporaryRole.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        ExtendTemporaryRoleUseCase,
        { provide: IUserAdminRepositoryPort, useValue: mockRepository },
      ],
    });

    useCase = TestBed.inject(ExtendTemporaryRoleUseCase);
  });

  it('should create the use case', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call repository.extendTemporaryRole with correct parameters', (done) => {
    const validUntil = '2026-12-31T23:59:59.000Z';
    const reason = 'Prorroga autorizada por Presidencia';

    useCase.execute('104', 'EVALUADOR', validUntil, reason).subscribe(() => {
      expect(mockRepository.extendTemporaryRole).toHaveBeenCalledWith(
        '104',
        'EVALUADOR',
        validUntil,
        reason,
      );
      done();
    });
  });
});

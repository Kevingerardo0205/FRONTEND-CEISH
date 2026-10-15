import { TestBed } from '@angular/core/testing';
import { SuspendTemporaryRoleUseCase } from './suspend-temporary-role.use-case';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { of } from 'rxjs';

describe('SuspendTemporaryRoleUseCase', () => {
  let useCase: SuspendTemporaryRoleUseCase;
  let mockRepository: jasmine.SpyObj<IUserAdminRepositoryPort>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IUserAdminRepositoryPort', ['suspendTemporaryRole']);
    mockRepository.suspendTemporaryRole.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        SuspendTemporaryRoleUseCase,
        { provide: IUserAdminRepositoryPort, useValue: mockRepository },
      ],
    });

    useCase = TestBed.inject(SuspendTemporaryRoleUseCase);
  });

  it('should call repository.suspendTemporaryRole with correct parameters', (done) => {
    useCase.execute('1', 'SECRETARIA', 'Fin de la suplencia').subscribe(() => {
      expect(mockRepository.suspendTemporaryRole).toHaveBeenCalledWith(
        '1',
        'SECRETARIA',
        'Fin de la suplencia',
      );
      done();
    });
  });
});

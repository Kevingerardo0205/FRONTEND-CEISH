import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort, Role } from '@domain/ports/user-admin-repository.port';
import {
  GetUsersAdminUseCase,
  RegisterUserAdminUseCase,
  UpdateUserAdminUseCase,
  DeleteUserAdminUseCase,
  GetRolesUseCase,
  UpdateUserRolesUseCase,
  ExtendTemporaryRoleUseCase,
  SuspendTemporaryRoleUseCase,
} from './use-cases';

describe('Dashboard User Admin Use Cases', () => {
  let mockRepository: jasmine.SpyObj<IUserAdminRepositoryPort>;

  const mockUsers: UserAdmin[] = [
    {
      id: '1',
      cedula: '0601234567',
      nombre: 'Dra. María López',
      email: 'maria.lopez@espoch.edu.ec',
      rol: 'SECRETARIA',
      roles: ['SECRETARIA', 'EVALUADOR'],
      perfil: 'Secretaria Ejecutiva',
      activo: true,
    },
    {
      id: '2',
      cedula: '0607654321',
      nombre: 'Dr. Juan Pérez',
      email: 'juan.perez@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR'],
      perfil: 'Docente Investigador',
      activo: true,
    },
  ];

  const mockRoles: Role[] = [
    { id: 1, name: 'ADMIN_TI', description: 'Administrador TI' },
    { id: 2, name: 'SECRETARIA', description: 'Secretaría' },
  ];

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj<IUserAdminRepositoryPort>('IUserAdminRepositoryPort', [
      'getAll',
      'create',
      'update',
      'delete',
      'getRoles',
      'updateRoles',
      'extendTemporaryRole',
      'suspendTemporaryRole',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: IUserAdminRepositoryPort, useValue: mockRepository },
        GetUsersAdminUseCase,
        RegisterUserAdminUseCase,
        UpdateUserAdminUseCase,
        DeleteUserAdminUseCase,
        GetRolesUseCase,
        UpdateUserRolesUseCase,
        ExtendTemporaryRoleUseCase,
        SuspendTemporaryRoleUseCase,
      ],
    });
  });

  describe('GetUsersAdminUseCase', () => {
    it('debe obtener todos los usuarios del repositorio', (done) => {
      mockRepository.getAll.and.returnValue(of(mockUsers));
      const useCase = TestBed.inject(GetUsersAdminUseCase);

      useCase.execute().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(mockRepository.getAll).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('RegisterUserAdminUseCase', () => {
    it('debe enviar la entidad de usuario a crear y retornar el usuario creado', (done) => {
      const newUser: UserAdmin = {
        cedula: '0609999999',
        nombre: 'Ing. Carlos Ruiz',
        email: 'carlos.ruiz@espoch.edu.ec',
        rol: 'ADMIN_TI',
        roles: ['ADMIN_TI'],
        perfil: 'Administrador de Sistemas',
        activo: true,
      };
      mockRepository.create.and.returnValue(of({ ...newUser, id: '10' }));
      const useCase = TestBed.inject(RegisterUserAdminUseCase);

      useCase.execute(newUser).subscribe((created) => {
        expect(created.id).toBe('10');
        expect(mockRepository.create).toHaveBeenCalledWith(newUser);
        done();
      });
    });
  });

  describe('UpdateUserAdminUseCase', () => {
    it('debe actualizar los datos del usuario incluyendo multi-roles', (done) => {
      const updateData: Partial<UserAdmin> = {
        nombre: 'Dra. María López M.',
        roles: ['SECRETARIA', 'PRESIDENTE'],
      };
      mockRepository.update.and.returnValue(of({ ...mockUsers[0], ...updateData }));
      const useCase = TestBed.inject(UpdateUserAdminUseCase);

      useCase.execute('1', updateData).subscribe((res) => {
        expect(res.nombre).toBe('Dra. María López M.');
        expect(mockRepository.update).toHaveBeenCalledWith('1', updateData);
        done();
      });
    });
  });

  describe('DeleteUserAdminUseCase', () => {
    it('debe invocar la desactivación/eliminación del usuario por ID', (done) => {
      mockRepository.delete.and.returnValue(of(undefined));
      const useCase = TestBed.inject(DeleteUserAdminUseCase);

      useCase.execute('1').subscribe(() => {
        expect(mockRepository.delete).toHaveBeenCalledWith('1');
        done();
      });
    });
  });

  describe('GetRolesUseCase', () => {
    it('debe consultar la lista de roles tipados', (done) => {
      mockRepository.getRoles.and.returnValue(of(mockRoles));
      const useCase = TestBed.inject(GetRolesUseCase);

      useCase.execute().subscribe((roles) => {
        expect(roles).toEqual(mockRoles);
        expect(mockRepository.getRoles).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('UpdateUserRolesUseCase', () => {
    it('debe actualizar la asignación de roles simples y suplencias temporales', (done) => {
      mockRepository.updateRoles.and.returnValue(of(undefined));
      const useCase = TestBed.inject(UpdateUserRolesUseCase);

      const rolesPayload = [
        'INVESTIGADOR',
        {
          roleCode: 'SECRETARIA',
          validFrom: '2026-09-01T00:00:00.000Z',
          validUntil: '2026-09-15T23:59:59.000Z',
          reason: 'Subrogación por vacaciones',
        },
      ];

      useCase.execute('1', rolesPayload).subscribe(() => {
        expect(mockRepository.updateRoles).toHaveBeenCalledWith('1', rolesPayload);
        done();
      });
    });
  });

  describe('ExtendTemporaryRoleUseCase', () => {
    it('debe invocar extendTemporaryRole con el id, roleCode, nueva fecha y motivo', (done) => {
      mockRepository.extendTemporaryRole.and.returnValue(of(undefined));
      const useCase = TestBed.inject(ExtendTemporaryRoleUseCase);

      useCase.execute('43', 'SECRETARIA', '2026-10-15', 'Prórroga aprobada').subscribe(() => {
        expect(mockRepository.extendTemporaryRole).toHaveBeenCalledWith(
          '43',
          'SECRETARIA',
          '2026-10-15',
          'Prórroga aprobada',
        );
        done();
      });
    });
  });

  describe('SuspendTemporaryRoleUseCase', () => {
    it('debe invocar suspendTemporaryRole con el id, roleCode y motivo de auditoría', (done) => {
      mockRepository.suspendTemporaryRole.and.returnValue(of(undefined));
      const useCase = TestBed.inject(SuspendTemporaryRoleUseCase);

      useCase.execute('43', 'SECRETARIA', 'Retorno titular').subscribe(() => {
        expect(mockRepository.suspendTemporaryRole).toHaveBeenCalledWith(
          '43',
          'SECRETARIA',
          'Retorno titular',
        );
        done();
      });
    });
  });
});

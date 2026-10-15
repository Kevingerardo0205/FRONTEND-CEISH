import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import {
  GetUsersAdminUseCase,
  RegisterUserAdminUseCase,
  UpdateUserAdminUseCase,
  DeleteUserAdminUseCase,
  ExtendTemporaryRoleUseCase,
  SuspendTemporaryRoleUseCase,
  SendConfirmationEmailUseCase
} from '@features/dashboard/use-cases';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { GetSecurityCatalogUseCase } from '../../../security/application/security.use-cases';
import { UserManagementPage } from './user-management.page';

describe('UserManagementPage', () => {
  let component: UserManagementPage;
  let fixture: ComponentFixture<UserManagementPage>;
  let mockGetUsers: jasmine.SpyObj<GetUsersAdminUseCase>;
  let mockRegisterUser: jasmine.SpyObj<RegisterUserAdminUseCase>;
  let mockUpdateUser: jasmine.SpyObj<UpdateUserAdminUseCase>;
  let mockDeleteUser: jasmine.SpyObj<DeleteUserAdminUseCase>;
  let mockExtendRole: jasmine.SpyObj<ExtendTemporaryRoleUseCase>;
  let mockSuspendRole: jasmine.SpyObj<SuspendTemporaryRoleUseCase>;
  let mockSendConfirmationEmail: jasmine.SpyObj<SendConfirmationEmailUseCase>;
  let mockAdminRepo: jasmine.SpyObj<IUserAdminRepositoryPort>;
  let mockCatalogUseCase: jasmine.SpyObj<GetSecurityCatalogUseCase>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUsers: UserAdmin[] = [
    {
      id: '1',
      cedula: '0601234567',
      nombre: 'Dra. María López',
      email: 'maria.lopez@espoch.edu.ec',
      rol: 'SECRETARIA',
      roles: ['SECRETARIA'],
      perfil: 'Secretaria Ejecutiva',
      activo: true
    },
    {
      id: '2',
      cedula: '0607654321',
      nombre: 'Dr. Juan Pérez',
      email: 'juan.perez@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR'],
      perfil: 'Docente Investigador',
      activo: true
    }
  ];

  beforeEach(async () => {
    mockGetUsers = jasmine.createSpyObj('GetUsersAdminUseCase', ['execute']);
    mockRegisterUser = jasmine.createSpyObj('RegisterUserAdminUseCase', ['execute']);
    mockUpdateUser = jasmine.createSpyObj('UpdateUserAdminUseCase', ['execute']);
    mockDeleteUser = jasmine.createSpyObj('DeleteUserAdminUseCase', ['execute']);
    mockExtendRole = jasmine.createSpyObj('ExtendTemporaryRoleUseCase', ['execute']);
    mockSuspendRole = jasmine.createSpyObj('SuspendTemporaryRoleUseCase', ['execute']);
    mockSendConfirmationEmail = jasmine.createSpyObj('SendConfirmationEmailUseCase', ['execute']);
    mockAdminRepo = jasmine.createSpyObj('IUserAdminRepositoryPort', ['getAll', 'create', 'update', 'delete', 'getRoles', 'updateRoles', 'extendTemporaryRole', 'suspendTemporaryRole', 'sendConfirmationEmail']);
    mockCatalogUseCase = jasmine.createSpyObj('GetSecurityCatalogUseCase', ['execute']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockGetUsers.execute.and.returnValue(of(mockUsers));
    mockSendConfirmationEmail.execute.and.returnValue(of(undefined));
    mockCatalogUseCase.execute.and.returnValue(of({
      modules: [],
      allPermissions: [],
      roles: [
        { id: 1, code: 'SECRETARIA', name: 'Secretaría', isActive: true },
        { id: 2, code: 'INVESTIGADOR', name: 'Investigador', isActive: true }
      ]
    }));

    await TestBed.configureTestingModule({
      imports: [UserManagementPage, NoopAnimationsModule],
      providers: [
        { provide: GetUsersAdminUseCase, useValue: mockGetUsers },
        { provide: RegisterUserAdminUseCase, useValue: mockRegisterUser },
        { provide: UpdateUserAdminUseCase, useValue: mockUpdateUser },
        { provide: DeleteUserAdminUseCase, useValue: mockDeleteUser },
        { provide: ExtendTemporaryRoleUseCase, useValue: mockExtendRole },
        { provide: SuspendTemporaryRoleUseCase, useValue: mockSuspendRole },
        { provide: SendConfirmationEmailUseCase, useValue: mockSendConfirmationEmail },
        { provide: IUserAdminRepositoryPort, useValue: mockAdminRepo },
        { provide: GetSecurityCatalogUseCase, useValue: mockCatalogUseCase },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .overrideComponent(UserManagementPage, {
      set: {
        providers: [
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializarse y cargar los usuarios categorizados', () => {
    expect(component).toBeTruthy();
    expect(component.users().length).toBe(2);
    expect(component.activeCount()).toBe(2);
    expect(mockGetUsers.execute).toHaveBeenCalled();
  });

  it('debe filtrar correctamente por modo COMITE e INVESTIGADOR', () => {
    // Modo por defecto: COMITE (usuarios que NO son INVESTIGADOR)
    expect(component.filterMode()).toBe('COMITE');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].nombre).toBe('Dra. María López');

    // Cambiar a INVESTIGADOR
    component.filterMode.set('INVESTIGADOR');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].nombre).toBe('Dr. Juan Pérez');
  });

  it('debe filtrar reactivamente mediante la búsqueda por nombre, email o cédula', () => {
    component.filterMode.set('COMITE');
    component.searchQuery.set('0601234567');
    expect(component.filteredUsers().length).toBe(1);

    component.searchQuery.set('inexistente');
    expect(component.filteredUsers().length).toBe(0);
  });

  it('debe registrar un nuevo usuario y mostrar notificación exitosa', () => {
    const newUser: UserAdmin = {
      cedula: '0609998887',
      nombre: 'Lic. Pedro Castro',
      email: 'pedro.castro@espoch.edu.ec',
      rol: 'SECRETARIA',
      roles: ['SECRETARIA'],
      perfil: 'Asistente',
      activo: true
    };
    mockRegisterUser.execute.and.returnValue(of({ ...newUser, id: '15' }));

    component.onSave(newUser);

    expect(mockRegisterUser.execute).toHaveBeenCalledWith(newUser);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/registrado con éxito/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('debe actualizar un usuario existente cuando posee id', () => {
    const userToUpdate: UserAdmin = {
      id: '1',
      cedula: '0601234567',
      nombre: 'Dra. María López Modificada',
      email: 'maria.lopez@espoch.edu.ec',
      rol: 'SECRETARIA',
      roles: ['SECRETARIA', 'EVALUADOR'],
      perfil: 'Secretaria General',
      activo: true
    };
    mockUpdateUser.execute.and.returnValue(of(userToUpdate));

    component.onSave(userToUpdate);

    expect(mockUpdateUser.execute).toHaveBeenCalledWith('1', userToUpdate);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/actualizado con éxito/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('debe mostrar el mensaje de error del backend en caso de fallo por duplicidad (Constraints)', () => {
    const duplicateUser: UserAdmin = {
      cedula: '0601234567',
      nombre: 'Usuario Duplicado',
      email: 'duplicado@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR'],
      perfil: 'Investigador',
      activo: true
    };
    const errorResponse = {
      error: { message: 'El correo institucional ya se encuentra registrado' }
    };
    mockRegisterUser.execute.and.returnValue(throwError(() => errorResponse));

    component.onSave(duplicateUser);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      '❌ El correo institucional ya se encuentra registrado',
      'Entendido',
      jasmine.any(Object)
    );
  });

  it('debe abrir el diálogo de confirmación para revocar el acceso del usuario', () => {
    const dialogRefSpy = {
      afterClosed: () => of(true)
    };
    mockDialog.open.and.returnValue(dialogRefSpy as any);
    mockDeleteUser.execute.and.returnValue(of(undefined));

    component.onDelete(mockUsers[0]);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockDeleteUser.execute).toHaveBeenCalledWith('1');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Acceso revocado/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('debe abrir ExtendRoleDialogComponent y prorrogar la suplencia temporal', () => {
    const dialogRefSpy = {
      afterClosed: () => of({ validUntil: '2026-11-30', reason: 'Prórroga aprobada' })
    };
    mockDialog.open.and.returnValue(dialogRefSpy as any);
    mockExtendRole.execute.and.returnValue(of(undefined));

    component.onExtendRole({
      user: mockUsers[0],
      role: { code: 'SECRETARIA', name: 'Secretaria', validUntil: '2026-09-30', reason: 'Suplencia', isExpired: false }
    });

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockExtendRole.execute).toHaveBeenCalledWith('1', 'SECRETARIA', '2026-11-30', 'Prórroga aprobada');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/prorrogada exitosamente/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('debe abrir SuspendRoleDialogComponent y suspender la suplencia temporal', () => {
    const dialogRefSpy = {
      afterClosed: () => of({ reason: 'Retorno anticipado de la titular' })
    };
    mockDialog.open.and.returnValue(dialogRefSpy as any);
    mockSuspendRole.execute.and.returnValue(of(undefined));

    component.onSuspendRole({
      user: mockUsers[0],
      role: { code: 'SECRETARIA', name: 'Secretaria', validUntil: '2026-09-30', reason: 'Suplencia', isExpired: false }
    });

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockSuspendRole.execute).toHaveBeenCalledWith('1', 'SECRETARIA', 'Retorno anticipado de la titular');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/finalizada y registrada en auditoría/),
      'Cerrar',
      jasmine.any(Object)
    );
  });
});

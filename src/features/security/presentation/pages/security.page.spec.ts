import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import {
  SecurityModule,
  SecurityPermission,
  SecurityRole,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleComplianceStatus,
} from '@domain/entities/security.entity';
import { RolePermissionsState } from '../../application/role-permissions.state';
import {
  GetSecurityCatalogUseCase,
  GetRolePermissionsUseCase,
  UpdateRolePermissionsUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetRolePresetsUseCase,
  GetRoleComplianceUseCase,
  ResetRolePresetUseCase,
} from '../../application/security.use-cases';
import { SecurityPage } from './security.page';

describe('SecurityPage', () => {
  let component: SecurityPage;
  let fixture: ComponentFixture<SecurityPage>;
  let state: RolePermissionsState;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockModules: SecurityModule[] = [
    { id: 1, code: 'RECEPCION', name: 'Recepción', icon: 'folder', order: 1, isActive: true },
  ];

  const mockPermissions: SecurityPermission[] = [
    { id: 10, code: 'RECEPCION_NUEVO', name: 'Recepción Nueva', moduleId: 1 },
  ];

  const mockRoles: SecurityRole[] = [
    { id: 1, code: 'ADMIN', name: 'Administrador', isActive: true, permissions: mockPermissions },
    { id: 2, code: 'SECRETARIA', name: 'Secretaría', isActive: true, permissions: [] },
  ];

  const mockCompliance: RoleComplianceStatus = {
    roleId: 1,
    roleCode: 'ADMIN',
    status: 'STANDARD',
    isCompliant: true,
    missingPermissions: [],
    extraPermissions: [],
    currentPermissionCount: 1,
    expectedPermissionCount: 1,
  };

  beforeEach(async () => {
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    const mockGetCatalog = jasmine.createSpyObj('GetSecurityCatalogUseCase', ['execute']);
    const mockGetRolePermissions = jasmine.createSpyObj('GetRolePermissionsUseCase', ['execute']);
    const mockUpdateRolePermissions = jasmine.createSpyObj('UpdateRolePermissionsUseCase', [
      'execute',
    ]);
    const mockCreateRole = jasmine.createSpyObj('CreateRoleUseCase', ['execute']);
    const mockUpdateRole = jasmine.createSpyObj('UpdateRoleUseCase', ['execute']);
    const mockDeleteRole = jasmine.createSpyObj('DeleteRoleUseCase', ['execute']);
    const mockGetRolePresets = jasmine.createSpyObj('GetRolePresetsUseCase', ['execute']);
    const mockGetRoleCompliance = jasmine.createSpyObj('GetRoleComplianceUseCase', ['execute']);
    const mockResetRolePreset = jasmine.createSpyObj('ResetRolePresetUseCase', ['execute']);

    mockGetCatalog.execute.and.returnValue(
      of({
        modules: mockModules,
        allPermissions: mockPermissions,
        roles: mockRoles,
      }),
    );
    mockGetRolePermissions.execute.and.returnValue(of(mockPermissions));
    mockUpdateRolePermissions.execute.and.returnValue(of(undefined));
    mockGetRoleCompliance.execute.and.returnValue(of(mockCompliance));

    await TestBed.configureTestingModule({
      imports: [SecurityPage, NoopAnimationsModule],
      providers: [
        RolePermissionsState,
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: GetSecurityCatalogUseCase, useValue: mockGetCatalog },
        { provide: GetRolePermissionsUseCase, useValue: mockGetRolePermissions },
        { provide: UpdateRolePermissionsUseCase, useValue: mockUpdateRolePermissions },
        { provide: CreateRoleUseCase, useValue: mockCreateRole },
        { provide: UpdateRoleUseCase, useValue: mockUpdateRole },
        { provide: DeleteRoleUseCase, useValue: mockDeleteRole },
        { provide: GetRolePresetsUseCase, useValue: mockGetRolePresets },
        { provide: GetRoleComplianceUseCase, useValue: mockGetRoleCompliance },
        { provide: ResetRolePresetUseCase, useValue: mockResetRolePreset },
      ],
    })
      .overrideComponent(SecurityPage, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: mockSnackBar },
            { provide: MatDialog, useValue: mockDialog },
          ],
        },
      })
      .compileComponents();

    state = TestBed.inject(RolePermissionsState);
    fixture = TestBed.createComponent(SecurityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar el catálogo seleccionando el primer rol automáticamente', () => {
    expect(component).toBeTruthy();
    expect(state.roles().length).toBe(2);
    expect(state.selectedRoleId()).toBe(1);
  });

  it('debe guardar permisos y mostrar notificación de éxito', () => {
    spyOn(state, 'savePermissions').and.returnValue(of(undefined));
    component.onSavePermissions();

    expect(state.savePermissions).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('debe restablecer la plantilla oficial del rol tras confirmación', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(state, 'resetCurrentRoleToPreset').and.returnValue(of(mockRoles[0]));

    component.onResetRolePreset();

    expect(state.resetCurrentRoleToPreset).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('debe abrir diálogo y crear un nuevo rol cuando el usuario confirma', () => {
    const newDTO: CreateRoleDTO = { code: 'EVALUADOR', name: 'Evaluador', description: 'Desc' };
    const createdRole: SecurityRole = { id: 3, ...newDTO, isActive: true };

    const dialogRefSpy = {
      afterClosed: () => of(newDTO),
    };
    mockDialog.open.and.returnValue(dialogRefSpy as any);
    spyOn(state, 'createRole').and.returnValue(of(createdRole));

    component.openCreateRoleDialog();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(state.createRole).toHaveBeenCalledWith(newDTO);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('debe abrir diálogo y actualizar datos del rol', () => {
    const updateDTO: UpdateRoleDTO = { name: 'Admin General' };
    const updatedRole: SecurityRole = {
      id: 1,
      code: 'ADMIN',
      name: 'Admin General',
      isActive: true,
    };

    const dialogRefSpy = {
      afterClosed: () => of(updateDTO),
    };
    mockDialog.open.and.returnValue(dialogRefSpy as any);
    spyOn(state, 'updateRole').and.returnValue(of(updatedRole));

    component.openEditRoleDialog(mockRoles[0]);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(state.updateRole).toHaveBeenCalledWith(1, updateDTO);
  });

  it('debe desactivar el rol tras confirmación del usuario', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(state, 'deleteRole').and.returnValue(of(undefined));

    component.onDeleteRoleRequested(mockRoles[1]);

    expect(state.deleteRole).toHaveBeenCalledWith(2);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });
});

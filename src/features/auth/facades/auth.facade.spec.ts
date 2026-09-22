import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { User } from '@domain/entities/user.entity';
import { AuthFacade } from './auth.facade';

describe('AuthFacade (Multi-Role & PBAC)', () => {
  let facade: AuthFacade;
  let mockTokenStore: jasmine.SpyObj<TokenStoreAdapter>;
  let mockAuthRepo: jasmine.SpyObj<IAuthRepositoryPort>;

  const mockMultiRoleUser: User = {
    id: '15',
    nombre: 'Dra. María López',
    email: 'maria.lopez@espoch.edu.ec',
    rol: 'INVESTIGADOR',
    roles: ['INVESTIGADOR', 'EVALUADOR'],
    userRoles: [
      { id: 1, code: 'INVESTIGADOR', name: 'Investigador', isExpired: false },
      { id: 2, code: 'EVALUADOR', name: 'Evaluador Par', isExpired: false },
      { id: 3, code: 'SECRETARIA', name: 'Secretaria Suplente', isExpired: true } // Expirado
    ],
    activo: true,
    emailVerificado: true,
    permissions: ['RECEPCION_NUEVO', 'EVALUACION_EXPEDITA', 'DASHBOARD_RESUMEN']
  };

  beforeEach(() => {
    mockTokenStore = jasmine.createSpyObj('TokenStoreAdapter', ['getToken', 'getRefreshToken', 'saveToken', 'saveRefreshToken', 'removeTokens']);
    mockAuthRepo = jasmine.createSpyObj('IAuthRepositoryPort', ['getUserById', 'refreshToken']);

    mockTokenStore.getToken.and.returnValue('mock-jwt-token');
    mockAuthRepo.getUserById.and.returnValue(of(mockMultiRoleUser));

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        { provide: TokenStoreAdapter, useValue: mockTokenStore },
        { provide: IAuthRepositoryPort, useValue: mockAuthRepo }
      ]
    });

    facade = TestBed.inject(AuthFacade);
    facade.setUser(mockMultiRoleUser);
  });

  it('debe inicializarse y almacenar el usuario en la señal currentUser', () => {
    expect(facade.currentUser()).toEqual(mockMultiRoleUser);
    expect(facade.isAuthenticated()).toBeTrue();
  });

  describe('getActiveRoles()', () => {
    it('debe retornar únicamente los roles activos, excluyendo roles temporales expirados', () => {
      const activeRoles = facade.getActiveRoles();
      expect(activeRoles).toContain('INVESTIGADOR');
      expect(activeRoles).toContain('EVALUADOR');
      expect(activeRoles).not.toContain('SECRETARIA'); // Expirado
      expect(activeRoles.length).toBe(2);
    });
  });

  describe('hasRole() y hasAnyRole()', () => {
    it('debe confirmar roles activos primarios y secundarios', () => {
      expect(facade.hasRole('INVESTIGADOR')).toBeTrue();
      expect(facade.hasRole('EVALUADOR')).toBeTrue();
      expect(facade.hasRole('evaluador')).toBeTrue(); // Case-insensitive
    });

    it('debe rechazar roles temporales que ya expiraron', () => {
      expect(facade.hasRole('SECRETARIA')).toBeFalse();
    });

    it('debe verificar hasAnyRole() correctamente', () => {
      expect(facade.hasAnyRole(['ADMIN_TI', 'EVALUADOR'])).toBeTrue();
      expect(facade.hasAnyRole(['ADMIN_TI', 'PRESIDENTE'])).toBeFalse();
    });
  });

  describe('hasPermission(), hasAnyPermission() y hasAllPermissions()', () => {
    it('debe verificar permisos individuales', () => {
      expect(facade.hasPermission('RECEPCION_NUEVO')).toBeTrue();
      expect(facade.hasPermission('PERMISOS_GESTIONAR')).toBeFalse();
    });

    it('debe verificar combinación de permisos con hasAnyPermission y hasAllPermissions', () => {
      expect(facade.hasAnyPermission(['PERMISOS_GESTIONAR', 'EVALUACION_EXPEDITA'])).toBeTrue();
      expect(facade.hasAllPermissions(['RECEPCION_NUEVO', 'EVALUACION_EXPEDITA'])).toBeTrue();
      expect(facade.hasAllPermissions(['RECEPCION_NUEVO', 'PERMISOS_GESTIONAR'])).toBeFalse();
    });

    it('debe otorgar todos los permisos si el usuario tiene ADMIN_ALL', () => {
      const adminUser: User = {
        ...mockMultiRoleUser,
        permissions: ['ADMIN_ALL']
      };
      facade.setUser(adminUser);

      expect(facade.hasPermission('CUALQUIER_PERMISO_CUSTOM')).toBeTrue();
      expect(facade.hasAllPermissions(['P1', 'P2', 'P3'])).toBeTrue();
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { UserAdminApiAdapter } from './user-admin-api.adapter';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { of } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';

describe('UserAdminApiAdapter', () => {
  let adapter: UserAdminApiAdapter;
  let mockApiClient: jasmine.SpyObj<ApiClientService>;

  beforeEach(() => {
    mockApiClient = jasmine.createSpyObj('ApiClientService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        UserAdminApiAdapter,
        { provide: ApiClientService, useValue: mockApiClient }
      ]
    });

    adapter = TestBed.inject(UserAdminApiAdapter);
  });

  it('debe crearse correctamente', () => {
    expect(adapter).toBeTruthy();
  });

  it('debe mapear y formatear roles híbridos en create() cuando hay suplencias temporales', (done) => {
    const newUser: UserAdmin = {
      nombre: 'Dra. María Elena',
      email: 'maria.elena@espoch.edu.ec',
      cedula: '0601234567',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR', 'SECRETARIA'],
      userRoles: [
        { code: 'INVESTIGADOR', name: 'Investigador', validUntil: null, reason: null, isExpired: false },
        { code: 'SECRETARIA', name: 'Secretaría', validUntil: '2026-09-30', reason: 'Subrogación', isExpired: false }
      ],
      perfil: 'Docente',
      activo: true
    };

    mockApiClient.post.and.returnValue(of({
      data: {
        id: '10',
        fullName: newUser.nombre,
        email: newUser.email,
        nationalId: newUser.cedula,
        roles: ['INVESTIGADOR', { code: 'SECRETARIA', validUntil: '2026-09-30', reason: 'Subrogación' }],
        isActive: true
      }
    }));

    adapter.create(newUser).subscribe((created) => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.objectContaining({
          fullName: 'Dra. María Elena',
          email: 'maria.elena@espoch.edu.ec',
          roles: [
            'INVESTIGADOR',
            {
              roleCode: 'SECRETARIA',
              validFrom: null,
              validUntil: '2026-09-30',
              reason: 'Subrogación'
            }
          ]
        })
      );
      expect(created.id).toBe('10');
      done();
    });
  });

  it('debe formatear roles híbridos en update() cuando se actualizan suplencias temporales', (done) => {
    const userToUpdate: Partial<UserAdmin> = {
      nombre: 'Dr. Carlos Mendoza',
      userRoles: [
        { code: 'INVESTIGADOR', name: 'Investigador', validUntil: null, reason: null, isExpired: false },
        { code: 'EVALUADOR', name: 'Evaluador', validUntil: '2026-12-31', reason: 'Comisión 2026', isExpired: false }
      ]
    };

    mockApiClient.patch.and.returnValue(of({
      data: {
        id: '5',
        fullName: 'Dr. Carlos Mendoza',
        roles: ['INVESTIGADOR', { code: 'EVALUADOR', validUntil: '2026-12-31' }],
        isActive: true
      }
    }));

    adapter.update('5', userToUpdate).subscribe((updated) => {
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        jasmine.stringMatching(/5/),
        jasmine.objectContaining({
          fullName: 'Dr. Carlos Mendoza',
          roles: [
            'INVESTIGADOR',
            {
              roleCode: 'EVALUADOR',
              validFrom: null,
              validUntil: '2026-12-31',
              reason: 'Comisión 2026'
            }
          ]
        })
      );
      expect(updated.id).toBe('5');
      done();
    });
  });

  it('debe ejecutar extendTemporaryRole() llamando al endpoint PATCH específico', (done) => {
    mockApiClient.patch.and.returnValue(of(undefined));

    adapter.extendTemporaryRole('43', 'SECRETARIA', '2026-10-15', 'Prórroga licencia').subscribe(() => {
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        jasmine.stringMatching(/\/auth\/users\/43\/roles\/SECRETARIA\/extend/),
        {
          validUntil: '2026-10-15',
          reason: 'Prórroga licencia'
        }
      );
      done();
    });
  });

  it('debe ejecutar suspendTemporaryRole() llamando al endpoint POST específico', (done) => {
    mockApiClient.post.and.returnValue(of(undefined));

    adapter.suspendTemporaryRole('43', 'SECRETARIA', 'Retorno titular').subscribe(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        jasmine.stringMatching(/\/auth\/users\/43\/roles\/SECRETARIA\/suspend/),
        {
          reason: 'Retorno titular'
        }
      );
      done();
    });
  });
});

import { InvalidRoleError, Role, RoleCode } from './role.vo';

describe('Role (VO)', () => {
  const codes: RoleCode[] = ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'];

  it('all() devuelve los 4 roles fijos', () => {
    expect(Role.all().map((r) => r.code)).toEqual(codes);
  });

  codes.forEach((code) => {
    it(`fromBackend('${code}') devuelve el rol`, () => {
      expect(Role.fromBackend(code).code).toBe(code);
    });
  });

  it('fromBackend devuelve siempre la misma instancia para un código', () => {
    expect(Role.fromBackend('SECRETARIA')).toBe(Role.fromBackend('SECRETARIA'));
  });

  ['ADMIN_TI', 'PRESIDENTA', 'secretaria', '', null, undefined, 1].forEach((invalid) => {
    it(`fromBackend(${JSON.stringify(invalid)}) lanza InvalidRoleError`, () => {
      expect(() => Role.fromBackend(invalid)).toThrowError(
        InvalidRoleError,
        `Rol desconocido: ${String(invalid)}`,
      );
    });
  });

  it('InvalidRoleError conserva el valor recibido y su nombre', () => {
    try {
      Role.fromBackend('ADMIN_TI');
      fail('debía lanzar');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as InvalidRoleError).name).toBe('InvalidRoleError');
      expect((e as InvalidRoleError).received).toBe('ADMIN_TI');
    }
  });
});

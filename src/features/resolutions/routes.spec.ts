import { RESOLUTION_ROUTES } from './routes';

describe('RESOLUTION_ROUTES: permisos de emisión', () => {
  const children = RESOLUTION_ROUTES[0].children ?? [];

  it('exige RESOLUCION_CREAR para la ruta generator (solo Secretaría emite)', () => {
    const generator = children.find((r) => r.path === 'generator');

    expect(generator).toBeDefined();
    expect(generator?.data?.['permissions']).toEqual(['RESOLUCION_CREAR']);
  });

  it('mantiene los roles existentes en la ruta generator', () => {
    const generator = children.find((r) => r.path === 'generator');

    expect(generator?.data?.['roles']).toEqual(['SECRETARIA', 'PRESIDENTE']);
  });
});

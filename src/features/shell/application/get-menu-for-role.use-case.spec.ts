import { TestBed } from '@angular/core/testing';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { StaticMenuConfigAdapter } from '../infrastructure/menu.config';
import { GetMenuForRoleUseCase } from './get-menu-for-role.use-case';

describe('GetMenuForRoleUseCase', () => {
  let useCase: GetMenuForRoleUseCase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MenuConfigPort, useClass: StaticMenuConfigAdapter }],
    });
    useCase = TestBed.inject(GetMenuForRoleUseCase);
  });

  it('SECRETARIA ve exactamente 5 entradas en orden', () => {
    const menu = useCase.execute('SECRETARIA');

    expect(menu.map((i) => [i.label, i.route])).toEqual([
      ['Mis pendientes', '/pendientes'],
      ['Protocolos', '/protocolos'],
      ['Convocatorias', '/convocatorias'],
      ['Reportes', '/reportes'],
      ['Configuración', '/configuracion'],
    ]);
  });

  it('solo "Mis pendientes" lleva el contador de pendientes', () => {
    const withBadge = useCase.execute('SECRETARIA').filter((i) => i.badge === 'pendientes');

    expect(withBadge.map((i) => i.id)).toEqual(['pendientes']);
  });

  // F10 T10-1: menú de los otros roles (spec-ui F10 §3, D2–D4).
  const otherRoles = {
    PRESIDENTE: [
      ['Sesiones del pleno', '/dashboard/resolutions/calls'],
      ['Reportes', '/dashboard/reports/stats'],
    ],
    EVALUADOR: [['Mis evaluaciones', '/dashboard/evaluations/list']],
    INVESTIGADOR: [
      ['Mis protocolos', '/dashboard/investigador/mis-protocolos'],
      ['Nuevo protocolo', '/dashboard/investigador/nuevo-protocolo'],
      ['Subsanaciones', '/dashboard/evaluacion-etica/subsanaciones'],
    ],
  } as const;

  (['PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as const).forEach((role) => {
    it(`${role} ve solo sus entradas de F10, en orden`, () => {
      const menu = useCase.execute(role);

      expect(menu.map((i) => [i.label, i.route])).toEqual(
        otherRoles[role].map(([label, route]) => [label, route]),
      );
      expect(menu.every((i) => !i.roles.includes('SECRETARIA'))).toBeTrue();
    });
  });

  it('filtra por rol usando el port', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MenuConfigPort,
          useValue: {
            getItems: () => [
              { id: 'a', label: 'A', route: '/a', roles: ['EVALUADOR'] },
              { id: 'b', label: 'B', route: '/b', roles: ['EVALUADOR', 'SECRETARIA'] },
            ],
          },
        },
      ],
    });

    expect(
      TestBed.inject(GetMenuForRoleUseCase)
        .execute('SECRETARIA')
        .map((i) => i.id),
    ).toEqual(['b']);
  });
});

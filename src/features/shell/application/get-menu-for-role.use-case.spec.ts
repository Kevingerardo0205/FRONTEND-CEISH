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

  (['PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as const).forEach((role) => {
    it(`${role} tiene el menú vacío por ahora`, () => {
      expect(useCase.execute(role)).toEqual([]);
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

import { MenuItem } from './menu-item.entity';

describe('MenuItem', () => {
  it('admite una entrada con badge de pendientes', () => {
    const item: MenuItem = {
      id: 'pendientes',
      label: 'Mis pendientes',
      route: '/pendientes',
      roles: ['SECRETARIA'],
      icon: 'assignment_late',
      badge: 'pendientes',
    };

    expect(item.badge).toBe('pendientes');
    expect(item.roles).toEqual(['SECRETARIA']);
  });

  it('admite una entrada sin badge', () => {
    const item: MenuItem = {
      id: 'reportes',
      label: 'Reportes',
      route: '/reportes',
      roles: [],
      icon: 'bar_chart',
    };

    expect(item.badge).toBeUndefined();
  });
});

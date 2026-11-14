import { RoleCode } from '@domain/value-objects/role.vo';
import { MENU_ITEMS, StaticMenuConfigAdapter } from './menu.config';

describe('StaticMenuConfigAdapter', () => {
  it('devuelve la configuración estática del menú', () => {
    expect(new StaticMenuConfigAdapter().getItems()).toBe(MENU_ITEMS);
  });

  it('los ids de las entradas no se repiten', () => {
    const ids = MENU_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('conserva las etiquetas y el orden de cada rol', () => {
    const expectedLabels: Record<RoleCode, string[]> = {
      SECRETARIA: ['Mis pendientes', 'Protocolos', 'Convocatorias', 'Reportes', 'Configuración'],
      INVESTIGADOR: ['Mis protocolos', 'Nuevo protocolo', 'Subsanaciones'],
      PRESIDENTE: ['Sesiones del pleno', 'Reportes'],
      EVALUADOR: ['Mis evaluaciones'],
    };

    for (const role of Object.keys(expectedLabels) as RoleCode[]) {
      const labels = MENU_ITEMS.filter((item) => item.roles.includes(role)).map((item) => item.label);
      expect(labels).toEqual(expectedLabels[role]);
    }
  });

  it('cada opción tiene el ícono acordado; los de SECRETARIA son los que ya veía (F10 D5, T10-4)', () => {
    // Copia escrita a mano de la tabla de T10-4; los de SECRETARIA, de getIcon antes de T10-4.
    const expectedIcons: Record<string, string> = {
      pendientes: 'assignment_late',
      protocolos: 'description',
      convocatorias: 'event_note',
      reportes: 'bar_chart',
      configuracion: 'settings',
      'investigador-mis-protocolos': 'description',
      'investigador-nuevo-protocolo': 'note_add',
      'investigador-subsanaciones': 'edit_note',
      'presidente-sesiones': 'groups',
      'presidente-reportes': 'bar_chart',
      'evaluador-evaluaciones': 'fact_check',
    };

    const icons = Object.fromEntries(MENU_ITEMS.map((item) => [item.id, item.icon]));
    expect(icons).toEqual(expectedIcons);
  });

  it('asigna exactamente un rol a cada entrada y no incluye la ruta /dashboard/home', () => {
    expect(MENU_ITEMS.every((item) => item.roles.length === 1)).toBeTrue();
    expect(MENU_ITEMS.some((item) => item.route === '/dashboard/home')).toBeFalse();
  });
});

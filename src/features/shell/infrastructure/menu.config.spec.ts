import { MENU_ITEMS, StaticMenuConfigAdapter } from './menu.config';

describe('StaticMenuConfigAdapter', () => {
  it('devuelve la configuración estática del menú', () => {
    expect(new StaticMenuConfigAdapter().getItems()).toBe(MENU_ITEMS);
  });

  it('los ids de las entradas no se repiten', () => {
    const ids = MENU_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

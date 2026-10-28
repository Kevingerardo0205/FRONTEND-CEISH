import { MenuItem } from '../entities/menu-item.entity';

/** Fuente de la configuración del menú por rol. */
export abstract class MenuConfigPort {
  abstract getItems(): readonly MenuItem[];
}

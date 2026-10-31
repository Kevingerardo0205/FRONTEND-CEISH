import { Injectable, inject } from '@angular/core';
import { MenuItem } from '@domain/entities/menu-item.entity';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { RoleCode } from '@domain/value-objects/role.vo';

@Injectable({ providedIn: 'root' })
export class GetMenuForRoleUseCase {
  private menuConfig = inject(MenuConfigPort);

  execute(role: RoleCode): MenuItem[] {
    return this.menuConfig.getItems().filter((item) => item.roles.includes(role));
  }
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Role, RoleCode } from '@domain/value-objects/role.vo';
import { ActiveRoleFacade } from '../../application/active-role.facade';
import { ROLE_HOME } from '../../domain/role-home';

/**
 * Selector de rol activo (spec-ui F00 §2, criterios 3 y 8).
 * Solo aparece con más de un rol. Al elegir otro rol, cambia el rol activo y navega a su inicio.
 * Vive en el avatar del AppShell y del layout actual (DashboardPage) mientras existan los dos.
 */
@Component({
  selector: 'app-role-selector',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSelectorComponent {
  private readonly activeRoleFacade = inject(ActiveRoleFacade);
  private readonly router = inject(Router);

  readonly activeRole = this.activeRoleFacade.activeRole;
  readonly roles = computed<readonly Role[]>(() => {
    const available = this.activeRoleFacade.availableRoles();
    return Role.all().filter((role) => available.includes(role.code));
  });
  readonly visible = computed(() => this.roles().length > 1);

  select(code: RoleCode): void {
    if (code === this.activeRole()) return;
    if (this.activeRoleFacade.switchRole(code)) {
      this.router.navigateByUrl(ROLE_HOME[code]);
    }
  }
}

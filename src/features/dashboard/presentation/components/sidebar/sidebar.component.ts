import { Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { GetMenuForRoleUseCase } from '@features/shell/application/get-menu-for-role.use-case';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private readonly activeRoleFacade = inject(ActiveRoleFacade);
  private readonly getMenuForRoleUseCase = inject(GetMenuForRoleUseCase);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  isMobile = input<boolean>(false);
  navClick = output<void>();

  readonly activeRole = this.activeRoleFacade.activeRole;
  readonly needsVerification = computed(
    () => this.activeRole() === 'INVESTIGADOR' && !this.authFacade.canEnterInvestigatorArea(),
  );
  readonly menuItems = computed(() => {
    const role = this.activeRole();
    if (!role || this.needsVerification()) return [];
    return this.getMenuForRoleUseCase.execute(role);
  });

  onNavClick(): void {
    this.navClick.emit();
  }

  onLogout(): void {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}

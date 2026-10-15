import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class PermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authFacade = inject(AuthFacade);

  @Input('appHasPermission') requiredPermission!: string | string[];

  constructor() {
    effect(() => {
      const user = this.authFacade.currentUser();
      const permissions = user?.permissions || [];
      
      const hasPermission = Array.isArray(this.requiredPermission)
        ? this.requiredPermission.some(p => permissions.includes(p))
        : permissions.includes(this.requiredPermission);

      this.viewContainer.clear();
      if (hasPermission) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}

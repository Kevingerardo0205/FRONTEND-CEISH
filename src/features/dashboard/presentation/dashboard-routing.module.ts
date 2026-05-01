import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard.page';
import { UserManagementPage } from './pages/user-management.page';
import { InvestigatorHomePage } from './pages/investigator-home.page';
import { ProtocolFormComponent } from '../../protocols/presentation/pages/protocol-form/protocol-form.component';
import { ProtocolValidationListPage } from '../../protocols/presentation/pages/protocol-validation-list/protocol-validation-list.page';
import { ProtocolValidationDetailPage } from '../../protocols/presentation/pages/protocol-validation-detail/protocol-validation-detail.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'investigator',
        component: InvestigatorHomePage
      },
      {
        path: 'admin/users',
        component: UserManagementPage,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'protocols/new',
        component: ProtocolFormComponent
      }, 
      {
        path: 'protocols/validate',
        component: ProtocolValidationListPage,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SECRETARIA'] }
      },
      {
        path: 'protocols/validate/:id',
        component: ProtocolValidationDetailPage,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SECRETARIA'] }
      },
      {
        path: '',
        redirectTo: 'investigator',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

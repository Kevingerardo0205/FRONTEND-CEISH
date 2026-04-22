import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { UserListComponent } from './components/login/login.component';
import { AuthPage } from './pages/auth.page';

const routes: Routes = [
  { path: 'login', component: AuthPage },
  { path: 'admin-usuarios', component: UserListComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }

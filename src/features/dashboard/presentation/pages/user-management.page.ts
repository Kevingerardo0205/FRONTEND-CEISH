import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListComponent } from '../../../auth/components/login/login.component';
import { RegisterComponent } from '../../../auth/components/register/register.component';
import { User } from '@domain/entities/user.entity';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    UserListComponent,
    RegisterComponent
  ],
  template: `
    <div class="user-management-container">
      <div class="grid">
        <div class="col-list">
          <app-user-list #userList (editUser)="onEditUser($event)"></app-user-list>
        </div>
        <div class="col-form">
          <app-user-register 
            [userToEdit]="selectedUser" 
            (saved)="onSaved()" 
            (cancel)="onCancel()">
          </app-user-register>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start; }
    @media (max-width: 1024px) {
      .grid { grid-template-columns: 1fr; }
    }
  `]
})
export class UserManagementPage {
  @ViewChild('userList') userList!: UserListComponent;
  selectedUser: User | null = null;

  onEditUser(user: User) {
    this.selectedUser = user;
  }

  onSaved() {
    this.selectedUser = null;
    this.userList.refresh();
  }

  onCancel() {
    this.selectedUser = null;
  }
}

import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListComponent } from '@features/auth/presentation/components/user-list/user-list.component';
import { UserFormComponent } from '@features/auth/presentation/components/user-form/user-form.component';
import { User } from '@domain/entities/user.entity';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    UserListComponent,
    UserFormComponent,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>Gestión de Usuarios</h1>
        <p>Administre los accesos y roles del personal institucional.</p>
      </div>
      <button mat-flat-button color="primary" (click)="onNewUser()">
        <mat-icon>person_add</mat-icon>
        Nuevo Usuario
      </button>
    </div>

    <div class="user-management-grid">
      <div class="list-section">
        <app-user-list #userList (editUser)="onEditUser($event)"></app-user-list>
      </div>
      <div class="form-section">
        <app-user-form 
          [userToEdit]="selectedUser" 
          (saved)="onSaved()" 
          (cancel)="onCancel()">
        </app-user-form>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 { margin: 0; font-size: 1.75rem; font-weight: 700; color: #0f172a; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .user-management-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 1280px) {
      .user-management-grid { grid-template-columns: 1fr; }
      .form-section { order: -1; }
    }
  `]
})
export class UserManagementPage {
  @ViewChild('userList') userList!: UserListComponent;
  selectedUser: User | null = null;

  onEditUser(user: User) {
    this.selectedUser = user;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onNewUser() {
    this.selectedUser = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSaved() {
    this.selectedUser = null;
    this.userList.refresh();
  }

  onCancel() {
    this.selectedUser = null;
  }
}

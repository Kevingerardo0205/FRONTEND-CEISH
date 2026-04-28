import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { UserTableComponent } from '../components/user-table/user-table.component';
import { UserRegistrationFormComponent } from '../components/user-form/user-form.component';
import { GetUsersAdminUseCase, RegisterUserAdminUseCase } from '@features/dashboard';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    StatCardComponent, 
    UserTableComponent, 
    UserRegistrationFormComponent
  ],
  template: `
    <div class="dashboard-admin-container">
      
      <header class="main-header">
        <div class="header-info">
          <h1>Panel de Administración</h1>
          <p>Gestión centralizada de profesionales y accesos</p>
        </div>
        <button mat-flat-button color="primary" class="header-btn" (click)="onNewUser()">
          <mat-icon>add</mat-icon>
          Nuevo Usuario
        </button>
      </header>

      <!-- KPI Section -->
      <section class="kpi-grid">
        <app-stat-card label="Total Usuarios" [value]="users().length" icon="people" color="#4DB6AC"></app-stat-card>
        <app-stat-card label="Protocolos Activos" value="24" icon="bolt" color="#0288d1"></app-stat-card>
        <app-stat-card label="En Evaluación" value="8" icon="visibility" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Aprobados" value="156" icon="check_circle" color="#10b981"></app-stat-card>
      </section>

      <!-- Management Section -->
      <div class="management-layout">
        <main class="table-section">
          <app-user-table 
            [users]="users()" 
            (edit)="onEdit($event)"
            (delete)="onDelete($event)">
          </app-user-table>
        </main>

        <aside class="form-section" id="userFormSection">
          <app-user-registration-form 
            [userToEdit]="selectedUser()" 
            (save)="onSave($event)" 
            (cancel)="onCancel()">
          </app-user-registration-form>
        </aside>
      </div>
    </div>
  `,
  styleUrls: ['./user-management.page.scss']
})
export class UserManagementPage implements OnInit {
  private getUsersUseCase = inject(GetUsersAdminUseCase);
  private registerUseCase = inject(RegisterUserAdminUseCase);
  private dialog = inject(MatDialog);

  // Signals para el estado
  users = signal<UserAdmin[]>([]);
  selectedUser = signal<UserAdmin | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.getUsersUseCase.execute().subscribe((data: UserAdmin[]) => this.users.set(data));
  }

  onSave(user: UserAdmin) {
    this.registerUseCase.execute(user).subscribe(() => {
      this.loadUsers();
      this.selectedUser.set(null);
    });
  }

  onEdit(user: UserAdmin) {
    this.selectedUser.set(user);
    this.scrollToForm();
  }

  onDelete(user: UserAdmin) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Revocar Acceso',
        message: `¿Está seguro de que desea revocar el acceso a ${user.nombre}? Esta acción impedirá que el profesional ingrese al sistema.`,
        confirmText: 'Revocar Acceso',
        cancelText: 'Mantener',
        type: 'warn',
        icon: 'person_remove'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí iría la llamada al caso de uso para eliminar/desactivar
        console.log('Acceso revocado para:', user.email);
        // Simulamos actualización tras borrar (solo para visualización actual)
        this.users.set(this.users().filter(u => u.email !== user.email));
      }
    });
  }

  onNewUser() {
    this.selectedUser.set(null);
    this.scrollToForm();
  }

  onCancel() {
    this.selectedUser.set(null);
  }

  private scrollToForm() {
    const element = document.getElementById('userFormSection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

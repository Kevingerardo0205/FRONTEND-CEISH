import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { UserTableComponent } from '../components/user-table/user-table.component';
import { UserRegistrationFormComponent } from '../components/user-form/user-form.component';
import { 
  GetUsersAdminUseCase, 
  RegisterUserAdminUseCase, 
  UpdateUserAdminUseCase,
  DeleteUserAdminUseCase,
  ExtendTemporaryRoleUseCase,
  SuspendTemporaryRoleUseCase,
  SendConfirmationEmailUseCase
} from '@features/dashboard/use-cases';
import { UserAdmin, UserRoleItem } from '@domain/entities/user-admin.entity';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ExtendRoleDialogComponent } from '../components/extend-role-dialog/extend-role-dialog.component';
import { SuspendRoleDialogComponent } from '../components/suspend-role-dialog/suspend-role-dialog.component';

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
    <div class="dashboard-admin-container animate-fade-in">
      
      <header class="main-header">
        <div class="header-info">
          <div class="breadcrumb-chip">Administración / Usuarios</div>
          <h1>Gestión de Profesionales</h1>
          <p>Supervise los accesos y roles del personal del CEISH</p>
        </div>
        <button mat-flat-button color="primary" class="premium-add-btn" (click)="onNewUser()">
          <mat-icon>person_add</mat-icon>
          Nuevo Usuario
        </button>
      </header>

      <!-- KPI Section -->
      <section class="kpi-grid mb-5">
        <app-stat-card label="Total Usuarios" [value]="users().length" icon="people" color="#003366"></app-stat-card>
        <app-stat-card label="Personal Activo" [value]="activeCount()" icon="how_to_reg" color="#10b981"></app-stat-card>
        <app-stat-card label="Roles Definidos" value="5" icon="admin_panel_settings" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Última Actividad" value="Hoy" icon="history" color="#6366f1"></app-stat-card>
      </section>

      <!-- Management Section -->
      <div class="management-layout">
        <main class="table-section shadow-soft">
          <div class="table-header">
            <div class="filter-tabs">
              <button 
                class="tab-btn" 
                [class.active]="filterMode() === 'COMITE'" 
                (click)="filterMode.set('COMITE')">
                Miembros del Comité / Admin
              </button>
              <button 
                class="tab-btn" 
                [class.active]="filterMode() === 'INVESTIGADOR'" 
                (click)="filterMode.set('INVESTIGADOR')">
                Investigadores Principales
              </button>
            </div>
            
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input 
                type="text" 
                placeholder="Filtrar por nombre..." 
                (input)="onSearch($event)">
            </div>
          </div>
          
          <app-user-table 
            [users]="filteredUsers()" 
            (edit)="onEdit($event)"
            (delete)="onDelete($event)"
            (extendRole)="onExtendRole($event)"
            (suspendRole)="onSuspendRole($event)"
            (resendInvitation)="onResendInvitation($event)">
          </app-user-table>
        </main>

        <aside class="form-section" id="userFormSection">
          <app-user-registration-form 
            [userToEdit]="selectedUser()" 
            [forcedRole]="filterMode() === 'INVESTIGADOR' ? 'INVESTIGADOR' : null"
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
  private getUsersUseCase: GetUsersAdminUseCase = inject(GetUsersAdminUseCase);
  private registerUseCase: RegisterUserAdminUseCase = inject(RegisterUserAdminUseCase);
  private updateUseCase: UpdateUserAdminUseCase = inject(UpdateUserAdminUseCase);
  private deleteUseCase: DeleteUserAdminUseCase = inject(DeleteUserAdminUseCase);
  private extendUseCase: ExtendTemporaryRoleUseCase = inject(ExtendTemporaryRoleUseCase);
  private suspendUseCase: SuspendTemporaryRoleUseCase = inject(SuspendTemporaryRoleUseCase);
  private sendConfirmationEmailUseCase: SendConfirmationEmailUseCase = inject(SendConfirmationEmailUseCase);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<UserAdmin[]>([]);
  selectedUser = signal<UserAdmin | null>(null);
  activeCount = signal<number>(0);
  
  // Filtering state
  filterMode = signal<'COMITE' | 'INVESTIGADOR'>('COMITE');
  searchQuery = signal<string>('');

  filteredUsers = computed(() => {
    const allUsers = this.users();
    const query = this.searchQuery().toLowerCase().trim();
    const mode = this.filterMode();

    return allUsers.filter(user => {
      // Búsqueda por nombre o email
      const matchesSearch = 
        user.nombre.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query) ||
        (user.cedula && user.cedula.includes(query));
      
      const isInvestigador = user.rol === 'INVESTIGADOR';
      
      if (mode === 'INVESTIGADOR') {
        return matchesSearch && isInvestigador;
      } else {
        // Miembros del comité: Todos los que NO son investigadores
        return matchesSearch && !isInvestigador;
      }
    });
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.getUsersUseCase.execute().subscribe((data: UserAdmin[]) => {
      this.users.set(data);
      this.activeCount.set(data.filter(u => u.activo !== false).length);
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onSave(user: UserAdmin) {
    const operation = user.id 
      ? this.updateUseCase.execute(user.id, user)
      : this.registerUseCase.execute(user);

    operation.subscribe({
      next: () => {
        this.snackBar.open(`✅ Usuario ${user.id ? 'actualizado' : 'registrado'} con éxito`, 'Cerrar', { duration: 4000 });
        this.loadUsers();
        this.selectedUser.set(null);
      },
      error: (err: any) => {
        console.error('[UserManagementPage] Error en onSave:', err);
        let message = 'Error al procesar la solicitud del usuario';
        if (err?.error) {
          if (typeof err.error === 'string') {
            message = err.error;
          } else if (Array.isArray(err.error.message)) {
            message = err.error.message.join(', ');
          } else if (typeof err.error.message === 'string') {
            message = err.error.message;
          } else if (err.error.error) {
            message = err.error.error;
          }
        } else if (err?.message) {
          message = err.message;
        }
        this.snackBar.open(`❌ ${message}`, 'Entendido', { duration: 6000 });
      }
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
        message: `¿Está seguro de que desea revocar el acceso a ${user.nombre}? El profesional ya no podrá ingresar al sistema.`,
        confirmText: 'Revocar Acceso',
        cancelText: 'Mantener',
        type: 'warn',
        icon: 'person_remove'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && user.id) {
        this.deleteUseCase.execute(user.id).subscribe(() => {
          this.snackBar.open('🚫 Acceso revocado correctamente', 'Cerrar', { duration: 4000 });
          this.loadUsers();
        });
      }
    });
  }

  onExtendRole(event: { user: UserAdmin; role: UserRoleItem }) {
    if (!event.user.id) return;
    const dialogRef = this.dialog.open(ExtendRoleDialogComponent, {
      width: '520px',
      data: {
        userId: event.user.id,
        userName: event.user.nombre,
        roleCode: event.role.code,
        roleName: event.role.name,
        currentValidUntil: event.role.validUntil
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && event.user.id) {
        this.extendUseCase.execute(event.user.id, event.role.code, result.validUntil, result.reason).subscribe({
          next: () => {
            this.snackBar.open(`⏱️ Vigencia de suplencia prorrogada exitosamente hasta el ${result.validUntil}`, 'Cerrar', { duration: 4000 });
            this.loadUsers();
          },
          error: (err: { error?: { message?: string | string[] } }) => {
            const msg = Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message;
            this.snackBar.open(`❌ ${msg || 'Error al prorrogar suplencia'}`, 'Entendido', { duration: 5000 });
          }
        });
      }
    });
  }

  onSuspendRole(event: { user: UserAdmin; role: UserRoleItem }) {
    if (!event.user.id) return;
    const dialogRef = this.dialog.open(SuspendRoleDialogComponent, {
      width: '500px',
      data: {
        userId: event.user.id,
        userName: event.user.nombre,
        roleCode: event.role.code,
        roleName: event.role.name,
        validUntil: event.role.validUntil
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && event.user.id) {
        this.suspendUseCase.execute(event.user.id, event.role.code, result.reason).subscribe({
          next: () => {
            this.snackBar.open(`🚫 Suplencia temporal finalizada y registrada en auditoría`, 'Cerrar', { duration: 4000 });
            this.loadUsers();
          },
          error: (err: { error?: { message?: string | string[] } }) => {
            const msg = Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message;
            this.snackBar.open(`❌ ${msg || 'Error al suspender suplencia'}`, 'Entendido', { duration: 5000 });
          }
        });
      }
    });
  }

  onResendInvitation(user: UserAdmin) {
    this.sendConfirmationEmailUseCase.execute(user.email).subscribe({
      next: () => {
        this.snackBar.open(`✉️ Correo de invitación / verificación enviado a ${user.email}`, 'Cerrar', { duration: 4000 });
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        const msg = Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message;
        this.snackBar.open(`❌ ${msg || 'Error al reenviar correo de invitación'}`, 'Entendido', { duration: 5000 });
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

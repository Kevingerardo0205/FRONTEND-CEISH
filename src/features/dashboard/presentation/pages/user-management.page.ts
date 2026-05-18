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
  DeleteUserAdminUseCase
} from '@features/dashboard/use-cases';
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
          <div class="section-toolbar">
            <div class="title-group">
              <h2 class="section-title">Listado de Personal</h2>
              <div class="filter-pills">
                <button 
                  [class.active]="filterMode() === 'COMITE'" 
                  (click)="filterMode.set('COMITE')">
                  Miembros del Comité
                </button>
                <button 
                  [class.active]="filterMode() === 'INVESTIGADOR'" 
                  (click)="filterMode.set('INVESTIGADOR')">
                  Investigadores
                </button>
              </div>
            </div>
            <div class="spacer"></div>
            <div class="search-mini">
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
  private updateUseCase = inject(UpdateUserAdminUseCase);
  private deleteUseCase = inject(DeleteUserAdminUseCase);
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
      error: () => {
        this.snackBar.open('❌ Error al procesar la solicitud', 'Entendido', { duration: 5000 });
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

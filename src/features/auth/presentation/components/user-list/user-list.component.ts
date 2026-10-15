import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GetUsersUseCase, DeleteUserUseCase } from '../../../use-cases';
import { User } from '@domain/entities/user.entity';
import { NotificationService } from '@infrastructure/services/notification.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="minimal-list-container">
      <div class="table-header-row">
        <h2 class="table-title">Usuarios del sistema</h2>
        <span class="table-count">{{ users.length }} usuarios registrados</span>
      </div>

      <div class="minimal-table-wrapper">
        <table mat-table [dataSource]="users">
          
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre y Cargo </th>
            <td mat-cell *matCellDef="let user"> 
              <div class="user-cell">
                <div class="user-avatar-mini">{{ user.nombre[0] }}</div>
                <div class="user-data">
                  <span class="user-name">{{user.nombre}}</span>
                  <span class="user-sub">{{user.perfil || 'Sin cargo'}}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef> Email </th>
            <td mat-cell *matCellDef="let user"> 
              <span class="email-text">{{user.email}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef> Rol </th>
            <td mat-cell *matCellDef="let user"> 
              <span class="minimal-badge" [ngClass]="user.rol.toLowerCase()">{{user.rol}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-right"> Acciones </th>
            <td mat-cell *matCellDef="let user" class="text-right">
              <div class="action-buttons">
                <button mat-icon-button (click)="onEdit(user)" matTooltip="Editar">
                  <mat-icon class="icon-small">edit</mat-icon>
                </button>
                <button mat-icon-button (click)="onDelete(user)" matTooltip="Eliminar">
                  <mat-icon class="icon-small text-warn">delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center empty-cell" colspan="4">
              <p>No hay usuarios registrados.</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .minimal-list-container {
      background-color: transparent;
    }

    .table-header-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5rem;
      padding: 0 0.5rem;
      
      .table-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
      .table-count { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    }

    .minimal-table-wrapper {
      border-top: 1px solid rgba(0, 0, 0, 0.03);
    }

    table {
      width: 100%;
      background: transparent;
      border-collapse: collapse;

      th { 
        padding-top: 1.5rem;
        padding-bottom: 1rem;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #94a3b8;
        font-weight: 700;
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
      }

      td { 
        padding: 1.25rem 0.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
      }

      tr:hover td { background-color: rgba(0, 0, 0, 0.01); }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 1rem;

      .user-avatar-mini {
        width: 32px;
        height: 32px;
        background-color: #f8fafc;
        border: 1px solid rgba(0, 0, 0, 0.04);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569;
      }

      .user-data {
        display: flex;
        flex-direction: column;
        .user-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
        .user-sub { font-size: 0.75rem; color: #94a3b8; }
      }
    }

    .email-text { font-size: 0.875rem; color: #64748b; }

    .minimal-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: #f1f5f9;
      color: #64748b;

      &.admin { background-color: #f8fafc; color: #0f172a; border: 1px solid rgba(0,0,0,0.05); }
      &.investigador { background-color: #eff6ff; color: #2563eb; }
      &.evaluador { background-color: #f0fdf4; color: #16a34a; }
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
      
      button { 
        color: #94a3b8;
        &:hover { background-color: #f8fafc; color: #0f172a; }
      }
      .text-warn:hover { color: #ef4444; background-color: #fef2f2; }
    }

    .icon-small { font-size: 18px; width: 18px; height: 18px; }
    .text-right { text-align: right; }
    .empty-cell { padding: 4rem !important; color: #94a3b8; text-align: center; font-style: italic; }
  `]
})
export class UserListComponent implements OnInit {
  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly deleteUserUseCase = inject(DeleteUserUseCase);
  private readonly notifyService = inject(NotificationService);

  users: User[] = [];
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'acciones'];
  @Output() editUser = new EventEmitter<User>();

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.getUsersUseCase.execute().subscribe((users: User[]) => this.users = users);
  }

  onDelete(user: User): void {
    this.notifyService.confirm({
      title: 'Eliminar Usuario',
      message: `¿Está seguro de que desea eliminar a ${user.nombre}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    }).subscribe(confirmed => {
      if (confirmed && user.id) {
        this.deleteUserUseCase.execute(user.id).subscribe(() => {
          this.notifyService.notify('Usuario eliminado correctamente', 'success');
          this.refresh();
        });
      }
    });
  }

  onEdit(user: User): void {
    this.editUser.emit(user);
  }
}

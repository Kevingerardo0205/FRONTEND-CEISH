import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserAdmin } from '@domain/entities/user-admin.entity';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="users()">
        
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef> Profesional </th>
          <td mat-cell *matCellDef="let user"> 
            <div class="professional-cell">
              <div class="avatar-box">{{ user.nombre[0] }}</div>
              <div class="info">
                <span class="name">{{ user.nombre }}</span>
                <span class="sub">{{ user.perfil }}</span>
              </div>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef> Contacto </th>
          <td mat-cell *matCellDef="let user"> {{ user.email }} </td>
        </ng-container>

        <ng-container matColumnDef="rol">
          <th mat-header-cell *matHeaderCellDef> Permisos </th>
          <td mat-cell *matCellDef="let user"> 
            <span class="badge" [ngClass]="user.rol.toLowerCase()">
              {{ user.rol }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef class="text-right"> Gestión </th>
          <td mat-cell *matCellDef="let user" class="text-right">
            <button mat-icon-button class="action-btn edit" (click)="edit.emit(user)" matTooltip="Editar profesional">
              <mat-icon>edit_note</mat-icon>
            </button>
            <button mat-icon-button class="action-btn delete" (click)="delete.emit(user)" matTooltip="Revocar acceso">
              <mat-icon>remove_circle_outline</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      background: white;
      border-radius: 20px;
      padding: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 0.5rem;
    }

    th {
      border: none;
      color: #94a3b8;
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 1.5rem 1rem;
    }

    td {
      border: none;
      padding: 1.5rem 1rem;
      background: transparent;
      color: #475569;
      font-size: 0.9rem;
      border-bottom: 1px solid #f8fafc;
    }

    .professional-cell {
      display: flex;
      align-items: center;
      gap: 1.25rem;

      .avatar-box {
        width: 40px;
        height: 40px;
        background: #f1f5f9;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #4DB6AC;
      }

      .info {
        display: flex;
        flex-direction: column;
        .name { font-weight: 700; color: #0f172a; }
        .sub { font-size: 0.75rem; color: #94a3b8; }
      }
    }

    .badge {
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      background: #f1f5f9;
      
      &.admin { background: #e0f2f1; color: #00796b; }
      &.investigador { background: #e3f2fd; color: #1565c0; }
      &.evaluador { background: #fff3e0; color: #e65100; }
    }

    .action-btn {
      color: #cbd5e1;
      transition: all 0.2s ease;
      &:hover { color: #0f172a; background: #f8fafc; }
      &.delete:hover { color: #ef4444; background: #fef2f2; }
    }

    .text-right { text-align: right; }
  `]
})
export class UserTableComponent {
  users = input.required<UserAdmin[]>();
  edit = output<UserAdmin>();
  delete = output<UserAdmin>();
  displayedColumns = ['nombre', 'email', 'rol', 'acciones'];
}

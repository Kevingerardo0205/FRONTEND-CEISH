import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { GetUsersUseCase, DeleteUserUseCase } from '../../../use-cases';
import { User } from '@domain/entities/user.entity';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="user-list-card mat-elevation-z2">
      <mat-card-header>
        <mat-card-title>Usuarios Registrados</mat-card-title>
        <mat-card-subtitle>Gestión y control de accesos al sistema</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="table-container">
          <table mat-table [dataSource]="users" class="full-width-table">
            
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let user"> 
                <div class="user-info-cell">
                  <span class="user-name">{{user.nombre}}</span>
                  <span class="user-id">ID: {{user.id?.substring(0,8)}}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef> Email </th>
              <td mat-cell *matCellDef="let user"> {{user.email}} </td>
            </ng-container>

            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef> Rol </th>
              <td mat-cell *matCellDef="let user"> 
                <span class="role-badge" [ngClass]="user.rol.toLowerCase()">{{user.rol}}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-right"> Acciones </th>
              <td mat-cell *matCellDef="let user" class="text-right">
                <button mat-icon-button color="primary" (click)="onEdit(user)" matTooltip="Editar usuario">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDelete(user.id!)" matTooltip="Eliminar usuario">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell text-center" colspan="4" style="padding: 3rem;">
                <mat-icon class="empty-state-icon">group_off</mat-icon>
                <p>No hay usuarios registrados en el sistema.</p>
              </td>
            </tr>
          </table>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .user-list-card { border-radius: 12px; overflow: hidden; }
    .full-width-table { width: 100%; }
    .table-container { overflow-x: auto; margin-top: 1rem; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .user-info-cell { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1e293b; }
    .user-id { font-size: 0.7rem; color: #94a3b8; }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .admin { background-color: #e0e7ff; color: #3730a3; }
    .investigador { background-color: #dbeafe; color: #1e40af; }
    .evaluador { background-color: #dcfce7; color: #166534; }
    .secretaria { background-color: #fef3c7; color: #92400e; }
    .presidenta { background-color: #fae8ff; color: #86198f; }

    .empty-state-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 1rem; }
  `]
})
export class UserListComponent implements OnInit {
  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly deleteUserUseCase = inject(DeleteUserUseCase);

  users: User[] = [];
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'acciones'];
  @Output() editUser = new EventEmitter<User>();

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.getUsersUseCase.execute().subscribe((users: User[]) => this.users = users);
  }

  onDelete(id: string): void {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      this.deleteUserUseCase.execute(id).subscribe(() => this.refresh());
    }
  }

  onEdit(user: User): void {
    this.editUser.emit(user);
  }
}

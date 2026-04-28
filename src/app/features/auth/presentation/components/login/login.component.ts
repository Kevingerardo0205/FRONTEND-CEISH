import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GetUsersUseCase, DeleteUserUseCase } from '../../../application/use-cases/get-users.use-case';
import { User } from '../../../domain/entities/user.entity';

@Component({
  selector: 'app-user-list',
  template: `
    <mat-card class="mat-elevation-z4">
      <mat-card-header>
        <mat-card-title>Usuarios Registrados</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="table-container">
          <table mat-table [dataSource]="users" class="full-width-table">
            
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let user"> {{user.nombre}} </td>
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
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
              <td mat-cell *matCellDef="let user">
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
              <td class="mat-cell text-center" colspan="4" style="padding: 2rem;">No hay usuarios registrados.</td>
            </tr>
          </table>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .full-width-table {
      width: 100%;
    }
    .table-container {
      overflow-x: auto;
      margin-top: 1rem;
    }
    .text-center {
      text-align: center;
    }
    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .admin { background-color: #e0e7ff; color: #0f172a; }
    .investigador { background-color: #dbeafe; color: #1e40af; }
    .evaluador { background-color: #dcfce7; color: #166534; }
    .secretaria { background-color: #fef3c7; color: #166534; }
    .presidenta { background-color: #fae8ff; color: #854d0e; }
  `],
  standalone: false
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'acciones'];
  @Output() editUser = new EventEmitter<User>();

  constructor(
    private getUsersUseCase: GetUsersUseCase,
    private deleteUserUseCase: DeleteUserUseCase
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.getUsersUseCase.execute().subscribe(users => this.users = users);
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

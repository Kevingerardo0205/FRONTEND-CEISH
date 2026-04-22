import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GetUsersUseCase, DeleteUserUseCase } from '../../../application/use-cases/get-users.use-case';
import { User } from '../../../domain/entities/user.entity';

@Component({
  selector: 'app-user-list',
  template: `
    <div class="card">
      <h3 class="mb-1">Usuarios Registrados</h3>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.nombre }}</td>
              <td>{{ user.email }}</td>
              <td><span class="badge badge-primary">{{ user.rol }}</span></td>
              <td class="gap-1" style="display: flex;">
                <button class="btn btn-warning" (click)="onEdit(user)">Editar</button>
                <button class="btn btn-danger" (click)="onDelete(user.id!)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="users.length === 0" class="no-data text-center mt-1">
        No hay usuarios registrados.
      </div>
    </div>
  `,
  styles: [`
    .table-responsive { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 0.8rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .table th { background-color: #f8fafc; font-weight: 600; color: #475569; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; }
    .badge-primary { background-color: #e0f2fe; color: #0369a1; }
    .no-data { color: #64748b; padding: 2rem; }
  `],
  standalone: false
})
export class UserListComponent implements OnInit {
  users: User[] = [];
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

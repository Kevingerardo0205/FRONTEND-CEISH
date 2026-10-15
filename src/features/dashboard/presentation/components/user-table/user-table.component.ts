import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { UserAdmin, UserRoleItem } from '@domain/entities/user-admin.entity';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule, MatMenuModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="users()">
        
        <ng-container matColumnDef="cedula">
          <th mat-header-cell *matHeaderCellDef> ID / Cédula </th>
          <td mat-cell *matCellDef="let user" class="fw-bold"> {{ user.cedula || '---' }} </td>
        </ng-container>

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
          <th mat-header-cell *matHeaderCellDef> Roles / Suplencias </th>
          <td mat-cell *matCellDef="let user"> 
            <div class="roles-container">
              <ng-container *ngFor="let r of getUserRoles(user)">
                <!-- ROL PERMANENTE -->
                <span *ngIf="!r.validUntil" 
                      class="badge" 
                      [ngClass]="r.code.toLowerCase()"
                      [matTooltip]="getRoleTooltip(r)">
                  {{ r.name || r.code }}
                </span>

                <!-- ROL TEMPORAL CON MENÚ DE ACCIÓN RÁPIDA -->
                <span *ngIf="r.validUntil" 
                      class="badge temporal-interactive-badge" 
                      [ngClass]="[r.code.toLowerCase(), r.isExpired ? 'expired' : 'temporal']"
                      [matTooltip]="getRoleTooltip(r)"
                      [matMenuTriggerFor]="roleMenu">
                  <span *ngIf="!r.isExpired" class="temporal-icon">⏳</span>
                  <span *ngIf="r.isExpired" class="expired-icon">⌛</span>
                  {{ r.name || r.code }}
                  <span *ngIf="!r.validUntil && !r.isExpired" class="temporal-tag">({{ formatDate(r.validUntil) }})</span>
                  <span *ngIf="r.validUntil && !r.isExpired" class="temporal-tag">({{ formatDate(r.validUntil) }})</span>
                  <span *ngIf="r.isExpired" class="expired-tag">(Expirado)</span>
                  <mat-icon class="badge-arrow">expand_more</mat-icon>
                </span>

                <mat-menu #roleMenu="matMenu" class="role-context-menu">
                  <button mat-menu-item (click)="extendRole.emit({ user: user, role: r })">
                    <mat-icon class="text-teal">more_time</mat-icon>
                    <span>Prorrogar Vigencia...</span>
                  </button>
                  <button mat-menu-item (click)="suspendRole.emit({ user: user, role: r })" *ngIf="!r.isExpired">
                    <mat-icon class="text-danger">cancel_schedule_send</mat-icon>
                    <span>Suspender Suplencia</span>
                  </button>
                </mat-menu>
              </ng-container>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef> Estado </th>
          <td mat-cell *matCellDef="let user"> 
            <div class="status-chip" [ngClass]="user.activo !== false ? 'active' : 'inactive'">
              <span class="dot"></span>
              {{ user.activo !== false ? 'Activo' : 'Revocado' }}
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef class="text-right"> Gestión </th>
          <td mat-cell *matCellDef="let user" class="text-right">
            <button mat-icon-button class="action-btn email" (click)="resendInvitation.emit(user)" matTooltip="Reenviar correo de verificación / invitación">
              <mat-icon class="text-teal">forward_to_inbox</mat-icon>
            </button>
            <button mat-icon-button class="action-btn edit" (click)="edit.emit(user)" matTooltip="Editar profesional">
              <mat-icon>edit_note</mat-icon>
            </button>
            <button mat-icon-button class="action-btn delete" (click)="delete.emit(user)" matTooltip="Revocar acceso">
              <mat-icon>{{ user.activo !== false ? 'remove_circle_outline' : 'settings_backup_restore' }}</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styleUrl: './user-table.component.scss'
})
export class UserTableComponent {
  users = input.required<UserAdmin[]>();
  edit = output<UserAdmin>();
  delete = output<UserAdmin>();
  extendRole = output<{ user: UserAdmin; role: UserRoleItem }>();
  suspendRole = output<{ user: UserAdmin; role: UserRoleItem }>();
  resendInvitation = output<UserAdmin>();
  displayedColumns = ['cedula', 'nombre', 'email', 'rol', 'estado', 'acciones'];

  getUserRoles(user: UserAdmin): UserRoleItem[] {
    if (user.userRoles && user.userRoles.length > 0) {
      return user.userRoles;
    }
    return [{
      code: (user.rol || '').toUpperCase(),
      name: (user.rol || '').toUpperCase()
    }];
  }

  getRoleTooltip(role: UserRoleItem): string {
    if (!role.validUntil) return `Rol permanente: ${role.name || role.code}`;
    const dateStr = this.formatDate(role.validUntil);
    if (role.isExpired) {
      return `⌛ Suplencia finalizada el ${dateStr}${role.reason ? ' (' + role.reason + ')' : ''}`;
    }
    return `⏳ Suplencia temporal vigente hasta ${dateStr}${role.reason ? ' - Motivo: ' + role.reason : ''}`;
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SecurityRole,
  SecurityPermission,
  RoleComplianceStatus,
} from '@domain/entities/security.entity';
import {
  RolePermissionsState,
  ModulePermissionGroup,
} from '../../../application/role-permissions.state';

@Component({
  selector: 'app-role-matrix',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="matrix-container animate-fade-in">
      <!-- ========================================== -->
      <!-- COLUMNA IZQUIERDA: ROLES DEL SISTEMA       -->
      <!-- ========================================== -->
      <aside class="roles-sidebar glass-panel">
        <div class="sidebar-header">
          <div class="header-main">
            <div class="title-wrap">
              <mat-icon class="title-icon">admin_panel_settings</mat-icon>
              <h3 class="sidebar-title">Roles del Sistema</h3>
            </div>
            <button
              mat-mini-fab
              color="primary"
              class="add-role-btn"
              matTooltip="Crear Nuevo Rol"
              (click)="onCreateRoleClick()"
            >
              <mat-icon>add</mat-icon>
            </button>
          </div>
          <p class="sidebar-subtitle">Perfiles configurados en la plataforma</p>
        </div>

        <div class="roles-list custom-scrollbar">
          @for (role of state.roles(); track role.id) {
            <div
              class="role-card-item"
              [class.active]="state.selectedRoleId() === role.id"
              (click)="onRoleClick(role.id)"
            >
              <div class="role-avatar" [class.inactive-avatar]="role.isActive === false">
                {{ role.name.charAt(0).toUpperCase() }}
              </div>

              <div class="role-info">
                <div class="name-row">
                  <span class="role-name">{{ role.name }}</span>
                  @if (role.isActive === false) {
                    <span class="inactive-badge">Inactivo</span>
                  }
                </div>

                <div class="role-meta-row">
                  <span class="role-perms-count">
                    <mat-icon class="perms-mini-icon">verified_user</mat-icon>
                    {{ getRolePermCount(role) }} permisos
                  </span>

                  @if (getRoleCompliance(role.id); as comp) {
                    <span
                      class="mini-compliance-badge"
                      [class.comp-standard]="comp.status === 'STANDARD'"
                      [class.comp-custom]="comp.status === 'CUSTOM'"
                    >
                      {{ comp.status === 'STANDARD' ? 'Estándar' : 'Personalizado' }}
                    </span>
                  }
                </div>
              </div>

              <!-- Menú de opciones del rol -->
              <button
                mat-icon-button
                class="role-menu-btn"
                [matMenuTriggerFor]="roleMenu"
                (click)="$event.stopPropagation()"
              >
                <mat-icon>more_vert</mat-icon>
              </button>

              <mat-menu #roleMenu="matMenu" xPosition="before" class="custom-role-menu">
                <button mat-menu-item (click)="onEditRoleClick(role)">
                  <mat-icon color="primary">edit</mat-icon>
                  <span>Editar Datos del Rol</span>
                </button>
                <button mat-menu-item (click)="onDeleteRoleClick(role)" class="danger-menu-item">
                  <mat-icon color="warn">person_remove</mat-icon>
                  <span>Desactivar Rol</span>
                </button>
              </mat-menu>
            </div>
          }
        </div>
      </aside>

      <!-- ========================================== -->
      <!-- COLUMNA DERECHA: MATRIZ DE PERMISOS        -->
      <!-- ========================================== -->
      <main class="permissions-area glass-panel">
        @if (state.selectedRoleId(); as selectedId) {
          <!-- Barra Superior de Control y Búsqueda -->
          <div class="area-navbar">
            <div class="nav-info">
              <div class="badge-row">
                <span class="nav-badge">MODO ASIGNACIÓN</span>

                <!-- Insignia de Cumplimiento Normativo CEISH -->
                @if (state.selectedRoleCompliance(); as comp) {
                  <span
                    class="compliance-pill"
                    [class.compliant-pill]="comp.status === 'STANDARD'"
                    [class.custom-pill]="comp.status === 'CUSTOM'"
                    [matTooltip]="getComplianceTooltip(comp)"
                  >
                    <mat-icon>{{ comp.status === 'STANDARD' ? 'verified' : 'tune' }}</mat-icon>
                    <span>{{
                      comp.status === 'STANDARD'
                        ? 'Cumple Normativa CEISH'
                        : 'Configuración Personalizada'
                    }}</span>
                  </span>
                }

                @if (state.isDirty()) {
                  <span class="dirty-badge animate-pulse">
                    <mat-icon>edit_note</mat-icon>
                    Cambios sin guardar ({{ state.diffSummary().total }})
                  </span>
                }
              </div>
              <h2>{{ state.selectedRole()?.name }}</h2>
              <p class="role-code-desc">
                <code>{{ state.selectedRole()?.code }}</code> ·
                {{ state.selectedRole()?.description || 'Sin descripción detallada' }}
              </p>
            </div>

            <div class="nav-actions">
              <!-- Buscador Rápido -->
              <div class="search-box">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                  type="text"
                  [ngModel]="state.searchQuery()"
                  (ngModelChange)="state.setSearchQuery($event)"
                  placeholder="Buscar permiso o módulo..."
                  class="search-input"
                />
                @if (state.searchQuery()) {
                  <button
                    mat-icon-button
                    class="clear-search-btn"
                    (click)="state.setSearchQuery('')"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>

              <!-- Botón Restablecer a Plantilla Oficial CEISH -->
              <button
                mat-stroked-button
                class="reset-preset-btn"
                [disabled]="
                  state.selectedRoleCompliance()?.status === 'STANDARD' ||
                  state.resettingPreset() ||
                  state.loadingPermissions()
                "
                matTooltip="Restablecer permisos al estándar normativo del CEISH"
                (click)="onResetPresetClick()"
              >
                <mat-icon>restart_alt</mat-icon>
                <span>Restablecer Plantilla</span>
              </button>

              <!-- Botones de Acción Masiva -->
              <button
                mat-stroked-button
                class="action-pill-btn"
                matTooltip="Marcar todos los permisos del sistema"
                (click)="state.toggleAllPermissions(true)"
              >
                <mat-icon>done_all</mat-icon>
                Todos
              </button>

              <button
                mat-stroked-button
                class="action-pill-btn"
                matTooltip="Desmarcar todos los permisos"
                (click)="state.toggleAllPermissions(false)"
              >
                <mat-icon>remove_done</mat-icon>
                Limpiar
              </button>

              @if (state.isDirty()) {
                <button mat-stroked-button class="discard-btn" (click)="state.resetChanges()">
                  Descartar
                </button>
              }

              <button
                mat-flat-button
                color="primary"
                class="save-btn-premium"
                [disabled]="!state.isDirty() || state.saving() || state.loadingPermissions()"
                (click)="onSaveClick()"
              >
                <ng-container *ngIf="state.saving(); else normalSaveContent">
                  <mat-spinner diameter="18" color="accent"></mat-spinner>
                  <span>Guardando...</span>
                </ng-container>
                <ng-template #normalSaveContent>
                  <mat-icon>shield</mat-icon>
                  <span>Guardar Cambios</span>
                </ng-template>
              </button>
            </div>
          </div>

          <!-- Banner Informativo de Desviación Normativa -->
          @if (state.selectedRoleCompliance()?.status === 'CUSTOM') {
            <div class="regulatory-alert-banner">
              <div class="alert-content">
                <mat-icon class="alert-icon">info</mat-icon>
                <div class="alert-texts">
                  <strong>Rol con Privilegios Personalizados:</strong>
                  <span
                    >La configuración actual difiere de la plantilla reglamentaria del CEISH. Puede
                    auditar las diferencias o restablecer el rol con el botón superior.</span
                  >
                </div>
              </div>
            </div>
          }

          <!-- Contenido de Módulos (Grid Masonry) -->
          <div class="modules-scroll-area custom-scrollbar">
            @if (state.loadingPermissions() || state.resettingPreset()) {
              <div class="loading-overlay">
                <mat-spinner diameter="44"></mat-spinner>
                <p>
                  {{
                    state.resettingPreset()
                      ? 'Restableciendo plantilla normativa CEISH...'
                      : 'Cargando privilegios del rol...'
                  }}
                </p>
              </div>
            } @else if (state.permissionsByModule().length === 0) {
              <div class="no-results-state">
                <mat-icon class="no-results-icon">search_off</mat-icon>
                <h4>No se encontraron permisos</h4>
                <p>No hay permisos que coincidan con la búsqueda "{{ state.searchQuery() }}"</p>
                <button mat-stroked-button color="primary" (click)="state.setSearchQuery('')">
                  Limpiar búsqueda
                </button>
              </div>
            } @else {
              <div class="modules-masonry">
                @for (group of state.permissionsByModule(); track group.moduleId) {
                  <div class="module-glass-card">
                    <!-- Encabezado de Módulo con Tri-State Checkbox -->
                    <div class="card-header">
                      <div class="header-left">
                        <div class="icon-box">
                          <mat-icon>{{ group.moduleIcon }}</mat-icon>
                        </div>
                        <div class="module-title-box">
                          <h4>{{ group.moduleName }}</h4>
                          <span class="module-code">{{ group.moduleCode }}</span>
                        </div>
                      </div>

                      <div class="header-right">
                        <span class="perm-counter-badge">
                          {{ getSelectedInModuleCount(group.permissions) }} /
                          {{ group.permissions.length }}
                        </span>

                        <mat-checkbox
                          [checked]="isModuleChecked(group.permissions)"
                          [indeterminate]="isModuleIndeterminate(group.permissions)"
                          (change)="onModuleHeaderToggle(group.permissions, $event.checked)"
                          matTooltip="Marcar/Desmarcar todos en este módulo"
                          color="primary"
                        >
                        </mat-checkbox>
                      </div>
                    </div>

                    <mat-divider></mat-divider>

                    <!-- Lista de Permisos Individuales -->
                    <div class="card-body">
                      @for (perm of group.permissions; track perm.id) {
                        <div
                          class="permission-row"
                          [class.row-active]="state.currentPermissionsSet().has(perm.id)"
                          (click)="onPermRowClick(perm.id)"
                        >
                          <mat-checkbox
                            [checked]="state.currentPermissionsSet().has(perm.id)"
                            (change)="onPermCheckboxChange(perm.id, $event.checked)"
                            (click)="$event.stopPropagation()"
                            color="primary"
                          >
                            <div class="perm-label-stack">
                              <span class="perm-title">{{ perm.name }}</span>
                              <span class="perm-key">{{ perm.code }}</span>
                            </div>
                          </mat-checkbox>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Estado Vacío Inicial -->
          <div class="empty-state-premium">
            <div class="glass-orb">
              <mat-icon>security</mat-icon>
            </div>
            <h3>Matriz de Roles y Privilegios</h3>
            <p>
              Seleccione un perfil en el panel lateral izquierdo para auditar y configurar los
              permisos granulares de acceso en el sistema CEISH.
            </p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .matrix-container {
        display: flex;
        gap: 1.5rem;
        height: calc(100vh - 170px);
        min-height: 650px;
      }

      .glass-panel {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(226, 232, 240, 0.9);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }

      /* --- SIDEBAR --- */
      .roles-sidebar {
        width: 360px;
        flex-shrink: 0;
      }

      .sidebar-header {
        padding: 1.5rem;
        background: linear-gradient(to bottom, rgba(0, 51, 102, 0.03), transparent);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .title-wrap {
            display: flex;
            align-items: center;
            gap: 10px;

            .title-icon {
              color: #003366;
              font-size: 26px;
              width: 26px;
              height: 26px;
            }

            .sidebar-title {
              margin: 0;
              font-size: 1.2rem;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.4px;
            }
          }

          .add-role-btn {
            background: #003366;
            color: white;
            width: 36px;
            height: 36px;
          }
        }

        .sidebar-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }
      }

      .roles-list {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .role-card-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        background: white;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          border-color: rgba(0, 51, 102, 0.2);
          transform: translateX(3px);
          box-shadow: 0 4px 12px rgba(0, 51, 102, 0.05);
        }

        &.active {
          background: #f0f7ff;
          border-color: #003366;
          box-shadow: 0 6px 18px rgba(0, 51, 102, 0.1);

          .role-avatar {
            background: #003366;
            color: white;
          }

          .role-name {
            color: #003366;
            font-weight: 800;
          }
        }

        .role-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.15rem;
          transition: all 0.25s ease;

          &.inactive-avatar {
            background: #fee2e2;
            color: #b91c1c;
          }
        }

        .role-info {
          flex: 1;
          min-width: 0;

          .name-row {
            display: flex;
            align-items: center;
            gap: 6px;

            .role-name {
              font-size: 0.95rem;
              font-weight: 700;
              color: #1e293b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .inactive-badge {
              font-size: 9px;
              font-weight: 800;
              color: #b91c1c;
              background: #fef2f2;
              padding: 1px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
          }

          .role-meta-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 3px;
          }

          .role-perms-count {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            color: #64748b;

            .perms-mini-icon {
              font-size: 13px;
              width: 13px;
              height: 13px;
              color: #003366;
            }
          }

          .mini-compliance-badge {
            font-size: 9px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 6px;
            text-transform: uppercase;

            &.comp-standard {
              background: #dcfce7;
              color: #166534;
            }

            &.comp-custom {
              background: #fef3c7;
              color: #b45309;
            }
          }
        }

        .role-menu-btn {
          color: #94a3b8;
          width: 32px;
          height: 32px;
          line-height: 32px;

          &:hover {
            color: #1e293b;
          }
        }
      }

      /* --- PERMISSIONS MAIN AREA --- */
      .permissions-area {
        flex: 1;
        min-width: 0;
      }

      .area-navbar {
        padding: 1.25rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.7);
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        gap: 1.5rem;

        .nav-info {
          min-width: 0;

          .badge-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .nav-badge {
              font-size: 10px;
              font-weight: 800;
              color: #003366;
              background: rgba(0, 51, 102, 0.08);
              padding: 2px 8px;
              border-radius: 6px;
            }

            .compliance-pill {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 6px;
              cursor: help;

              mat-icon {
                font-size: 13px;
                width: 13px;
                height: 13px;
              }

              &.compliant-pill {
                background: #dcfce7;
                color: #15803d;
              }

              &.custom-pill {
                background: #fef3c7;
                color: #b45309;
              }
            }

            .dirty-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 10px;
              font-weight: 800;
              color: #b45309;
              background: #fef3c7;
              padding: 2px 8px;
              border-radius: 6px;

              mat-icon {
                font-size: 12px;
                width: 12px;
                height: 12px;
              }
            }
          }

          h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.6px;
          }

          .role-code-desc {
            margin: 2px 0 0 0;
            font-size: 0.85rem;
            color: #64748b;

            code {
              background: #f1f5f9;
              color: #003366;
              padding: 1px 6px;
              border-radius: 4px;
              font-family: monospace;
              font-weight: 700;
              font-size: 0.8rem;
            }
          }
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          .search-box {
            position: relative;
            display: flex;
            align-items: center;

            .search-icon {
              position: absolute;
              left: 10px;
              color: #94a3b8;
              font-size: 18px;
              width: 18px;
              height: 18px;
            }

            .search-input {
              height: 40px;
              border-radius: 10px;
              border: 1px solid #cbd5e1;
              padding: 0 32px 0 34px;
              font-size: 0.85rem;
              width: 190px;
              transition: all 0.2s ease;

              &:focus {
                outline: none;
                border-color: #003366;
                width: 220px;
                box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
              }
            }

            .clear-search-btn {
              position: absolute;
              right: 4px;
              width: 24px;
              height: 24px;
              line-height: 24px;
              color: #94a3b8;
              mat-icon {
                font-size: 14px;
              }
            }
          }

          .reset-preset-btn {
            height: 40px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.8rem;
            color: #003366;
            border-color: rgba(0, 51, 102, 0.3);
            mat-icon {
              font-size: 17px;
              margin-right: 4px;
            }

            &:hover:not(:disabled) {
              background: rgba(0, 51, 102, 0.05);
            }
          }

          .action-pill-btn {
            height: 40px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.8rem;
            color: #475569;
            mat-icon {
              font-size: 16px;
              margin-right: 4px;
            }
          }

          .discard-btn {
            height: 40px;
            border-radius: 10px;
            font-weight: 600;
            color: #dc2626;
            border-color: #fca5a5;
          }

          .save-btn-premium {
            height: 40px;
            border-radius: 10px;
            padding: 0 20px;
            font-weight: 800;
            background: #003366;
            color: white;
            box-shadow: 0 6px 16px rgba(0, 51, 102, 0.2);

            mat-icon {
              margin-right: 6px;
              font-size: 18px;
            }
          }
        }
      }

      .regulatory-alert-banner {
        background: #fffbeb;
        border-bottom: 1px solid #fef3c7;
        padding: 0.6rem 2rem;

        .alert-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #92400e;

          .alert-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #d97706;
          }

          strong {
            color: #78350f;
          }
        }
      }

      .modules-scroll-area {
        flex: 1;
        overflow-y: auto;
        padding: 1.75rem;
        position: relative;
      }

      .modules-masonry {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 1.5rem;
        align-content: start;
      }

      .module-glass-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        transition: all 0.25s ease;
        overflow: hidden;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
          border-color: rgba(0, 51, 102, 0.15);
        }
      }

      .card-header {
        padding: 1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fafafa;

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .icon-box {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: rgba(0, 51, 102, 0.07);
            color: #003366;
            display: flex;
            align-items: center;
            justify-content: center;
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }

          .module-title-box {
            h4 {
              margin: 0;
              font-size: 0.95rem;
              font-weight: 800;
              color: #1e293b;
            }
            .module-code {
              font-size: 0.7rem;
              color: #94a3b8;
              font-family: monospace;
            }
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;

          .perm-counter-badge {
            font-size: 11px;
            font-weight: 800;
            color: #003366;
            background: #e0f2fe;
            padding: 2px 8px;
            border-radius: 12px;
          }
        }
      }

      .card-body {
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .permission-row {
        padding: 6px 10px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: #f8fafc;
        }
        &.row-active {
          background: rgba(0, 51, 102, 0.04);
        }

        ::ng-deep .mat-mdc-checkbox {
          width: 100%;
          .mdc-form-field {
            width: 100%;
            cursor: pointer;
          }
        }
      }

      .perm-label-stack {
        display: flex;
        flex-direction: column;
        padding: 2px 0;

        .perm-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          line-height: 1.3;
        }

        .perm-key {
          font-size: 0.68rem;
          color: #94a3b8;
          font-family: monospace;
          font-weight: 500;
        }
      }

      .loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6rem;
        gap: 1rem;
        color: #64748b;
        font-weight: 600;
      }

      .no-results-state {
        text-align: center;
        padding: 5rem 2rem;
        color: #64748b;

        .no-results-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #94a3b8;
          margin-bottom: 1rem;
        }

        h4 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          color: #1e293b;
        }
        p {
          margin: 6px 0 1.5rem 0;
          font-size: 0.9rem;
        }
      }

      .empty-state-premium {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3rem;

        .glass-orb {
          width: 100px;
          height: 100px;
          border-radius: 30px;
          background: linear-gradient(
            135deg,
            rgba(0, 51, 102, 0.08) 0%,
            rgba(0, 51, 102, 0.15) 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;

          mat-icon {
            font-size: 50px;
            width: 50px;
            height: 50px;
            color: #003366;
          }
        }

        h3 {
          font-size: 1.6rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        p {
          color: #64748b;
          max-width: 420px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
      }
    `,
  ],
})
export class RoleMatrixComponent {
  readonly state = inject(RolePermissionsState);

  readonly roleSelect = output<number>();
  readonly createRole = output<void>();
  readonly editRole = output<SecurityRole>();
  readonly deleteRole = output<SecurityRole>();
  readonly savePermissions = output<void>();
  readonly resetPreset = output<void>();

  getRolePermCount(role: SecurityRole): number {
    if (this.state.selectedRoleId() === role.id) {
      return this.state.activePermsCount();
    }
    return role.permissions?.length ?? 0;
  }

  getRoleCompliance(roleId: number): RoleComplianceStatus | undefined {
    return this.state.complianceMap().get(roleId);
  }

  getComplianceTooltip(comp: RoleComplianceStatus): string {
    if (comp.status === 'STANDARD') {
      return 'Este rol cumple con la plantilla normativa reglamentada por el CEISH.';
    }
    const missing = comp.missingPermissions?.length
      ? `Faltantes: ${comp.missingPermissions.join(', ')}`
      : '';
    const extra = comp.extraPermissions?.length
      ? `Extras: ${comp.extraPermissions.join(', ')}`
      : '';
    return [missing, extra].filter(Boolean).join(' | ') || 'Configuración personalizada.';
  }

  getSelectedInModuleCount(permissions: SecurityPermission[]): number {
    const current = this.state.currentPermissionsSet();
    return permissions.filter((p) => current.has(p.id)).length;
  }

  isModuleChecked(permissions: SecurityPermission[]): boolean {
    return this.state.getModuleCheckState(permissions) === 'checked';
  }

  isModuleIndeterminate(permissions: SecurityPermission[]): boolean {
    return this.state.getModuleCheckState(permissions) === 'indeterminate';
  }

  onRoleClick(roleId: number): void {
    this.roleSelect.emit(roleId);
  }

  onCreateRoleClick(): void {
    this.createRole.emit();
  }

  onEditRoleClick(role: SecurityRole): void {
    this.editRole.emit(role);
  }

  onDeleteRoleClick(role: SecurityRole): void {
    this.deleteRole.emit(role);
  }

  onModuleHeaderToggle(permissions: SecurityPermission[], isChecked: boolean): void {
    this.state.toggleModulePermissions(permissions, isChecked);
  }

  onPermRowClick(permissionId: number): void {
    const isCurrentlyChecked = this.state.currentPermissionsSet().has(permissionId);
    this.state.togglePermission(permissionId, !isCurrentlyChecked);
  }

  onPermCheckboxChange(permissionId: number, isChecked: boolean): void {
    this.state.togglePermission(permissionId, isChecked);
  }

  onSaveClick(): void {
    this.savePermissions.emit();
  }

  onResetPresetClick(): void {
    this.resetPreset.emit();
  }
}

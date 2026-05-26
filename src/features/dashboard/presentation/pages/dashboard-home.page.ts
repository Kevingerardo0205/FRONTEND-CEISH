import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { UserRole } from '@domain/entities/user.entity';
import { EvaluatorLoadComponent } from '../components/evaluator-load/evaluator-load.component';
import { DashboardFacade } from '../facades/dashboard.facade';
import { DashboardSecretariaPage } from './dashboard-secretaria/dashboard-secretaria.page';

interface DashboardConfig {
  greeting: string;
  stats: any[];
  quickActions: any[];
  recentTitle: string;
  emptyMessage: string;
  emptyActionLabel?: string;
  emptyActionLink?: string;
  showEvaluatorLoad?: boolean;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatRippleModule,
    RouterModule, 
    EvaluatorLoadComponent,
    DashboardSecretariaPage
  ],
  template: `
    @if (userRole() === 'SECRETARIA') {
      <app-dashboard-secretaria></app-dashboard-secretaria>
    } @else {
      <div class="premium-dashboard animate-fade-in">
        <!-- 1. Header de Bienvenida Dinámico -->
        <header class="dashboard-hero">
          <div class="welcome-text">
            <span class="day-badge">{{ greetingLabel() }}</span>
            <h1 class="user-greet">Hola, {{ userName() }}</h1>
            <p class="role-context">{{ config().greeting }}</p>
          </div>
          <div class="hero-stats" *ngIf="!isMobile">
            <div class="time-pill">
              <mat-icon>schedule</mat-icon>
              <span>{{ currentHour }}</span>
            </div>
          </div>
        </header>

        <!-- 2. Barra de Acciones Rápidas (Tarjetas de Alto Impacto) -->
        <section class="actions-grid" *ngIf="config().quickActions.length > 0">
          <div 
            class="action-card" 
            *ngFor="let action of config().quickActions" 
            [routerLink]="action.link"
            matRipple>
            <div class="action-icon" [style.background-color]="action.color + '15'" [style.color]="action.color">
              <mat-icon>{{ action.icon }}</mat-icon>
            </div>
            <div class="action-info">
              <span class="action-label">{{ action.label }}</span>
              <span class="action-desc">Acceso rápido</span>
            </div>
            <mat-icon class="arrow-icon">chevron_right</mat-icon>
          </div>
        </section>

        <!-- 3. Grid de Estadísticas con Estilo Glassmorphism -->
        <section class="stats-section">
          <div class="stats-container">
            <div class="stat-glass-card" *ngFor="let stat of config().stats">
              <div class="stat-icon-wrapper" [style.color]="stat.color">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
              <div class="stat-values">
                <span class="stat-number">{{ stat.value }}</span>
                <span class="stat-title">{{ stat.title }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Contenido Principal / Listas de Actividad -->
        <div class="dashboard-layout">
          <main class="primary-col">
            <div class="activity-card" *ngIf="!config().showEvaluatorLoad">
              <header class="card-header">
                <div class="header-title">
                  <mat-icon>auto_graph</mat-icon>
                  <h2>{{ config().recentTitle }}</h2>
                </div>
                <button mat-button color="primary" class="view-all">
                  Ver historial completo
                </button>
              </header>

              <div class="empty-activity">
                <div class="illustration-box">
                  <mat-icon>query_stats</mat-icon>
                  <div class="ring"></div>
                </div>
                <h3>{{ config().recentTitle }}</h3>
                <p>{{ config().emptyMessage }}</p>
                <button *ngIf="config().emptyActionLabel" 
                        mat-flat-button 
                        color="primary" 
                        [routerLink]="config().emptyActionLink"
                        class="cta-btn">
                  {{ config().emptyActionLabel }}
                </button>
              </div>
            </div>

            <div *ngIf="config().showEvaluatorLoad" class="specialized-section">
               <app-evaluator-load></app-evaluator-load>
            </div>
          </main>

          <aside class="secondary-col">
            <div class="agenda-glass-card">
              <header class="card-header">
                <div class="header-title">
                  <mat-icon>event_note</mat-icon>
                  <h2>Calendario</h2>
                </div>
              </header>
              <div class="agenda-items">
                <div class="empty-notice">
                  <p>No hay eventos pendientes</p>
                  <span>Tu agenda está al día</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    }
  `,
  styles: [`
    .premium-dashboard { padding: 2rem 2.5rem; max-width: 1600px; margin: 0 auto; }

    /* Hero Section */
    .dashboard-hero { 
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;
      .day-badge { 
        display: inline-block; padding: 4px 12px; background: rgba(59, 130, 246, 0.1); 
        color: #2563eb; border-radius: 100px; font-size: 0.7rem; font-weight: 800; 
        text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;
      }
      .user-greet { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.03em; }
      .role-context { color: #64748b; font-size: 1.15rem; font-weight: 500; margin-top: 0.5rem; }
      .time-pill { 
        display: flex; align-items: center; gap: 8px; padding: 10px 20px; 
        background: white; border-radius: 16px; border: 1px solid #e2e8f0;
        color: #475569; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      }
    }

    /* Actions Grid */
    .actions-grid { 
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 3rem; 
    }
    .action-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.25rem;
      display: flex; align-items: center; gap: 1.25rem; cursor: pointer; transition: all 0.2s ease;
      position: relative;
      &:hover { transform: translateY(-3px); border-color: #3b82f6; box-shadow: 0 12px 20px -5px rgba(0,0,0,0.05); }
      .action-icon { 
        width: 48px; height: 48px; border-radius: 12px; display: flex; 
        align-items: center; justify-content: center; mat-icon { font-size: 24px; }
      }
      .action-info { 
        flex: 1; display: flex; flex-direction: column;
        .action-label { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
        .action-desc { font-size: 0.75rem; color: #94a3b8; }
      }
      .arrow-icon { color: #cbd5e1; font-size: 20px; }
    }

    /* Stats Section */
    .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 3.5rem; }
    .stat-glass-card {
      background: white; border-radius: 24px; padding: 1.75rem; border: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 1.5rem; transition: all 0.3s ease;
      &:hover { border-color: #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); }
      .stat-icon-wrapper { 
        width: 56px; height: 56px; border-radius: 16px; background: #f8fafc; 
        display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 28px; width: 28px; height: 28px; }
      }
      .stat-values { 
        display: flex; flex-direction: column; 
        .stat-number { font-size: 1.75rem; font-weight: 800; color: #0f172a; line-height: 1; }
        .stat-title { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
      }
    }

    /* Layout */
    .dashboard-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    .activity-card, .agenda-glass-card { 
      background: white; border-radius: 30px; border: 1px solid #e2e8f0; padding: 2rem; height: 100%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }

    .card-header { 
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
      .header-title { 
        display: flex; align-items: center; gap: 10px; 
        mat-icon { color: #3b82f6; }
        h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
      }
      .view-all { font-weight: 700; font-size: 0.85rem; }
    }

    .empty-activity {
      padding: 4rem 2rem; text-align: center;
      .illustration-box {
        position: relative; width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
        mat-icon { font-size: 32px; color: #cbd5e1; z-index: 2; }
        .ring { position: absolute; width: 100%; height: 100%; border: 1px solid #e2e8f0; border-radius: 50%; animation: ripple 3s infinite; }
      }
      h3 { font-size: 1.15rem; font-weight: 700; color: #1e293b; }
      p { color: #94a3b8; font-size: 0.95rem; margin: 0.75rem 0 2rem; }
      .cta-btn { height: 44px; border-radius: 12px; font-weight: 700; }
    }

    .empty-notice { 
      text-align: center; padding: 2.5rem 1.5rem; border: 2px dashed #f1f5f9; border-radius: 20px;
      p { margin: 0; font-weight: 700; color: #475569; }
      span { display: block; margin-top: 4px; font-size: 0.8rem; color: #94a3b8; }
    }

    @keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
    .animate-fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1100px) { .dashboard-layout { grid-template-columns: 1fr; } }
  `]
})
export class DashboardHomePage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly dashboardFacade = inject(DashboardFacade);
  
  user = this.authFacade.currentUser;
  userName = computed(() => this.user()?.nombre?.split(' ')[0] || 'Usuario');
  userRole = computed(() => (this.user()?.rol?.toUpperCase() as UserRole) || 'INVESTIGADOR');
  isMobile = window.innerWidth < 768;

  currentHour = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  ngOnInit() {
    this.dashboardFacade.loadStats();
  }

  greetingLabel = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  config = computed((): DashboardConfig => {
    const role = this.userRole();
    
    switch (role) {
      case 'ADMIN':
        return {
          greeting: 'Resumen de salud del sistema y usuarios',
          stats: [
            { title: 'Usuarios Totales', value: this.dashboardFacade.usersCount(), icon: 'people', color: '#2563eb' },
            { title: 'Peticiones Hoy', value: 0, icon: 'analytics', color: '#10b981' },
            { title: 'Alertas Sistema', value: 0, icon: 'security', color: '#ef4444' },
          ],
          quickActions: [
            { label: 'Gestionar Usuarios', icon: 'person_add', link: '/dashboard/admin/users', color: '#2563eb' },
            { label: 'Ver Auditoría', icon: 'history', link: '/dashboard/audit', color: '#6366f1' }
          ],
          recentTitle: 'Últimos accesos al sistema',
          emptyMessage: 'No hay registros de actividad reciente en el sistema.'
        };

      case 'INVESTIGADOR':
        return {
          greeting: 'Sigue el estado de tus investigaciones',
          stats: [
            { title: 'Mis Protocolos', value: this.dashboardFacade.myProtocols().length, icon: 'folder_open', color: '#2563eb' },
            { title: 'Observados', value: this.dashboardFacade.myObservedCount(), icon: 'feedback', color: '#f59e0b' },
            { title: 'Aprobados', value: this.dashboardFacade.myApprovedCount(), icon: 'verified', color: '#10b981' },
          ],
          quickActions: [
            { label: 'Nuevo Protocolo', icon: 'add_circle_outline', link: '/dashboard/investigador/nuevo-protocolo', color: '#3b82f6' },
            { label: 'Mis Protocolos', icon: 'list_alt', link: '/dashboard/investigador/mis-protocolos', color: '#6366f1' }
          ],
          recentTitle: 'Protocolos actualizados',
          emptyMessage: 'Aún no has registrado protocolos. Comienza ahora mismo.',
          emptyActionLabel: 'Registrar Nuevo Protocolo',
          emptyActionLink: '/dashboard/investigador/nuevo-protocolo'
        };

      case 'SECRETARIA':
        return {
          greeting: 'Gestión de trámites y asignaciones',
          stats: [
            { title: 'Pendientes Validación', value: this.dashboardFacade.pendingValidationCount(), icon: 'fact_check', color: '#f59e0b' },
            { title: 'Trámites Totales', value: this.dashboardFacade.protocolsCount(), icon: 'folder', color: '#2563eb' },
            { title: 'Resoluciones Hoy', value: 0, icon: 'gavel', color: '#10b981' },
          ],
          quickActions: [
            { label: 'Validar Documentos', icon: 'rule', link: '/dashboard/protocols/validation/list', color: '#3b82f6' },
            { label: 'Oficializar Asignaciones', icon: 'people_alt', link: '/dashboard/evaluations/assignment', color: '#6366f1' }
          ],
          recentTitle: 'Trámites recibidos hoy',
          emptyMessage: 'No hay trámites nuevos pendientes de validación.',
          showEvaluatorLoad: true
        };

      case 'EVALUADOR':
        return {
          greeting: 'Revisiones éticas pendientes',
          stats: [
            { title: 'Mis Evaluaciones', value: 5, icon: 'rate_review', color: '#2563eb' },
            { title: 'Por Vencer', value: 2, icon: 'timer', color: '#ef4444' },
            { title: 'Completadas', value: 12, icon: 'task_alt', color: '#10b981' },
          ],
          quickActions: [
            { label: 'Evaluar Protocolos', icon: 'gavel', link: '/dashboard/evaluations/list', color: '#3b82f6' }
          ],
          recentTitle: 'Protocolos asignados recientemente',
          emptyMessage: 'No tienes evaluaciones pendientes en este momento.'
        };

      case 'PRESIDENTA':
      case 'PRESIDENTE':
        return {
          greeting: 'Decisiones finales y firmas de actas',
          stats: [
            { title: 'Por Firmar', value: 3, icon: 'draw', color: '#ef4444' },
            { title: 'Aprobados Mes', value: 15, icon: 'verified', color: '#10b981' },
            { title: 'Sesiones Próximas', value: 1, icon: 'groups', color: '#2563eb' },
          ],
          quickActions: [
            { label: 'Asignar Evaluadores', icon: 'people_alt', link: '/dashboard/evaluations/assignment', color: '#3b82f6' },
            { label: 'Generar Resoluciones', icon: 'gavel', link: '/dashboard/resolutions/generator', color: '#6366f1' },
            { label: 'Ver Reportes', icon: 'insights', link: '/dashboard/reports', color: '#10b981' }
          ],
          recentTitle: 'Resoluciones pendientes',
          emptyMessage: 'No hay resoluciones pendientes de firma en este momento.',
          showEvaluatorLoad: true
        };

      default:
        return {
          greeting: 'Bienvenido al sistema CEISH',
          stats: [
            { title: 'Activos', value: 0, icon: 'bolt', color: '#2563eb' },
            { title: 'En Revisión', value: 0, icon: 'visibility', color: '#f59e0b' },
            { title: 'Finalizados', value: 0, icon: 'done_all', color: '#10b981' },
          ],
          quickActions: [],
          recentTitle: 'Actividad reciente',
          emptyMessage: 'No hay actividad registrada.'
        };
    }
  });
}

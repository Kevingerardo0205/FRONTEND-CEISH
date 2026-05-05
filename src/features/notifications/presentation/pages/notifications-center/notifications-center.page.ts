import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { NotificationUseCase } from '@features/notifications/application/use-cases/notification.use-case';
import { Notification } from '@features/notifications/domain/entities/notification.entity';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Component({
  selector: 'app-notifications-center',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="notifications-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Centro de Notificaciones</h1>
          <p class="subtitle">Manténgase al día con sus trámites y responsabilidades</p>
        </div>
        <button mat-button (click)="markAllAsRead()" *ngIf="unreadCount > 0">
          <mat-icon>done_all</mat-icon> Marcar todas como leídas
        </button>
      </header>

      <mat-card class="notifications-card">
        <mat-tab-group>
          <mat-tab>
            <ng-template mat-tab-label>
              <span [matBadge]="unreadCount" matBadgeOverlap="false" [matBadgeHidden]="unreadCount === 0">
                No leídas
              </span>
            </ng-template>
            
            <div class="notifications-list">
              <div *ngIf="unreadNotifications.length === 0" class="empty-notifications">
                <mat-icon>notifications_off</mat-icon>
                <p>No tiene notificaciones nuevas.</p>
              </div>

              <mat-list>
                <mat-list-item *ngFor="let note of unreadNotifications" class="notification-item" (click)="onNotificationClick(note)">
                  <mat-icon matListItemIcon [ngClass]="note.type">{{ getIcon(note.category) }}</mat-icon>
                  <div matListItemTitle class="notification-title">
                    {{ note.title }}
                    <span class="dot unread"></span>
                  </div>
                  <div matListItemLine class="notification-message">{{ note.message }}</div>
                  <div matListItemLine class="notification-meta">
                    <mat-chip-listbox><mat-chip>{{ note.category }}</mat-chip></mat-chip-listbox>
                    <span class="date">{{ note.createdAt | date:'short' }}</span>
                  </div>
                  <button mat-icon-button matListItemMeta (click)="markAsRead($event, note)">
                    <mat-icon>check</mat-icon>
                  </button>
                </mat-list-item>
              </mat-list>
            </div>
          </mat-tab>

          <mat-tab label="Todas">
            <div class="notifications-list">
              <mat-list>
                <mat-list-item *ngFor="let note of notifications" class="notification-item" [ngClass]="{'read': note.isRead}" (click)="onNotificationClick(note)">
                  <mat-icon matListItemIcon [ngClass]="note.type">{{ getIcon(note.category) }}</mat-icon>
                  <div matListItemTitle class="notification-title">
                    {{ note.title }}
                  </div>
                  <div matListItemLine class="notification-message">{{ note.message }}</div>
                  <div matListItemLine class="notification-meta">
                    <span class="date">{{ note.createdAt | date:'short' }}</span>
                  </div>
                </mat-list-item>
              </mat-list>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .notifications-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }

    .notifications-card { border-radius: 12px; overflow: hidden; }
    .notifications-list { min-height: 400px; padding: 1rem 0; }
    
    .notification-item {
      cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s;
      &:hover { background: #f8f9fa; }
      &.read { opacity: 0.7; }
    }

    .notification-title { font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    .dot.unread { width: 8px; height: 8px; background: #003366; border-radius: 50%; }

    .notification-message { color: #444; margin-top: 0.25rem; }
    .notification-meta { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }
    .date { font-size: 0.75rem; color: #999; }

    .SUCCESS { color: #28a745; }
    .INFO { color: #003366; }
    .WARNING { color: #ffc107; }
    .ERROR { color: #dc3545; }

    .empty-notifications {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 5rem; color: #999;
      mat-icon { font-size: 4rem; width: 4rem; height: 4rem; margin-bottom: 1rem; }
    }
  `]
})
export class NotificationsCenterPage implements OnInit {
  private readonly notificationUseCase = inject(NotificationUseCase);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  notifications: Notification[] = [];
  
  get unreadNotifications() {
    return this.notifications.filter(n => !n.isRead);
  }

  get unreadCount() {
    return this.unreadNotifications.length;
  }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    const user = this.authFacade.currentUser();
    if (user && user.id) {
      this.notificationUseCase.getNotifications(user.id).subscribe((notes: Notification[]) => this.notifications = notes);
    }
  }

  onNotificationClick(note: Notification) {
    if (!note.isRead) {
      this.markAsRead(null, note);
    }
    if (note.link) {
      this.router.navigateByUrl(note.link);
    }
  }

  markAsRead(event: Event | null, note: Notification) {
    if (event) event.stopPropagation();
    this.notificationUseCase.markAsRead(note.id).subscribe(() => {
      note.isRead = true;
    });
  }

  markAllAsRead() {
    const user = this.authFacade.currentUser();
    if (user && user.id) {
      this.notificationUseCase.markAllAsRead(user.id).subscribe(() => {
        this.notifications.forEach(n => n.isRead = true);
      });
    }
  }

  getIcon(category: string): string {
    switch (category) {
      case 'VALIDATION': return 'fact_check';
      case 'ASSIGNMENT': return 'assignment_ind';
      case 'RESOLUTION': return 'gavel';
      case 'FOLLOW_UP': return 'warning';
      case 'AMENDMENT': return 'edit_document';
      default: return 'notifications';
    }
  }
}

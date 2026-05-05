import { Injectable, inject } from '@angular/core';
import { NotificationRepositoryAdapter } from '../../infrastructure/adapters/notification-repository.adapter';
import { EmailTemplate } from '../../domain/entities/notification.entity';

@Injectable({
  providedIn: 'root'
})
export class NotificationUseCase {
  private readonly notificationRepo = inject(NotificationRepositoryAdapter);

  getNotifications(userId: string) {
    return this.notificationRepo.getNotifications(userId);
  }

  markAsRead(notificationId: string) {
    return this.notificationRepo.markAsRead(notificationId);
  }

  markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId);
  }

  getTemplates() {
    return this.notificationRepo.getTemplates();
  }

  saveTemplate(template: EmailTemplate) {
    return this.notificationRepo.saveTemplate(template);
  }

  sendTestEmail(templateId: string, email: string) {
    return this.notificationRepo.sendTestEmail(templateId, email);
  }
}

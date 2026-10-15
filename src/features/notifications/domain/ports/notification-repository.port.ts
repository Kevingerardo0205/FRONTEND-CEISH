import { Observable } from 'rxjs';
import { Notification, EmailTemplate } from '../entities/notification.entity';

export abstract class INotificationRepositoryPort {
  abstract getNotifications(userId: string): Observable<Notification[]>;
  abstract markAsRead(notificationId: string): Observable<void>;
  abstract markAllAsRead(userId: string): Observable<void>;
  
  abstract getTemplates(): Observable<EmailTemplate[]>;
  abstract saveTemplate(template: EmailTemplate): Observable<void>;
  abstract sendTestEmail(templateId: string, email: string): Observable<void>;
}

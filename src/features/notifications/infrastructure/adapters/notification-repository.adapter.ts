import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { INotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import { Notification, EmailTemplate } from '../../domain/entities/notification.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationRepositoryAdapter implements INotificationRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getNotifications(userId: string): Observable<Notification[]> {
    return of([
      {
        id: 'n1',
        userId: userId,
        title: 'Validación Documental Completada',
        message: 'Su protocolo PRT-2024-001 ha pasado la validación documental.',
        type: 'SUCCESS',
        category: 'VALIDATION',
        isRead: false,
        createdAt: new Date(),
        link: '/dashboard/protocols/detail/PRT-2024-001'
      },
      {
        id: 'n2',
        userId: userId,
        title: 'Nueva Asignación de Evaluación',
        message: 'Se le ha asignado el protocolo PRT-2024-002 para evaluación.',
        type: 'INFO',
        category: 'ASSIGNMENT',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
        link: '/dashboard/evaluations/form/PRT-2024-002'
      }
    ]);
  }

  markAsRead(notificationId: string): Observable<void> {
    return of(undefined);
  }

  markAllAsRead(userId: string): Observable<void> {
    return of(undefined);
  }

  getTemplates(): Observable<EmailTemplate[]> {
    return of([
      {
        id: 't1',
        name: 'Confirmación de Recepción',
        subject: 'CEISH-ESPOCH: Protocolo Recibido - {{codigo_protocolo}}',
        body: 'Estimado/a {{nombre_investigador}},\n\nHemos recibido su protocolo titulado "{{titulo_estudio}}"...',
        category: 'RECEPCIÓN',
        lastModified: new Date(),
        variables: ['nombre_investigador', 'codigo_protocolo', 'titulo_estudio']
      },
      {
        id: 't2',
        name: 'Aprobación de Protocolo',
        subject: 'CEISH-ESPOCH: Resolución de Aprobación - {{codigo_protocolo}}',
        body: 'Estimado/a {{nombre_investigador}},\n\nNos complace informarle que su protocolo ha sido APROBADO...',
        category: 'RESOLUCIÓN',
        lastModified: new Date(),
        variables: ['nombre_investigador', 'codigo_protocolo', 'titulo_estudio', 'fecha_vencimiento']
      }
    ]);
  }

  saveTemplate(template: EmailTemplate): Observable<void> {
    return of(undefined);
  }

  sendTestEmail(templateId: string, email: string): Observable<void> {
    return of(undefined);
  }
}

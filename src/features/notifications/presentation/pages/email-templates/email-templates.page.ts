import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationUseCase } from '@features/notifications/application/use-cases/notification.use-case';
import { EmailTemplate } from '@features/notifications/domain/entities/notification.entity';

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatListModule
  ],
  template: `
    <div class="templates-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Gestión de Plantillas de Correo</h1>
          <p class="subtitle">Personalice las comunicaciones automáticas del sistema</p>
        </div>
      </header>

      <div class="main-layout">
        <!-- Lista de Plantillas -->
        <mat-card class="templates-list-card">
          <mat-card-header>
            <mat-card-title>Plantillas Disponibles</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-action-list>
              <button mat-list-item *ngFor="let t of templates" (click)="selectTemplate(t)" [ngClass]="{'active': selectedTemplate?.id === t.id}">
                <mat-icon matListItemIcon>mail</mat-icon>
                <div matListItemTitle>{{ t.name }}</div>
                <div matListItemLine>{{ t.category }}</div>
              </button>
            </mat-action-list>
          </mat-card-content>
        </mat-card>

        <!-- Editor de Plantilla -->
        <mat-card class="editor-card" *ngIf="selectedTemplate">
          <mat-card-header>
            <mat-card-title>Editando: {{ selectedTemplate.name }}</mat-card-title>
            <div class="editor-actions">
              <button mat-stroked-button color="warn" (click)="testEmail()">
                <mat-icon>send</mat-icon> Enviar Prueba
              </button>
              <button mat-raised-button color="primary" (click)="saveTemplate()">
                <mat-icon>save</mat-icon> Guardar Cambios
              </button>
            </div>
          </mat-card-header>
          
          <mat-card-content>
            <div class="editor-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Asunto del Correo</mat-label>
                <input matInput [(ngModel)]="selectedTemplate.subject">
              </mat-form-field>

              <div class="variables-panel">
                <p>Variables disponibles (haga clic para insertar):</p>
                <mat-chip-listbox>
                  <mat-chip *ngFor="let v of selectedTemplate.variables" (click)="insertVariable(v)">
                    {{ '{{' + v + '}}' }}
                  </mat-chip>
                </mat-chip-listbox>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Cuerpo del Mensaje (HTML/Texto)</mat-label>
                <textarea matInput rows="15" [(ngModel)]="selectedTemplate.body" #templateBody></textarea>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="editor-card empty" *ngIf="!selectedTemplate">
          <mat-card-content>
            <mat-icon>edit_note</mat-icon>
            <p>Seleccione una plantilla de la lista para comenzar a editar.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .templates-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .page-header { margin-bottom: 2rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }

    .main-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }
    
    .templates-list-card { border-radius: 12px; height: calc(100vh - 200px); overflow-y: auto; }
    .active { background: rgba(0, 51, 102, 0.05); border-right: 4px solid #003366; }

    .editor-card { border-radius: 12px; min-height: calc(100vh - 200px); }
    .editor-card.empty { display: flex; justify-content: center; align-items: center; text-align: center; color: #999; 
      mat-icon { font-size: 4rem; width: 4rem; height: 4rem; margin-bottom: 1rem; }
    }

    .editor-actions { display: flex; gap: 0.5rem; margin-left: auto; }
    .editor-form { margin-top: 1.5rem; }
    .full-width { width: 100%; }
    
    .variables-panel { background: #f1f3f4; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; 
      p { margin-top: 0; font-size: 0.85rem; font-weight: 600; color: #666; }
    }

    textarea { font-family: monospace; }
  `]
})
export class EmailTemplatesPage implements OnInit {
  private readonly notificationUseCase = inject(NotificationUseCase);
  private readonly snackBar = inject(MatSnackBar);

  templates: EmailTemplate[] = [];
  selectedTemplate: EmailTemplate | null = null;

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.notificationUseCase.getTemplates().subscribe(templates => {
      this.templates = templates;
    });
  }

  selectTemplate(template: EmailTemplate) {
    this.selectedTemplate = { ...template };
  }

  insertVariable(variable: string) {
    if (this.selectedTemplate) {
      this.selectedTemplate.body += ` {{${variable}}} `;
    }
  }

  saveTemplate() {
    if (this.selectedTemplate) {
      this.notificationUseCase.saveTemplate(this.selectedTemplate).subscribe(() => {
        this.snackBar.open('Plantilla guardada correctamente', 'Cerrar', { duration: 3000 });
        this.loadTemplates();
      });
    }
  }

  testEmail() {
    const email = prompt('Ingrese el correo de prueba:');
    if (email && this.selectedTemplate) {
      this.notificationUseCase.sendTestEmail(this.selectedTemplate.id, email).subscribe(() => {
        this.snackBar.open(`Correo de prueba enviado a ${email}`, 'Cerrar', { duration: 3000 });
      });
    }
  }
}

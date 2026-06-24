import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IAiAssistantAdminRepositoryPort } from '@domain/ports/IAiAssistantAdminRepositoryPort';
import { AiAssistantSharedService } from '@shared/components/ai-assistant/ai-assistant-shared.service';

interface SystemRole {
  code: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-ai-assistant-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="dashboard-admin-container animate-fade-in" style="padding: 24px; max-width: 1200px; margin: 0 auto;">
      
      <!-- CABECERA -->
      <header class="main-header" style="margin-bottom: 32px;">
        <div class="header-info">
          <div class="breadcrumb-chip" style="display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.1); color: #6366f1; border-radius: 16px; font-size: 0.8rem; font-weight: 700; margin-bottom: 8px;">
            Administración / Configuración del Asistente
          </div>
          <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <mat-icon style="font-size: 2.2rem; width: 2.2rem; height: 2.2rem; color: #6366f1;">smart_toy</mat-icon>
            Asistente de IA Inteligente
          </h1>
          <p style="margin: 4px 0 0 0; color: #64748b;">Administra el reglamento de normativa PET y gestiona los permisos de roles para el chat de IA</p>
        </div>
      </header>

      <div class="admin-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;">
        
        <!-- CARD 1: CARGA DE NORMATIVA PET -->
        <section class="admin-card" style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 20px; padding: 28px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.02);">
          <div class="card-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed #e2e8f0; padding-bottom: 16px;">
            <div>
              <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                <mat-icon style="color: #6366f1;">picture_as_pdf</mat-icon> Actualizar Normativa PET
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">Carga el reglamento oficial en PDF para que la IA responda basándose en él</p>
            </div>
            
            <div class="status-badge" style="background: #f1f5f9; padding: 6px 12px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: right;">
              <span style="display: block; font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Normativa Activa</span>
              <span style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">{{ petFileName() || 'Sin archivo' }}</span>
            </div>
          </div>

          <!-- Información del archivo actual -->
          <div *ngIf="petFileName()" class="info-row" style="background: rgba(99, 102, 241, 0.03); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid rgba(99, 102, 241, 0.08); font-size: 0.85rem; color: #475569; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: #6366f1;">history</mat-icon>
              <span>Última actualización: <strong>{{ petUpdatedAt() | date:'dd/MM/yyyy, HH:mm' }}</strong></span>
            </div>
            <span style="color: #6366f1; font-weight: 600;">Modo RAG Activo</span>
          </div>

          <!-- ÁREA DRAG AND DROP -->
          <div class="upload-area" 
               [class.dragging]="isDragging()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave()"
               (drop)="onDrop($event)"
               style="border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center; background: rgba(248, 250, 252, 0.4); cursor: pointer; transition: all 0.2s ease-in-out;"
               [style.borderColor]="isDragging() ? '#6366f1' : '#cbd5e1'"
               [style.background]="isDragging() ? 'rgba(99, 102, 241, 0.04)' : 'rgba(248, 250, 252, 0.4)'"
               (click)="fileInput.click()">
            
            <input type="file" #fileInput (change)="onFileSelected($event)" accept="application/pdf" style="display: none;">
            
            <mat-icon style="font-size: 3.5rem; width: 3.5rem; height: 3.5rem; color: #94a3b8; margin-bottom: 12px;">cloud_upload</mat-icon>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 600; color: #334155;">
              {{ selectedFile() ? selectedFile()!.name : 'Arrastra tu archivo PDF aquí o haz clic para buscar' }}
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #64748b;">Solo se admiten documentos en formato .pdf de hasta 10 MB</p>
            
            <div *ngIf="selectedFile()" style="margin-top: 12px; display: inline-block; background: #e2e8f0; padding: 4px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; color: #334155;">
              Tamaño: {{ (selectedFile()!.size / 1024 / 1024) | number:'1.2-2' }} MB
            </div>
          </div>

          <!-- Botones de Acción -->
          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button mat-button 
                    *ngIf="selectedFile()" 
                    (click)="cancelUpload()" 
                    [disabled]="isLoadingPet()"
                    style="border-radius: 12px; padding: 8px 16px;">
              Cancelar
            </button>
            <button mat-raised-button 
                    color="primary"
                    [disabled]="!selectedFile() || isLoadingPet()" 
                    (click)="uploadPdf()"
                    style="border-radius: 12px; padding: 8px 24px; background: #6366f1; color: white; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.3);">
              <mat-icon *ngIf="!isLoadingPet()">check_circle</mat-icon>
              <span *ngIf="isLoadingPet()" class="loader-spinner"></span>
              <span>{{ isLoadingPet() ? 'Procesando PDF...' : 'Subir y Procesar PET' }}</span>
            </button>
          </div>
        </section>

        <!-- CARD 2: ROLES AUTORIZADOS -->
        <section class="admin-card" style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 20px; padding: 28px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.02);">
          <div class="card-header" style="margin-bottom: 20px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 16px;">
            <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: #6366f1;">admin_panel_settings</mat-icon> Roles con Acceso al Asistente
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">Habilita o deshabilita la visualización del chat flotante según el perfil del usuario</p>
          </div>

          <div class="roles-list" style="display: flex; flex-direction: column; gap: 16px;">
            <div *ngFor="let role of availableRoles" 
                 class="role-row" 
                 [class.active-role]="selectedRoles().includes(role.code)"
                 style="display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; transition: all 0.2s ease-in-out; background: #fff;">
              
              <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                <span style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">{{ role.label }}</span>
                <span style="color: #64748b; font-size: 0.8rem;">{{ role.description }}</span>
              </div>

              <!-- Switch / Checkbox Estetico -->
              <label class="switch-container" style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
                <input type="checkbox" 
                       [checked]="selectedRoles().includes(role.code)" 
                       (change)="toggleRole(role.code)"
                       style="opacity: 0; width: 0; height: 0;" />
                <span class="slider" 
                      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 34px;"
                      [style.backgroundColor]="selectedRoles().includes(role.code) ? '#6366f1' : '#cbd5e1'">
                </span>
                <span class="slider-knob"
                      style="position: absolute; content: ''; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .3s; border-radius: 50%;"
                      [style.transform]="selectedRoles().includes(role.code) ? 'translateX(22px)' : 'none'">
                </span>
              </label>

            </div>
          </div>

          <!-- Botones de Acción -->
          <div style="margin-top: 28px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            <button mat-button 
                    (click)="resetRolesConfig()" 
                    [disabled]="isLoadingRoles()"
                    style="border-radius: 12px; padding: 8px 16px;">
              Reestablecer
            </button>
            <button mat-raised-button 
                    color="primary"
                    [disabled]="isLoadingRoles()" 
                    (click)="saveRolesConfig()"
                    style="border-radius: 12px; padding: 8px 24px; background: #6366f1; color: white; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.3);">
              <mat-icon *ngIf="!isLoadingRoles()">save</mat-icon>
              <span *ngIf="isLoadingRoles()" class="loader-spinner"></span>
              <span>{{ isLoadingRoles() ? 'Guardando...' : 'Guardar Roles de Acceso' }}</span>
            </button>
          </div>
        </section>

      </div>
      
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .upload-area:hover {
      border-color: #6366f1 !important;
      background: rgba(99, 102, 241, 0.02) !important;
    }

    .role-row:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      border-color: #cbd5e1 !important;
    }

    .active-role {
      border-color: rgba(99, 102, 241, 0.3) !important;
      background: rgba(99, 102, 241, 0.01) !important;
    }

    .loader-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AiAssistantAdminPage implements OnInit {
  private readonly adminRepository = inject(IAiAssistantAdminRepositoryPort);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sharedService = inject(AiAssistantSharedService);

  // States
  petFileName = signal<string>('');
  petUpdatedAt = signal<Date | null>(null);
  selectedRoles = signal<string[]>([]);
  
  // UI States
  selectedFile = signal<File | null>(null);
  isDragging = signal<boolean>(false);
  isLoadingPet = signal<boolean>(false);
  isLoadingRoles = signal<boolean>(false);

  // Listado oficial de roles
  readonly availableRoles: SystemRole[] = [
    { code: 'INVESTIGADOR', label: 'Investigador', description: 'Científicos que crean, suben y gestionan sus protocolos.' },
    { code: 'SECRETARIA', label: 'Secretaría del CEISH', description: 'Realiza el control de recepción, revisa checklist y agenda plenarios.' },
    { code: 'EVALUADOR', label: 'Miembro Evaluador', description: 'Examina la idoneidad ética, metodológica y técnica de los proyectos.' },
    { code: 'PRESIDENTE', label: 'Presidente del CEISH', description: 'Dirección general del comité, firma dictámenes y autoriza resoluciones.' },
    { code: 'ADMIN_TI', label: 'Administrador de TI', description: 'Control de la plataforma, roles, base de datos y auditoría de accesos.' }
  ];

  // Respaldo para resetear
  private initialRoles: string[] = [];

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.adminRepository.getConfig().subscribe({
      next: (summary) => {
        this.petFileName.set(summary.petFileName);
        this.petUpdatedAt.set(summary.updatedAt);
        this.selectedRoles.set(summary.allowedRoles);
        this.initialRoles = [...summary.allowedRoles];
      },
      error: (err) => {
        console.error('Error cargando configuración', err);
        this.showToast('❌ No se pudo cargar la configuración de IA', 'Cerrar');
      }
    });
  }

  // --- LÓGICA DE ACTUALIZACIÓN DEL PET (PDF) ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.validateAndSetFile(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  private validateAndSetFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.showToast('❌ Error: El archivo debe ser un documento PDF', 'Entendido');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.showToast('❌ Error: El archivo supera el límite de 10 MB', 'Entendido');
      return;
    }

    this.selectedFile.set(file);
  }

  cancelUpload() {
    this.selectedFile.set(null);
  }

  uploadPdf() {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoadingPet.set(true);
    this.adminRepository.uploadPet(file).subscribe({
      next: (res) => {
        this.isLoadingPet.set(false);
        this.selectedFile.set(null);
        this.petFileName.set(res.petFileName);
        this.petUpdatedAt.set(new Date());
        this.showToast(`✅ Normativa procesada: ${res.characterCount} caracteres cargados.`, 'Genial');
        this.sharedService.clearChat();
      },
      error: (err) => {
        console.error('Error al subir PDF', err);
        this.isLoadingPet.set(false);
        this.showToast(err.error?.message || '❌ Ocurrió un error al procesar el PDF.', 'Cerrar');
      }
    });
  }

  // --- LÓGICA DE ROLES AUTORIZADOS ---
  toggleRole(roleCode: string) {
    const current = this.selectedRoles();
    if (current.includes(roleCode)) {
      this.selectedRoles.set(current.filter(code => code !== roleCode));
    } else {
      this.selectedRoles.set([...current, roleCode]);
    }
  }

  resetRolesConfig() {
    this.selectedRoles.set([...this.initialRoles]);
    this.showToast('Configuración de roles restablecida.', 'Aceptar');
  }

  saveRolesConfig() {
    const roles = this.selectedRoles();
    this.isLoadingRoles.set(true);
    this.adminRepository.updateRoles(roles).subscribe({
      next: (res) => {
        this.isLoadingRoles.set(false);
        this.initialRoles = [...res.allowedRoles];
        this.showToast('✅ Permisos de roles actualizados exitosamente.', 'Aceptar');
        this.sharedService.clearChat();
      },
      error: (err) => {
        console.error('Error al guardar roles', err);
        this.isLoadingRoles.set(false);
        this.showToast('❌ Error al actualizar la configuración de roles.', 'Cerrar');
      }
    });
  }

  private showToast(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }
}

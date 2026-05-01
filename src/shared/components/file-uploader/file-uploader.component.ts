import { Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface FileItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="uploader-container" 
         [class.drag-over]="isDragging()" 
         (dragover)="onDragOver($event)" 
         (dragleave)="onDragLeave()" 
         (drop)="onDrop($event)">
      
      <div class="drop-zone">
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <h3>Carga de Documentación</h3>
        <p>Arrastre sus archivos aquí o haga clic para buscar</p>
        <span class="limits">Máximo 50 archivos (Total 100MB)</span>
        
        <input type="file" #fileInput multiple (change)="onFileSelected($event)" style="display: none">
        <button mat-flat-button color="primary" class="browse-btn" (click)="fileInput.click()">
          Seleccionar Archivos
        </button>
      </div>

      <!-- File List -->
      <div class="file-list" *ngIf="files().length > 0">
        <div class="file-item" *ngFor="let item of files(); let i = index">
          <mat-icon class="file-icon">description</mat-icon>
          <div class="file-info">
            <div class="name-row">
              <span class="file-name">{{ item.file.name }}</span>
              <span class="file-size">{{ formatSize(item.file.size) }}</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="item.progress" 
                             [color]="item.status === 'error' ? 'warn' : 'primary'">
            </mat-progress-bar>
          </div>
          <button mat-icon-button color="warn" (click)="removeFile(i)">
            <mat-icon>delete_outline</mat-icon>
          </button>
        </div>
      </div>

      <!-- Summary Footer -->
      <div class="uploader-footer" *ngIf="files().length > 0">
        <div class="stats">
          <span>{{ files().length }} archivos seleccionados</span>
          <span [class.text-warn]="totalSize() > maxSizeBytes">
            Total: {{ formatSize(totalSize()) }} / 100MB
          </span>
        </div>
        <button mat-raised-button 
                class="upload-all-btn"
                [disabled]="files().length === 0 || totalSize() > maxSizeBytes"
                (click)="onUploadAll()">
          Subir Documentación
        </button>
      </div>
    </div>
  `,
  styles: [`
    .uploader-container {
      background: #ffffff;
      border: 2px dashed #e2e8f0;
      border-radius: 20px;
      padding: 2rem;
      transition: all 0.3s ease;
      &.drag-over { border-color: #003366; background: #f0f7ff; }
    }

    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.5rem;

      .upload-icon { font-size: 48px; width: 48px; height: 48px; color: #003366; margin-bottom: 1rem; }
      h3 { margin: 0; font-weight: 800; color: #003366; }
      p { margin: 0.5rem 0; color: #64748b; font-size: 0.9rem; }
      .limits { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
      .browse-btn { margin-top: 1.5rem; border-radius: 10px; padding: 0 2rem; }
    }

    .file-list {
      margin-top: 2rem;
      max-height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #edf2f7;

      .file-icon { color: #4DB6AC; }
      .file-info {
        flex: 1;
        .name-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          .file-name { font-weight: 700; font-size: 0.85rem; color: #1e293b; }
          .file-size { font-size: 0.75rem; color: #94a3b8; }
        }
      }
    }

    .uploader-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #edf2f7;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .stats {
        display: flex;
        flex-direction: column;
        span { font-size: 0.8rem; font-weight: 600; color: #64748b; }
        .text-warn { color: #dc2626; }
      }

      .upload-all-btn {
        background-color: #003366;
        color: white;
        border-radius: 10px;
        font-weight: 700;
      }
    }
  `]
})
export class FileUploaderComponent {
  upload = output<File[]>();
  
  files = signal<FileItem[]>([]);
  isDragging = signal(false);
  
  maxSizeBytes = 100 * 1024 * 1024; // 100MB
  totalSize = computed(() => this.files().reduce((acc, f) => acc + f.file.size, 0));

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(droppedFiles);
    }
  }

  onFileSelected(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      this.handleFiles(selectedFiles);
    }
  }

  private handleFiles(fileList: FileList) {
    const currentFiles = this.files();
    const newFiles: FileItem[] = Array.from(fileList).map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    // Limite de 50 archivos
    if (currentFiles.length + newFiles.length > 50) {
      alert('Máximo 50 archivos permitidos');
      return;
    }

    this.files.set([...currentFiles, ...newFiles]);
  }

  removeFile(index: number) {
    const currentFiles = this.files();
    currentFiles.splice(index, 1);
    this.files.set([...currentFiles]);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onUploadAll() {
    const rawFiles = this.files().map(f => f.file);
    this.upload.emit(rawFiles);
  }
}

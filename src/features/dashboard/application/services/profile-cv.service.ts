import { Injectable, inject } from '@angular/core';
import { Observable, filter, map, switchMap, take, throwError } from 'rxjs';
import { sanitizeFilename } from '@domain/entities/storage.interface';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

export interface InvestigatorCvMetadata {
  fileName: string;
  sizeBytes: number;
  sizeLabel: string;
  uploadedAt: string;
  storageKey: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileCvService {
  private readonly storage = inject(S3StorageService);
  private readonly maxFileSizeBytes = 5 * 1024 * 1024;
  private readonly metadataKeyPrefix = 'ceish_investigator_cv_metadata_';
  private readonly legacyKeys = [
    'ceish_investigator_cv_name',
    'ceish_investigator_cv_size',
    'ceish_investigator_cv_date',
    'ceish_investigator_cv_data',
  ];

  uploadCv(file: File, investigatorId: string): Observable<InvestigatorCvMetadata> {
    const validationError = this.validateFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const safeInvestigatorId = investigatorId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = sanitizeFilename(file.name);
    const requestedKey = `investigators/${safeInvestigatorId}/cv/${Date.now()}_${safeFileName}`;

    return this.storage.getUploadUrl(requestedKey, 'application/pdf').pipe(
      switchMap(({ uploadUrl, key }) =>
        this.storage.uploadFileToS3(uploadUrl, file).pipe(
          filter(({ success }) => success),
          take(1),
          map(() => {
            const metadata: InvestigatorCvMetadata = {
              fileName: safeFileName,
              sizeBytes: file.size,
              sizeLabel: this.formatSize(file.size),
              uploadedAt: new Date().toISOString(),
              storageKey: key,
            };
            this.saveMetadata(investigatorId, metadata);
            return metadata;
          }),
        ),
      ),
    );
  }

  getStoredCv(investigatorId: string): InvestigatorCvMetadata | null {
    this.removeLegacyData();
    const storedValue = localStorage.getItem(this.getMetadataKey(investigatorId));
    if (!storedValue) {
      return null;
    }

    try {
      const metadata = JSON.parse(storedValue) as InvestigatorCvMetadata;
      if (!metadata.fileName || !metadata.storageKey || !metadata.uploadedAt) {
        throw new Error('Metadatos de CV incompletos');
      }
      return metadata;
    } catch {
      localStorage.removeItem(this.getMetadataKey(investigatorId));
      return null;
    }
  }

  getDownloadUrl(storageKey: string): Observable<string> {
    return this.storage
      .getEvaluationDocumentUrl(storageKey)
      .pipe(map(({ downloadUrl }) => downloadUrl));
  }

  deleteStoredCv(investigatorId: string): void {
    localStorage.removeItem(this.getMetadataKey(investigatorId));
    this.removeLegacyData();
  }

  private validateFile(file: File): string | null {
    if (file.type !== 'application/pdf') {
      return 'Solo se permiten archivos en formato PDF.';
    }
    if (file.size === 0) {
      return 'El archivo PDF no puede estar vacío.';
    }
    if (file.size > this.maxFileSizeBytes) {
      return 'El archivo excede el tamaño máximo permitido (5 MB).';
    }
    return null;
  }

  private saveMetadata(investigatorId: string, metadata: InvestigatorCvMetadata): void {
    this.removeLegacyData();
    localStorage.setItem(this.getMetadataKey(investigatorId), JSON.stringify(metadata));
  }

  private getMetadataKey(investigatorId: string): string {
    return `${this.metadataKeyPrefix}${encodeURIComponent(investigatorId)}`;
  }

  private removeLegacyData(): void {
    this.legacyKeys.forEach((key) => localStorage.removeItem(key));
  }

  private formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.ceil(bytes / 1024)} KB`;
  }
}

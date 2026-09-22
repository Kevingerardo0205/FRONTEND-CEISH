import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { filter, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UploadTemplateFileUseCase {
  private docRepo = inject(IDocumentRepositoryPort);
  private s3Storage = inject(S3StorageService);

  execute(code: string, file: File): Observable<any> {
    const s3Key = `templates/${code.toLowerCase()}_template.docx`;
    return this.s3Storage.getUploadUrl(s3Key, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').pipe(
      switchMap(urlRes => this.s3Storage.uploadFileToS3(urlRes.uploadUrl, file).pipe(
        filter(upRes => upRes.success),
        map(() => urlRes.key)
      )),
      switchMap(uploadedKey => this.docRepo.associateTemplateFile(code, uploadedKey))
    );
  }
}

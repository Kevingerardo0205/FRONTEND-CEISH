import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { filter, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CreateTemplateUseCase {
  private docRepo = inject(IDocumentRepositoryPort);
  private s3Storage = inject(S3StorageService);

  execute(params: { code: string; name: string; file?: File }): Observable<any> {
    return this.docRepo.createTemplateMetadata(params.code, params.name).pipe(
      switchMap(() => {
        if (params.file) {
          const s3Key = `templates/${params.code.toLowerCase()}_template.docx`;
          return this.s3Storage.getUploadUrl(s3Key, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').pipe(
            switchMap(urlRes => this.s3Storage.uploadFileToS3(urlRes.uploadUrl, params.file!).pipe(
              filter(upRes => upRes.success),
              map(() => urlRes.key)
            )),
            switchMap(uploadedKey => this.docRepo.associateTemplateFile(params.code, uploadedKey))
          );
        }
        return [null];
      })
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, filter, map } from 'rxjs';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { CreateResolutionUseCase } from './create-resolution.use-case';
import { ResolutionEntity } from '@domain/entities/resolution.entity';

export interface ResolutionPayload {
  protocolId: number;
  resolutionTypeId: number;
  validityYears: number;
  followUpPeriodDays?: number;
  observations?: string;
  majorObservations?: string;
  minorObservations?: string;
  correctionProcedure?: string;
  file?: File;
}

@Injectable({ providedIn: 'root' })
export class GenerateAndSubmitResolutionUseCase {
  private s3Storage = inject(S3StorageService);
  private createResolution = inject(CreateResolutionUseCase);

  execute(payload: ResolutionPayload): Observable<ResolutionEntity> {
    const s3Key = `protocols/${payload.protocolId}/resolutions/Carta_Resolucion_Consolidada.pdf`;
    const fileToUpload = payload.file || new File(
      [new Blob(['Acta de Resolución'], { type: 'application/pdf' })],
      'Carta_Resolucion_Consolidada.pdf',
      { type: 'application/pdf' }
    );

    return this.s3Storage.getUploadUrl(s3Key, 'application/pdf').pipe(
      switchMap(urlRes => this.s3Storage.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
        filter(upRes => upRes.success),
        map(() => urlRes.key)
      )),
      switchMap(uploadedKey => {
        const typeId = Number(payload.resolutionTypeId);
        return this.createResolution.execute({
          protocolId: payload.protocolId,
          resolutionTypeId: typeId,
          validityYears: typeId === 3 ? 1 : payload.validityYears,
          followUpPeriodDays: typeId === 3 ? undefined : payload.followUpPeriodDays,
          observations: payload.observations,
          majorObservations: payload.majorObservations,
          minorObservations: payload.minorObservations,
          correctionProcedure: payload.correctionProcedure,
          letterFilePath: uploadedKey
        });
      })
    );
  }
}

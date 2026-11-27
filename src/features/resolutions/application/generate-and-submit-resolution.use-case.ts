import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, filter, map, throwError } from 'rxjs';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { CreateResolutionUseCase } from './create-resolution.use-case';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { MENSAJE_CARTA_FIRMADA_REQUERIDA } from '@shared/utils/carta-firmada.constants';

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
    // TSK-015-N23: sin carta real no se sube nada ni se crea la resolución.
    if (!payload.file) {
      return throwError(() => new Error(MENSAJE_CARTA_FIRMADA_REQUERIDA));
    }
    const s3Key = `protocols/${payload.protocolId}/resolutions/Carta_Resolucion_Consolidada.pdf`;
    const fileToUpload = payload.file;

    return this.s3Storage.getUploadUrl(s3Key, 'application/pdf').pipe(
      switchMap((urlRes) =>
        this.s3Storage.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter((upRes) => upRes.success),
          map(() => urlRes.key),
        ),
      ),
      switchMap((uploadedKey) => {
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
          letterFilePath: uploadedKey,
        });
      }),
    );
  }
}

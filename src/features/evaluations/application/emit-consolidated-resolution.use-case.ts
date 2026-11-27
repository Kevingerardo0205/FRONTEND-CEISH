import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, filter, map, throwError } from 'rxjs';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { MENSAJE_CARTA_FIRMADA_REQUERIDA } from '@shared/utils/carta-firmada.constants';

@Injectable({ providedIn: 'root' })
export class EmitConsolidatedResolutionUseCase {
  private s3Storage = inject(S3StorageService);
  private resolutionRepo = inject(IResolutionRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  execute(params: {
    protocolId: number;
    validityYears: number;
    followUpPeriodDays: number;
    observations: string;
    file?: File;
  }): Observable<ResolutionEntity> {
    // TSK-015-N23: sin carta real no se sube nada ni se emite la resolución.
    if (!params.file) {
      return throwError(() => new Error(MENSAJE_CARTA_FIRMADA_REQUERIDA));
    }
    const s3Key = `protocols/${params.protocolId}/resolutions/Carta_Resolucion_Consolidada.pdf`;
    const fileToUpload = params.file;

    return this.s3Storage.getUploadUrl(s3Key, 'application/pdf').pipe(
      switchMap((urlRes) =>
        this.s3Storage.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter((upRes) => upRes.success),
          map(() => urlRes.key),
        ),
      ),
      switchMap((uploadedKey) => {
        return this.resolutionRepo.submitResolution({
          protocolId: params.protocolId,
          validityYears: params.validityYears,
          followUpPeriodDays: params.followUpPeriodDays,
          observations: params.observations,
          pdfLetterPath: uploadedKey,
        });
      }),
      map((res: ResolutionEntity) => {
        let finalStatus = ProtocolStatus.APPROVED;
        if (res?.resolutionType === 'REJECTION') {
          finalStatus = ProtocolStatus.REJECTED;
        } else if (res?.resolutionType === 'CONDITIONAL') {
          finalStatus = ProtocolStatus.OBSERVED;
        }
        this.notificationBroker.publish('PROTOCOL_STATUS_UPDATED', {
          protocolId: String(params.protocolId),
          status: finalStatus,
        });
        return res;
      }),
    );
  }
}

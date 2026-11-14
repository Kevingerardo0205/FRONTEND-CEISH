import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, filter, map } from 'rxjs';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';

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
    const s3Key = `protocols/${params.protocolId}/resolutions/Carta_Resolucion_Consolidada.pdf`;
    const fileToUpload =
      params.file ||
      new File(
        [new Blob(['Acta de Resolución Consolidada'], { type: 'application/pdf' })],
        'Carta_Resolucion_Consolidada.pdf',
        { type: 'application/pdf' },
      );

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

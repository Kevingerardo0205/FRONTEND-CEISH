import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmitConsolidatedResolutionUseCase } from './emit-consolidated-resolution.use-case';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

describe('EmitConsolidatedResolutionUseCase', () => {
  let useCase: EmitConsolidatedResolutionUseCase;
  let resolutionSpy: jasmine.SpyObj<IResolutionRepositoryPort>;
  let s3Spy: jasmine.SpyObj<S3StorageService>;
  let notificationSpy: jasmine.SpyObj<NotificationBrokerService>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IResolutionRepositoryPort', ['submitResolution']);
    const sSpy = jasmine.createSpyObj('S3StorageService', ['getUploadUrl', 'uploadFileToS3']);
    const nSpy = jasmine.createSpyObj('NotificationBrokerService', ['publish']);

    TestBed.configureTestingModule({
      providers: [
        EmitConsolidatedResolutionUseCase,
        { provide: IResolutionRepositoryPort, useValue: rSpy },
        { provide: S3StorageService, useValue: sSpy },
        { provide: NotificationBrokerService, useValue: nSpy },
      ],
    });

    useCase = TestBed.inject(EmitConsolidatedResolutionUseCase);
    resolutionSpy = TestBed.inject(
      IResolutionRepositoryPort,
    ) as jasmine.SpyObj<IResolutionRepositoryPort>;
    s3Spy = TestBed.inject(S3StorageService) as jasmine.SpyObj<S3StorageService>;
    notificationSpy = TestBed.inject(
      NotificationBrokerService,
    ) as jasmine.SpyObj<NotificationBrokerService>;
  });

  it('debe subir archivo y emitir resolución con notificación', (done) => {
    s3Spy.getUploadUrl.and.returnValue(
      of({ uploadUrl: 'https://s3/upload', key: 'protocols/1/resolutions/file.pdf' }),
    );
    s3Spy.uploadFileToS3.and.returnValue(of({ progress: 100, success: true }));
    resolutionSpy.submitResolution.and.returnValue(
      of({
        id: 1,
        protocolId: '1',
        versionId: '1',
        resolutionTypeId: 1,
        resolutionType: 'APPROVAL',
        validityYears: 2,
      }),
    );
    notificationSpy.publish.and.stub();

    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    useCase
      .execute({
        protocolId: 1,
        validityYears: 2,
        followUpPeriodDays: 90,
        observations: 'Test observations',
        file: testFile,
      })
      .subscribe({
        next: (res) => {
          expect(s3Spy.getUploadUrl).toHaveBeenCalled();
          expect(s3Spy.uploadFileToS3).toHaveBeenCalled();
          expect(resolutionSpy.submitResolution).toHaveBeenCalledWith(
            jasmine.objectContaining({
              protocolId: 1,
              validityYears: 2,
              followUpPeriodDays: 90,
              observations: 'Test observations',
            }),
          );
          expect(notificationSpy.publish).toHaveBeenCalledWith(
            'PROTOCOL_STATUS_UPDATED',
            jasmine.any(Object),
          );
          done();
        },
        error: fail,
      });
  });
});

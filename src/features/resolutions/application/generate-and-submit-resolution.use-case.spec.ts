import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GenerateAndSubmitResolutionUseCase } from './generate-and-submit-resolution.use-case';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { CreateResolutionUseCase } from './create-resolution.use-case';
import { ResolutionEntity } from '@domain/entities/resolution.entity';

describe('GenerateAndSubmitResolutionUseCase', () => {
  let useCase: GenerateAndSubmitResolutionUseCase;
  let mockS3: jasmine.SpyObj<S3StorageService>;
  let mockCreateResolution: jasmine.SpyObj<CreateResolutionUseCase>;

  const mockResolution: ResolutionEntity = {
    id: 1,
    protocolId: 100,
    versionId: 1,
    resolutionTypeId: 1,
    validityYears: 1,
    observations: 'Approved',
  };

  beforeEach(() => {
    mockS3 = jasmine.createSpyObj('S3StorageService', ['getUploadUrl', 'uploadFileToS3']);
    mockCreateResolution = jasmine.createSpyObj('CreateResolutionUseCase', ['execute']);

    mockS3.getUploadUrl.and.returnValue(
      of({ uploadUrl: 'http://s3.example.com/upload', key: 'protocols/100/resolutions/file.pdf' }),
    );
    mockS3.uploadFileToS3.and.returnValue(of({ progress: 100, success: true }));
    mockCreateResolution.execute.and.returnValue(of(mockResolution));

    TestBed.configureTestingModule({
      providers: [
        GenerateAndSubmitResolutionUseCase,
        { provide: S3StorageService, useValue: mockS3 },
        { provide: CreateResolutionUseCase, useValue: mockCreateResolution },
      ],
    });

    useCase = TestBed.inject(GenerateAndSubmitResolutionUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should upload file to S3 then create resolution', (done) => {
    useCase
      .execute({
        protocolId: 100,
        resolutionTypeId: 1,
        validityYears: 1,
        observations: 'Approved',
      })
      .subscribe((result) => {
        expect(mockS3.getUploadUrl).toHaveBeenCalled();
        expect(mockS3.uploadFileToS3).toHaveBeenCalled();
        expect(mockCreateResolution.execute).toHaveBeenCalled();
        expect(result.id).toBe(1);
        done();
      });
  });

  it('should use default file when none provided', (done) => {
    useCase
      .execute({
        protocolId: 100,
        resolutionTypeId: 1,
        validityYears: 1,
        observations: 'Test',
      })
      .subscribe(() => {
        const uploadCall = mockS3.uploadFileToS3.calls.mostRecent();
        expect(uploadCall.args[1] instanceof File).toBeTrue();
        done();
      });
  });

  it('should set validityYears to 1 for type 3 (rejection)', (done) => {
    useCase
      .execute({
        protocolId: 100,
        resolutionTypeId: 3,
        validityYears: 5,
        majorObservations: 'Rejection reason with at least 20 characters',
      })
      .subscribe(() => {
        const createCall = mockCreateResolution.execute.calls.mostRecent().args[0];
        expect(createCall.validityYears).toBe(1);
        done();
      });
  });

  it('should propagate S3 upload errors', (done) => {
    mockS3.uploadFileToS3.and.returnValue(throwError(() => new Error('S3 failed')));

    useCase
      .execute({
        protocolId: 100,
        resolutionTypeId: 1,
        validityYears: 1,
        observations: 'Test',
      })
      .subscribe({
        error: (err) => {
          expect(err.message).toBe('S3 failed');
          done();
        },
      });
  });

  it('should propagate resolution creation errors', (done) => {
    mockCreateResolution.execute.and.returnValue(throwError(() => new Error('Validation failed')));

    useCase
      .execute({
        protocolId: 100,
        resolutionTypeId: 1,
        validityYears: 1,
        observations: 'Test',
      })
      .subscribe({
        error: (err) => {
          expect(err.message).toBe('Validation failed');
          done();
        },
      });
  });
});

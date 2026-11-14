import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FrontendResolutionsService } from './frontend-resolutions.service';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';

describe('FrontendResolutionsService', () => {
  let service: FrontendResolutionsService;
  let mockRepo: jasmine.SpyObj<IResolutionRepositoryPort>;

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IResolutionRepositoryPort', [
      'submitResolution',
      'getResolutionByProtocolId',
    ]);

    TestBed.configureTestingModule({
      providers: [
        FrontendResolutionsService,
        { provide: IResolutionRepositoryPort, useValue: mockRepo },
      ],
    });

    service = TestBed.inject(FrontendResolutionsService);
  });

  it('should call repo.submitResolution and map response to domain', (done) => {
    const mockInput = {
      protocolId: 45,
      resolutionTypeId: 1,
      observations: 'Todo aprobado',
    };

    const mockResponseDto = {
      id: 123,
      protocolId: 45,
      resolutionTypeId: 1,
      observaciones: 'Todo aprobado',
    } as any;

    mockRepo.submitResolution.and.returnValue(of(mockResponseDto));

    service.createResolution(mockInput).subscribe({
      next: (res) => {
        expect(mockRepo.submitResolution).toHaveBeenCalled();
        expect(res.id).toBe(123);
        expect(res.resolutionType).toBe('APPROVAL');
        expect(res.majorObservations).toBe('Todo aprobado');
        done();
      },
    });
  });

  it('should call repo.getResolutionByProtocolId and map response to domain list', (done) => {
    const mockResponseDtoList = [
      {
        id: 123,
        protocolId: 45,
        resolutionTypeId: 2,
        observaciones: 'Observaciones Mayores: Falta consentimiento.',
      },
    ];

    mockRepo.getResolutionByProtocolId.and.returnValue(
      of({
        id: 123,
        protocolId: 45,
        versionId: 1,
        resolutionTypeId: 2,
        validityYears: 1,
        observations: 'Observaciones Mayores: Falta consentimiento.',
      } as any),
    );

    service.getResolutionByProtocolId(45).subscribe({
      next: (resList) => {
        expect(mockRepo.getResolutionByProtocolId).toHaveBeenCalledWith('45');
        expect(resList.length).toBe(1);
        expect(resList[0].id).toBe(123);
        expect(resList[0].resolutionType).toBe('CONDITIONAL');
        expect(resList[0].majorObservations).toBe('Falta consentimiento.');
        done();
      },
    });
  });
});

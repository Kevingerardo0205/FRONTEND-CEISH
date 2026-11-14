import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateResolutionUseCase } from './create-resolution.use-case';
import { FrontendResolutionsService } from '@infrastructure/services/frontend-resolutions.service';
import { ResolutionEntity } from '@domain/entities/resolution.entity';

describe('CreateResolutionUseCase', () => {
  let useCase: CreateResolutionUseCase;
  let mockService: jasmine.SpyObj<FrontendResolutionsService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('FrontendResolutionsService', ['createResolution']);

    TestBed.configureTestingModule({
      providers: [
        CreateResolutionUseCase,
        { provide: FrontendResolutionsService, useValue: mockService },
      ],
    });

    useCase = TestBed.inject(CreateResolutionUseCase);
  });

  it('should throw error if protocolId is missing', (done) => {
    useCase.execute({ resolutionTypeId: 1 }).subscribe({
      error: (err) => {
        expect(err.message).toBe('El ID de protocolo es obligatorio.');
        done();
      },
    });
  });

  it('should throw error if resolutionTypeId is missing', (done) => {
    useCase.execute({ protocolId: 123 }).subscribe({
      error: (err) => {
        expect(err.message).toBe('El tipo de resolución es obligatorio.');
        done();
      },
    });
  });

  it('should throw error if observations are missing for type 1 (approval)', (done) => {
    useCase.execute({ protocolId: 123, resolutionTypeId: 1, observations: '' }).subscribe({
      error: (err) => {
        expect(err.message).toBe(
          'Las observaciones del comité son obligatorias para la aprobación definitiva.',
        );
        done();
      },
    });
  });

  it('should throw error if majorObservations is missing for type 2 (conditional)', (done) => {
    useCase.execute({ protocolId: 123, resolutionTypeId: 2, majorObservations: '' }).subscribe({
      error: (err) => {
        expect(err.message).toBe(
          'Las observaciones mayores son obligatorias para la aprobación condicional.',
        );
        done();
      },
    });
  });

  it('should throw error if correctionProcedure is missing for type 2 (conditional)', (done) => {
    useCase
      .execute({
        protocolId: 123,
        resolutionTypeId: 2,
        majorObservations: 'Obs',
        correctionProcedure: '',
      })
      .subscribe({
        error: (err) => {
          expect(err.message).toBe(
            'El procedimiento de subsanación es obligatorio para la aprobación condicional.',
          );
          done();
        },
      });
  });

  it('should throw error if majorObservations is missing for type 3 (rejection)', (done) => {
    useCase.execute({ protocolId: 123, resolutionTypeId: 3, majorObservations: '' }).subscribe({
      error: (err) => {
        expect(err.message).toBe('La justificación del rechazo es obligatoria.');
        done();
      },
    });
  });

  it('should throw error if majorObservations is shorter than 20 chars for type 3 (rejection)', (done) => {
    useCase
      .execute({ protocolId: 123, resolutionTypeId: 3, majorObservations: 'Too short' })
      .subscribe({
        error: (err) => {
          expect(err.message).toBe(
            'La justificación del rechazo debe tener al menos 20 caracteres.',
          );
          done();
        },
      });
  });

  it('should call resolutionsService.createResolution if validation succeeds', (done) => {
    const mockInput: Partial<ResolutionEntity> = {
      protocolId: 123,
      resolutionTypeId: 1,
      observations: 'Approved observations',
    };

    const mockOutput: ResolutionEntity = {
      id: 99,
      protocolId: 123,
      versionId: 1,
      resolutionTypeId: 1,
      validityYears: 1,
      observations: 'Approved observations',
    };

    mockService.createResolution.and.returnValue(of(mockOutput));

    useCase.execute(mockInput).subscribe({
      next: (res) => {
        expect(mockService.createResolution).toHaveBeenCalledWith(mockInput);
        expect(res.id).toBe(99);
        done();
      },
    });
  });
});

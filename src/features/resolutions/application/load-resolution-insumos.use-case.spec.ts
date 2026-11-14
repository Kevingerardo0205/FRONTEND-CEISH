import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadResolutionInsumosUseCase } from './load-resolution-insumos.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('LoadResolutionInsumosUseCase', () => {
  let useCase: LoadResolutionInsumosUseCase;
  let mockEvalRepo: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    mockEvalRepo = jasmine.createSpyObj('IEvaluationRepositoryPort', [
      'getByProtocolId',
      'getDocumentDownloadUrl',
      'getDocxDownloadUrl',
    ]);
    mockEvalRepo.getByProtocolId.and.returnValue(of([]));
    mockEvalRepo.getDocumentDownloadUrl.and.returnValue(
      of({ downloadUrl: 'http://pdf.example.com' }),
    );
    mockEvalRepo.getDocxDownloadUrl.and.returnValue(of({ downloadUrl: 'http://docx.example.com' }));

    TestBed.configureTestingModule({
      providers: [
        LoadResolutionInsumosUseCase,
        { provide: IEvaluationRepositoryPort, useValue: mockEvalRepo },
      ],
    });

    useCase = TestBed.inject(LoadResolutionInsumosUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call getByProtocolId', (done) => {
    useCase.execute('123').subscribe((result) => {
      expect(mockEvalRepo.getByProtocolId).toHaveBeenCalledWith('123');
      done();
    });
  });

  it('should call getDocumentDownloadUrl for PDF', (done) => {
    useCase.downloadPdf('456').subscribe((res) => {
      expect(mockEvalRepo.getDocumentDownloadUrl).toHaveBeenCalledWith('456');
      expect(res.downloadUrl).toBe('http://pdf.example.com');
      done();
    });
  });

  it('should call getDocxDownloadUrl for DOCX', (done) => {
    useCase.downloadDocx('789').subscribe((res) => {
      expect(mockEvalRepo.getDocxDownloadUrl).toHaveBeenCalledWith('789');
      expect(res.downloadUrl).toBe('http://docx.example.com');
      done();
    });
  });
});

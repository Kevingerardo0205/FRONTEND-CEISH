import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DownloadEvaluationDocumentUseCase } from './download-evaluation-document.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('DownloadEvaluationDocumentUseCase', () => {
  let useCase: DownloadEvaluationDocumentUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getDocumentDownloadUrl', 'getDocxDownloadUrl']);

    TestBed.configureTestingModule({
      providers: [
        DownloadEvaluationDocumentUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy }
      ]
    });

    useCase = TestBed.inject(DownloadEvaluationDocumentUseCase);
    repoSpy = TestBed.inject(IEvaluationRepositoryPort) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe descargar PDF de evaluación', (done) => {
    repoSpy.getDocumentDownloadUrl.and.returnValue(of({ downloadUrl: 'https://r2/pdf' }));

    useCase.downloadPdf('eval-1').subscribe({
      next: (res) => {
        expect(res.downloadUrl).toBe('https://r2/pdf');
        expect(repoSpy.getDocumentDownloadUrl).toHaveBeenCalledWith('eval-1');
        done();
      },
      error: fail
    });
  });

  it('debe descargar DOCX de evaluación', (done) => {
    repoSpy.getDocxDownloadUrl.and.returnValue(of({ downloadUrl: 'https://r2/docx' }));

    useCase.downloadDocx('eval-1').subscribe({
      next: (res) => {
        expect(res.downloadUrl).toBe('https://r2/docx');
        expect(repoSpy.getDocxDownloadUrl).toHaveBeenCalledWith('eval-1');
        done();
      },
      error: fail
    });
  });
});

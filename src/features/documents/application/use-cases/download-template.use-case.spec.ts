import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DownloadTemplateUseCase } from './download-template.use-case';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';

describe('DownloadTemplateUseCase', () => {
  let useCase: DownloadTemplateUseCase;
  let repoSpy: jasmine.SpyObj<IDocumentRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IDocumentRepositoryPort', ['downloadTemplate']);
    TestBed.configureTestingModule({
      providers: [DownloadTemplateUseCase, { provide: IDocumentRepositoryPort, useValue: rSpy }],
    });
    useCase = TestBed.inject(DownloadTemplateUseCase);
    repoSpy = TestBed.inject(IDocumentRepositoryPort) as jasmine.SpyObj<IDocumentRepositoryPort>;
  });

  it('debe descargar plantilla por código', (done) => {
    repoSpy.downloadTemplate.and.returnValue(of({ downloadUrl: 'https://r2/template.docx' }));
    useCase.execute('INFORME').subscribe({
      next: (res) => {
        expect(res.downloadUrl).toBe('https://r2/template.docx');
        expect(repoSpy.downloadTemplate).toHaveBeenCalledWith('INFORME');
        done();
      },
      error: fail,
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadTemplatesUseCase } from './load-templates.use-case';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';

describe('LoadTemplatesUseCase', () => {
  let useCase: LoadTemplatesUseCase;
  let repoSpy: jasmine.SpyObj<IDocumentRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IDocumentRepositoryPort', ['getTemplates']);
    TestBed.configureTestingModule({
      providers: [LoadTemplatesUseCase, { provide: IDocumentRepositoryPort, useValue: rSpy }],
    });
    useCase = TestBed.inject(LoadTemplatesUseCase);
    repoSpy = TestBed.inject(IDocumentRepositoryPort) as jasmine.SpyObj<IDocumentRepositoryPort>;
  });

  it('debe retornar lista de plantillas', (done) => {
    repoSpy.getTemplates.and.returnValue(of([{ code: 'INFORME', name: 'Informe' }]));
    useCase.execute().subscribe({
      next: (result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('INFORME');
        done();
      },
      error: fail,
    });
  });
});

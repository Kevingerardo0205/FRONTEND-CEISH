import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GetProtocolDocumentHistoryUseCase } from './get-protocol-document-history.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

describe('GetProtocolDocumentHistoryUseCase', () => {
  let useCase: GetProtocolDocumentHistoryUseCase;
  let repoSpy: jasmine.SpyObj<IProtocolRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IProtocolRepositoryPort', ['getDocumentHistory']);

    TestBed.configureTestingModule({
      providers: [
        GetProtocolDocumentHistoryUseCase,
        { provide: IProtocolRepositoryPort, useValue: rSpy }
      ]
    });

    useCase = TestBed.inject(GetProtocolDocumentHistoryUseCase);
    repoSpy = TestBed.inject(IProtocolRepositoryPort) as jasmine.SpyObj<IProtocolRepositoryPort>;
  });

  it('debe retornar historial de documentos del protocolo', (done) => {
    repoSpy.getDocumentHistory.and.returnValue(of([
      { id: 1, fileName: 'Solicitud.pdf', uploadedAt: '2025-01-01' },
      { id: 2, fileName: 'Ficha.docx', uploadedAt: '2025-01-02' }
    ]));

    useCase.execute('proto-1').subscribe({
      next: (result) => {
        expect(result.length).toBe(2);
        expect(repoSpy.getDocumentHistory).toHaveBeenCalledWith('proto-1');
        done();
      },
      error: fail
    });
  });
});

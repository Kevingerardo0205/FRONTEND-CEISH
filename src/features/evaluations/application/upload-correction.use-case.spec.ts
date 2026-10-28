import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UploadCorrectionUseCase } from './upload-correction.use-case';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

describe('UploadCorrectionUseCase', () => {
  let useCase: UploadCorrectionUseCase;
  let protocoloServiceSpy: jasmine.SpyObj<ProtocoloService>;
  let protocolRepoSpy: jasmine.SpyObj<IProtocolRepositoryPort>;

  beforeEach(() => {
    const pSpy = jasmine.createSpyObj('ProtocoloService', ['subirDocumento']);
    const rSpy = jasmine.createSpyObj('IProtocolRepositoryPort', ['getDocumentHistory']);

    TestBed.configureTestingModule({
      providers: [
        UploadCorrectionUseCase,
        { provide: ProtocoloService, useValue: pSpy },
        { provide: IProtocolRepositoryPort, useValue: rSpy },
      ],
    });

    useCase = TestBed.inject(UploadCorrectionUseCase);
    protocoloServiceSpy = TestBed.inject(ProtocoloService) as jasmine.SpyObj<ProtocoloService>;
    protocolRepoSpy = TestBed.inject(
      IProtocolRepositoryPort,
    ) as jasmine.SpyObj<IProtocolRepositoryPort>;
  });

  it('debe llamar a subirDocumento con la versionNumber especificada y retornar el historial actualizado', (done) => {
    const mockFile = new File(['test content'], 'test_corregido.pdf', { type: 'application/pdf' });
    const mockDocs = [{ id: 10, path: 'protocols/12/v2/requirements/5/test_corregido.pdf' }];

    protocoloServiceSpy.subirDocumento.and.returnValue(of({ id: 10 } as any));
    protocolRepoSpy.getDocumentHistory.and.returnValue(of(mockDocs as any));

    useCase
      .execute({
        file: mockFile,
        protocolId: 12,
        requirementId: 5,
        requirementCode: 'REQ-05',
        versionNumber: 2,
      })
      .subscribe({
        next: (res) => {
          expect(protocoloServiceSpy.subirDocumento).toHaveBeenCalledWith(
            mockFile,
            12,
            5,
            'REQ-05',
            2,
          );
          expect(protocolRepoSpy.getDocumentHistory).toHaveBeenCalledWith('12');
          expect(res).toEqual(mockDocs as any);
          done();
        },
        error: done.fail,
      });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DownloadProtocolDocumentUseCase } from './download-protocol-document.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

describe('DownloadProtocolDocumentUseCase', () => {
  let useCase: DownloadProtocolDocumentUseCase;
  let mockRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getCertificate']);
    mockRepo.getCertificate.and.returnValue(of(new Blob(['pdf content'], { type: 'application/pdf' })));

    TestBed.configureTestingModule({
      providers: [
        DownloadProtocolDocumentUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo }
      ]
    });

    useCase = TestBed.inject(DownloadProtocolDocumentUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call getCertificate with protocolId', (done) => {
    useCase.executeCertificate('123').subscribe({
      next: (blob) => {
        expect(mockRepo.getCertificate).toHaveBeenCalledWith('123');
        expect(blob).toBeTruthy();
        done();
      }
    });
  });

  it('should return a Blob', (done) => {
    useCase.executeCertificate('456').subscribe({
      next: (blob) => {
        expect(blob instanceof Blob).toBeTrue();
        done();
      }
    });
  });
});

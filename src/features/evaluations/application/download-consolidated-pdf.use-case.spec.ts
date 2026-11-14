import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DownloadConsolidatedPdfUseCase } from './download-consolidated-pdf.use-case';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';

describe('DownloadConsolidatedPdfUseCase', () => {
  let useCase: DownloadConsolidatedPdfUseCase;
  let repoSpy: jasmine.SpyObj<IResolutionRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IResolutionRepositoryPort', ['getResolutionByProtocolId']);
    TestBed.configureTestingModule({
      providers: [
        DownloadConsolidatedPdfUseCase,
        { provide: IResolutionRepositoryPort, useValue: rSpy },
      ],
    });
    useCase = TestBed.inject(DownloadConsolidatedPdfUseCase);
    repoSpy = TestBed.inject(
      IResolutionRepositoryPort,
    ) as jasmine.SpyObj<IResolutionRepositoryPort>;
  });

  it('debe retornar resolución por protocolId', (done) => {
    repoSpy.getResolutionByProtocolId.and.returnValue(
      of({
        id: '1',
        protocolId: '10',
        versionId: '1',
        resolutionTypeId: 1,
        validityYears: 1,
        letterFilePath: '/key.pdf',
      }),
    );
    useCase.execute('10').subscribe({
      next: (res) => {
        expect(res?.letterFilePath).toBe('/key.pdf');
        expect(repoSpy.getResolutionByProtocolId).toHaveBeenCalledWith('10');
        done();
      },
      error: fail,
    });
  });
});

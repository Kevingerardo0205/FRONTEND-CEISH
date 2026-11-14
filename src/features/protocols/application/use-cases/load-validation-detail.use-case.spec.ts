import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadValidationDetailUseCase } from './load-validation-detail.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ValidationDetailResponse } from '@domain/entities/protocol.entity';

describe('LoadValidationDetailUseCase', () => {
  let useCase: LoadValidationDetailUseCase;
  let mockRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  const mockResponse: ValidationDetailResponse = {
    header: {
      id: 1,
      ceishCode: 'CEISH-001',
      title: 'Test',
      submissionDate: '2025-01-01',
      investigator: 'Dr. Test',
      studyType: 'Observacional',
    },
    checklist: [
      {
        id: 1,
        code: 'REQ-01',
        name: 'Anexo 1',
        status: 'PRESENTADO',
        observations: null,
        attachedDocument: {
          id: 10,
          fileName: 'doc.pdf',
          path: '/doc',
          isValidated: false,
          uploadedAt: '2025-01-01',
          originalPageCount: 5,
          pageCount: null,
        },
      },
      {
        id: 2,
        code: 'REQ-02',
        name: 'Anexo 2',
        status: 'PRESENTADO',
        observations: null,
        attachedDocument: {
          id: 11,
          fileName: 'doc2.pdf',
          path: '/doc2',
          isValidated: false,
          uploadedAt: '2025-01-01',
          originalPageCount: undefined,
          pageCount: undefined,
        },
      },
      {
        id: 3,
        code: 'REQ-03',
        name: 'Anexo 3',
        status: 'NO_PRESENTADO',
        observations: null,
        attachedDocument: null,
      },
    ],
    globalStatus: {
      isComplete: false,
      status: 'EN_REVISION_SECRETARIA',
      version: 1,
      hasMissingItems: false,
      missingItemsList: null,
      submissionDeadline: null,
    },
  };

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getValidationDetail']);
    mockRepo.getValidationDetail.and.returnValue(of(mockResponse));

    TestBed.configureTestingModule({
      providers: [
        LoadValidationDetailUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo },
      ],
    });

    useCase = TestBed.inject(LoadValidationDetailUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call repo.getValidationDetail with protocolId', () => {
    useCase.execute('123').subscribe();
    expect(mockRepo.getValidationDetail).toHaveBeenCalledWith('123');
  });

  it('should auto-fill pageCount from originalPageCount when null', (done) => {
    useCase.execute('123').subscribe((result) => {
      const item = result.checklist[0];
      expect(item.attachedDocument?.pageCount).toBe(5);
      done();
    });
  });

  it('should auto-fill pageCount to 1 when both pageCount and originalPageCount are undefined', (done) => {
    useCase.execute('123').subscribe((result) => {
      const item = result.checklist[1];
      expect(item.attachedDocument?.pageCount).toBe(1);
      done();
    });
  });

  it('should not modify items without attachedDocument', (done) => {
    useCase.execute('123').subscribe((result) => {
      const item = result.checklist[2];
      expect(item.attachedDocument).toBeNull();
      done();
    });
  });

  it('should preserve existing pageCount when already set', (done) => {
    const responseWithPageCount: ValidationDetailResponse = {
      ...mockResponse,
      checklist: [
        {
          id: 1,
          code: 'REQ-01',
          name: 'Anexo 1',
          status: 'PRESENTADO',
          observations: null,
          attachedDocument: {
            id: 10,
            fileName: 'doc.pdf',
            path: '/doc',
            isValidated: false,
            uploadedAt: '2025-01-01',
            originalPageCount: 5,
            pageCount: 3,
          },
        },
      ],
    };
    mockRepo.getValidationDetail.and.returnValue(of(responseWithPageCount));

    useCase.execute('123').subscribe((result) => {
      expect(result.checklist[0].attachedDocument?.pageCount).toBe(3);
      done();
    });
  });
});

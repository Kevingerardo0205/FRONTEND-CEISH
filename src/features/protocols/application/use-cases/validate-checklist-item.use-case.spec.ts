import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ValidateChecklistItemUseCase } from './validate-checklist-item.use-case';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { ValidationChecklistItem } from '@domain/entities/protocol.entity';

describe('ValidateChecklistItemUseCase', () => {
  let useCase: ValidateChecklistItemUseCase;
  let mockDocRepo: jasmine.SpyObj<IDocumentRepositoryPort>;

  const baseItem: ValidationChecklistItem = {
    id: 1,
    code: 'REQ-01',
    name: 'Anexo 1',
    status: 'PRESENTADO',
    observations: null,
    attachedDocument: { id: 10, fileName: 'doc.pdf', path: '/doc', isValidated: false, uploadedAt: '2025-01-01', originalPageCount: 5, pageCount: 5 }
  };

  beforeEach(() => {
    mockDocRepo = jasmine.createSpyObj('IDocumentRepositoryPort', ['validateDocument']);
    mockDocRepo.validateDocument.and.returnValue(of({ message: 'ok' }));

    TestBed.configureTestingModule({
      providers: [
        ValidateChecklistItemUseCase,
        { provide: IDocumentRepositoryPort, useValue: mockDocRepo }
      ]
    });

    useCase = TestBed.inject(ValidateChecklistItemUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call validateDocument with correct params for approval', (done) => {
    useCase.execute(baseItem, 1, '').subscribe({
      next: () => {
        expect(mockDocRepo.validateDocument).toHaveBeenCalledWith('10', 1, '', 5);
        done();
      }
    });
  });

  it('should call validateDocument with correct params for rejection', (done) => {
    const item = { ...baseItem, observations: 'Obs text' };
    useCase.execute(item, 2, 'Motivo de rechazo aceptable').subscribe({
      next: () => {
        expect(mockDocRepo.validateDocument).toHaveBeenCalledWith('10', 2, 'Motivo de rechazo aceptable', 5);
        done();
      }
    });
  });

  it('should throw error when no attachedDocument', (done) => {
    const item: ValidationChecklistItem = { ...baseItem, attachedDocument: null };
    useCase.execute(item, 1, '').subscribe({
      error: (err) => {
        expect(err.message).toBe('No hay documento adjunto para validar');
        done();
      }
    });
  });

  it('should throw error when pageCount is 0', (done) => {
    const item: ValidationChecklistItem = {
      ...baseItem,
      attachedDocument: { ...baseItem.attachedDocument!, pageCount: 0 }
    };
    useCase.execute(item, 1, '').subscribe({
      error: (err) => {
        expect(err.message).toContain('número de páginas');
        done();
      }
    });
  });

  it('should throw error when rejection has less than 5 chars', (done) => {
    useCase.execute(baseItem, 2, 'abc').subscribe({
      error: (err) => {
        expect(err.message).toContain('mínimo 5 caracteres');
        done();
      }
    });
  });

  it('should allow rejection with exactly 5 chars', (done) => {
    useCase.execute(baseItem, 2, 'abcde').subscribe({
      next: () => {
        expect(mockDocRepo.validateDocument).toHaveBeenCalled();
        done();
      }
    });
  });

  it('should use originalPageCount when pageCount is null', (done) => {
    const item: ValidationChecklistItem = {
      ...baseItem,
      attachedDocument: { ...baseItem.attachedDocument!, pageCount: null, originalPageCount: 8 }
    };
    useCase.execute(item, 1, '').subscribe({
      next: () => {
        expect(mockDocRepo.validateDocument).toHaveBeenCalledWith('10', 1, '', 8);
        done();
      }
    });
  });

  it('should default to 1 when both pageCount and originalPageCount are null', (done) => {
    const item: ValidationChecklistItem = {
      ...baseItem,
      attachedDocument: { ...baseItem.attachedDocument!, pageCount: null, originalPageCount: undefined }
    };
    useCase.execute(item, 1, '').subscribe({
      next: () => {
        expect(mockDocRepo.validateDocument).toHaveBeenCalledWith('10', 1, '', 1);
        done();
      }
    });
  });
});

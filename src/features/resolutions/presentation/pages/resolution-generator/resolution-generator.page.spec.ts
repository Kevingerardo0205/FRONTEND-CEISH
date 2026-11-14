import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ResolutionGeneratorPage } from './resolution-generator.page';
import { LoadPendingResolutionsUseCase } from '../../../application/load-pending-resolutions.use-case';
import { LoadProtocolByIdUseCase } from '../../../../protocols/application/use-cases/load-protocol-by-id.use-case';
import { LoadResolutionInsumosUseCase } from '../../../application/load-resolution-insumos.use-case';
import { GenerateAndSubmitResolutionUseCase } from '../../../application/generate-and-submit-resolution.use-case';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';

describe('ResolutionGeneratorPage', () => {
  let component: ResolutionGeneratorPage;
  let fixture: ComponentFixture<ResolutionGeneratorPage>;
  let mockLoadPendingResolutions: jasmine.SpyObj<LoadPendingResolutionsUseCase>;
  let mockLoadProtocolById: jasmine.SpyObj<LoadProtocolByIdUseCase>;
  let mockLoadResolutionInsumos: jasmine.SpyObj<LoadResolutionInsumosUseCase>;
  let mockGenerateResolution: jasmine.SpyObj<GenerateAndSubmitResolutionUseCase>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockProtocols: ProtocolEntity[] = [
    {
      id: '1',
      title: 'Estudio de Nutrición',
      code: 'PRT-2026-001',
      submissionDate: new Date(),
      status: ProtocolStatus.EVALUADO,
      currentVersion: 1,
      principalInvestigator: 'Dr. Marco Ramos',
    } as unknown as ProtocolEntity,
  ];

  const mockEvaluations: EvaluationEntity[] = [
    {
      id: '101',
      protocolId: '1',
      evaluatorId: '201',
      evaluatorName: 'Dr. Evaluador Metodológico',
      status: 'APPROVED',
      comments: 'Excelente diseño experimental',
    } as unknown as EvaluationEntity,
  ];

  beforeEach(async () => {
    mockLoadPendingResolutions = jasmine.createSpyObj<LoadPendingResolutionsUseCase>(
      'LoadPendingResolutionsUseCase',
      ['execute'],
    );
    mockLoadProtocolById = jasmine.createSpyObj<LoadProtocolByIdUseCase>(
      'LoadProtocolByIdUseCase',
      ['execute'],
    );
    mockLoadResolutionInsumos = jasmine.createSpyObj<LoadResolutionInsumosUseCase>(
      'LoadResolutionInsumosUseCase',
      ['execute', 'downloadPdf', 'downloadDocx'],
    );
    mockGenerateResolution = jasmine.createSpyObj<GenerateAndSubmitResolutionUseCase>(
      'GenerateAndSubmitResolutionUseCase',
      ['execute'],
    );
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    mockLoadPendingResolutions.execute.and.returnValue(of(mockProtocols));
    mockLoadProtocolById.execute.and.returnValue(of(mockProtocols[0]));
    mockLoadResolutionInsumos.execute.and.returnValue(of(mockEvaluations));

    await TestBed.configureTestingModule({
      imports: [ResolutionGeneratorPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: LoadPendingResolutionsUseCase, useValue: mockLoadPendingResolutions },
        { provide: LoadProtocolByIdUseCase, useValue: mockLoadProtocolById },
        { provide: LoadResolutionInsumosUseCase, useValue: mockLoadResolutionInsumos },
        { provide: GenerateAndSubmitResolutionUseCase, useValue: mockGenerateResolution },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResolutionGeneratorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load pending protocols', () => {
    expect(component).toBeTruthy();
    expect(component.pendingProtocols().length).toBe(1);
    expect(mockLoadPendingResolutions.execute).toHaveBeenCalled();
  });

  it('should select protocol and load insumos', () => {
    component.onSelectProtocol(mockProtocols[0]);

    expect(component.selectedProtocol()).toEqual(mockProtocols[0]);
    expect(mockLoadResolutionInsumos.execute).toHaveBeenCalledWith('1');
    expect(component.evaluationsList().length).toBe(1);
  });

  it('should clear selection', () => {
    component.onSelectProtocol(mockProtocols[0]);
    expect(component.selectedProtocol()).not.toBeNull();

    component.onClearSelection();
    expect(component.selectedProtocol()).toBeNull();
    expect(component.evaluationsList().length).toBe(0);
  });

  it('should format profile labels correctly', () => {
    expect(component.getProfileLabel('METODOLOGIA')).toBe('Metodológico');
    expect(component.getProfileLabel('BIOETICA')).toBe('de Bioética');
    expect(component.getProfileLabel('LEGAL')).toBe('de Aspectos Jurídicos');
    expect(component.getProfileLabel('CUSTOM')).toBe('CUSTOM');
  });
});

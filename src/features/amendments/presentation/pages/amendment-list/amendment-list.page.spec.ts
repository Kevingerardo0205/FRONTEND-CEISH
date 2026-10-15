import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AmendmentListPage } from './amendment-list.page';
import { LoadAmendmentsUseCase } from '../../../application/load-amendments.use-case';
import { ReviewAmendmentUseCase } from '../../../application/review-amendment.use-case';
import { AmendmentStatus, AmendmentType, AmendmentSeverity, AmendmentItem } from '../../../domain/entities/amendment.entity';

describe('AmendmentListPage', () => {
  let component: AmendmentListPage;
  let fixture: ComponentFixture<AmendmentListPage>;
  let mockLoadAmendmentsUseCase: jasmine.SpyObj<LoadAmendmentsUseCase>;
  let mockReviewAmendmentUseCase: jasmine.SpyObj<ReviewAmendmentUseCase>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockAmendments: AmendmentItem[] = [
    {
      id: 'enm-1',
      protocolId: '1',
      protocolCode: 'CEISH-2026-001',
      protocolTitle: 'Estudio de Nutrición',
      investigatorName: 'Dr. Marco Ramos',
      type: AmendmentType.METHODOLOGY,
      severity: AmendmentSeverity.SUBSTANTIAL,
      status: AmendmentStatus.UNDER_REVIEW,
      justification: 'Inclusión de biomarcadores',
      ethicalImpactDescription: 'Riesgo mínimo',
      documents: [{ name: 'Doc1.pdf', type: 'TRACKED_CHANGES' }],
      submittedAt: new Date().toISOString(),
      versionNumber: 2
    },
    {
      id: 'enm-2',
      protocolId: '2',
      protocolCode: 'CEISH-2026-004',
      protocolTitle: 'Estudio de Resistencia',
      investigatorName: 'Dra. Elena Morales',
      type: AmendmentType.SCHEDULE,
      severity: AmendmentSeverity.NON_SUBSTANTIAL,
      status: AmendmentStatus.APPROVED,
      justification: 'Ampliación de plazo',
      ethicalImpactDescription: 'Sin impacto',
      documents: [],
      submittedAt: new Date().toISOString(),
      versionNumber: 2
    }
  ];

  beforeEach(async () => {
    mockLoadAmendmentsUseCase = jasmine.createSpyObj<LoadAmendmentsUseCase>('LoadAmendmentsUseCase', ['execute']);
    mockReviewAmendmentUseCase = jasmine.createSpyObj<ReviewAmendmentUseCase>('ReviewAmendmentUseCase', ['execute']);
    mockDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);

    mockLoadAmendmentsUseCase.execute.and.returnValue(of(mockAmendments));

    await TestBed.configureTestingModule({
      imports: [
        AmendmentListPage,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LoadAmendmentsUseCase, useValue: mockLoadAmendmentsUseCase },
        { provide: ReviewAmendmentUseCase, useValue: mockReviewAmendmentUseCase },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AmendmentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial amendments', () => {
    expect(component).toBeTruthy();
    expect(component.amendments().length).toBe(2);
    expect(component.totalCount()).toBe(2);
    expect(component.pendingCount()).toBe(1);
    expect(component.approvedCount()).toBe(1);
  });

  it('should filter amendments by status', () => {
    component.setStatusFilter(AmendmentStatus.APPROVED);
    expect(component.filteredAmendments().length).toBe(1);
    expect(component.filteredAmendments()[0].status).toBe(AmendmentStatus.APPROVED);
  });

  it('should navigate to request page on button click', () => {
    component.navigateToRequest();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/amendments/request']);
  });
});

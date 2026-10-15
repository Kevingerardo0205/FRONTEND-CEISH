import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AmendmentReviewDialogComponent } from './amendment-review-dialog.component';
import { AmendmentStatus, AmendmentType, AmendmentSeverity } from '../../domain/entities/amendment.entity';

describe('AmendmentReviewDialogComponent', () => {
  let component: AmendmentReviewDialogComponent;
  let fixture: ComponentFixture<AmendmentReviewDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AmendmentReviewDialogComponent>>;

  const mockData = {
    amendment: {
      id: 'enm-100',
      protocolId: '1',
      protocolCode: 'CEISH-001',
      protocolTitle: 'Protocolo de Prueba',
      investigatorName: 'Dr. Test',
      type: AmendmentType.METHODOLOGY,
      severity: AmendmentSeverity.SUBSTANTIAL,
      status: AmendmentStatus.UNDER_REVIEW,
      justification: 'Cambio de dosis',
      ethicalImpactDescription: 'Seguimiento intensivo',
      documents: [],
      submittedAt: new Date().toISOString(),
      versionNumber: 2
    }
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj<MatDialogRef<AmendmentReviewDialogComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        AmendmentReviewDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AmendmentReviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize review form with APPROVED default and invalid when notes empty', () => {
    expect(component.reviewForm.value.status).toBe(AmendmentStatus.APPROVED);
    expect(component.reviewForm.valid).toBeFalse();
  });

  it('should close dialog with payload when valid form is submitted', () => {
    component.reviewForm.patchValue({
      status: AmendmentStatus.APPROVED,
      reviewNotes: 'Dictamen favorable con base en la justificación metodológica.'
    });

    expect(component.reviewForm.valid).toBeTrue();
    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      amendmentId: 'enm-100',
      status: AmendmentStatus.APPROVED,
      reviewNotes: 'Dictamen favorable con base en la justificación metodológica.'
    });
  });
});

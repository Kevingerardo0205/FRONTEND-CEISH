import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AmendmentRequestPage } from './amendment-request.page';
import { LoadApprovedProtocolsUseCase } from '../../../application/load-approved-protocols.use-case';
import { CreateAmendmentUseCase } from '../../../application/create-amendment.use-case';
import { AmendmentType, AmendmentSeverity, AmendmentStatus } from '../../../domain/entities/amendment.entity';

import { provideRouter } from '@angular/router';

describe('AmendmentRequestPage', () => {
  let component: AmendmentRequestPage;
  let fixture: ComponentFixture<AmendmentRequestPage>;
  let mockLoadProtocolsUseCase: jasmine.SpyObj<LoadApprovedProtocolsUseCase>;
  let mockCreateAmendmentUseCase: jasmine.SpyObj<CreateAmendmentUseCase>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let router: Router;

  const mockProtocols = [
    {
      id: '1',
      code: 'CEISH-2026-001',
      title: 'Estudio de Nutrición',
      investigatorName: 'Dr. Marco Ramos',
      currentVersion: 1
    }
  ];

  beforeEach(async () => {
    mockLoadProtocolsUseCase = jasmine.createSpyObj<LoadApprovedProtocolsUseCase>('LoadApprovedProtocolsUseCase', ['execute']);
    mockCreateAmendmentUseCase = jasmine.createSpyObj<CreateAmendmentUseCase>('CreateAmendmentUseCase', ['execute']);
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    mockLoadProtocolsUseCase.execute.and.returnValue(of(mockProtocols));

    await TestBed.configureTestingModule({
      imports: [
        AmendmentRequestPage,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: LoadApprovedProtocolsUseCase, useValue: mockLoadProtocolsUseCase },
        { provide: CreateAmendmentUseCase, useValue: mockCreateAmendmentUseCase },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(AmendmentRequestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load approved protocols', () => {
    expect(component).toBeTruthy();
    expect(component.approvedProtocols().length).toBe(1);
    expect(component.loadingProtocols()).toBeFalse();
  });

  it('should validate form and submit amendment successfully', () => {
    mockCreateAmendmentUseCase.execute.and.returnValue(of({
      id: 'enm-new',
      protocolId: '1',
      protocolCode: 'CEISH-2026-001',
      protocolTitle: 'Estudio de Nutrición',
      investigatorName: 'Investigador',
      type: AmendmentType.METHODOLOGY,
      severity: AmendmentSeverity.SUBSTANTIAL,
      status: AmendmentStatus.SUBMITTED,
      justification: 'Justificación detallada de los cambios metodológicos en el protocolo.',
      ethicalImpactDescription: 'Riesgo evaluado y controlado.',
      documents: [],
      submittedAt: new Date().toISOString(),
      versionNumber: 2
    }));

    component.form.patchValue({
      protocolId: '1',
      type: AmendmentType.METHODOLOGY,
      severity: AmendmentSeverity.SUBSTANTIAL,
      justification: 'Justificación detallada de los cambios metodológicos en el protocolo.',
      ethicalImpactDescription: 'Riesgo evaluado y controlado.'
    });

    expect(component.form.valid).toBeTrue();
    component.onSubmit();

    expect(mockCreateAmendmentUseCase.execute).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/amendments']);
  });
});

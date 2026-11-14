import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MSPReportsPage } from './msp-reports.page';
import { ReportsUseCase } from '@features/reports/application/use-cases/reports.use-case';
import { MSPReportData } from '@features/reports/domain/entities/report.entity';

describe('MSPReportsPage', () => {
  let component: MSPReportsPage;
  let fixture: ComponentFixture<MSPReportsPage>;
  let mockReportsUseCase: jasmine.SpyObj<ReportsUseCase>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockMSPData: MSPReportData = {
    sessions: { ordinary: 4, extraordinary: 1 },
    attendance: [{ member: 'Presidente', percentage: 100 }],
    modalities: { exempt: 2, expedited: 5, full: 3 },
    resolutions: { approved: 8, conditioned: 2, notApproved: 0 },
    biologicalSamples: { yes: 4, no: 6 },
    vulnerablePopulations: [{ type: 'Niños', count: 3 }],
  };

  beforeEach(async () => {
    mockReportsUseCase = jasmine.createSpyObj<ReportsUseCase>('ReportsUseCase', ['getMSPReport']);
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    mockReportsUseCase.getMSPReport.and.returnValue(of(mockMSPData));

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, MSPReportsPage],
      providers: [
        { provide: ReportsUseCase, useValue: mockReportsUseCase },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MSPReportsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load report data successfully', () => {
    component.period = 'monthly';
    component.year = 2026;
    component.month = 9;

    component.loadReport();

    expect(mockReportsUseCase.getMSPReport).toHaveBeenCalledWith('monthly', 2026, 9);
    expect(component.reportData).toEqual(mockMSPData);
  });

  it('should handle exportToExcel without crashing and notify via snackbar', () => {
    component.reportData = mockMSPData;
    component.exportToExcel();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Excel exportado correctamente',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('should handle exportToPDF without crashing and notify via snackbar', () => {
    component.reportData = mockMSPData;
    component.exportToPDF();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'PDF exportado correctamente',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('should copy summary to clipboard and open snackbar', async () => {
    component.reportData = mockMSPData;
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

    component.copyToClipboard();

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Texto copiado al portapapeles',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('should not export if reportData is null or undefined', () => {
    component.reportData = undefined;
    mockSnackBar.open.calls.reset();

    component.exportToExcel();
    component.exportToPDF();
    component.copyToClipboard();

    expect(mockSnackBar.open).not.toHaveBeenCalled();
  });
});

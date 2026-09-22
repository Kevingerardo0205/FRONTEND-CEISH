import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomReportBuilderPage } from './custom-report-builder.page';

describe('CustomReportBuilderPage', () => {
  let component: CustomReportBuilderPage;
  let fixture: ComponentFixture<CustomReportBuilderPage>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CustomReportBuilderPage
      ],
      providers: [
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomReportBuilderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with initial defaults', () => {
    expect(component).toBeTruthy();
    expect(component.selectedColumns).toEqual(['code', 'title', 'status']);
    expect(component.previewData.length).toBeGreaterThan(0);
  });

  it('should return the correct label for a column id', () => {
    expect(component.getColumnLabel('code')).toBe('Código');
    expect(component.getColumnLabel('investigator')).toBe('Investigador');
    expect(component.getColumnLabel('unknown_field')).toBe('unknown_field');
  });

  it('should handle onColumnsChange without error', () => {
    expect(() => component.onColumnsChange()).not.toThrow();
  });

  it('should trigger snackbar notification on exportReport', () => {
    component.exportReport();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Generando exportación de datos...',
      'Cerrar',
      jasmine.objectContaining({ duration: 3000 })
    );
  });
});

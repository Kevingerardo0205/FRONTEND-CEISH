import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadDocumentosComponent } from './upload-documentos.component';
import { RequisitoDocumento, TipoEstudio } from '../../../constants/anexos-pet.constants';

const REQUISITO_PDF: RequisitoDocumento = {
  id: 'anexo2_formulario',
  nombre: 'Formulario de presentación de protocolo',
  anexo: 'Anexo 2',
  obligatorioPara: [TipoEstudio.OBSERVACIONAL],
  maxSizeMB: 10,
  formatosAceptados: ['application/pdf'],
} as RequisitoDocumento;

describe('UploadDocumentosComponent: solo PDF (TSK-015-N24)', () => {
  let fixture: ComponentFixture<UploadDocumentosComponent>;
  let component: UploadDocumentosComponent;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [UploadDocumentosComponent, NoopAnimationsModule],
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadDocumentosComponent);
    component = fixture.componentInstance;
    component.requisitos = [REQUISITO_PDF];
    component.protocoloData = {};
    fixture.detectChanges();
  });

  it('el selector de archivos solo acepta PDF', () => {
    expect(component.formatosAceptadosString).toBe('application/pdf');
  });

  it('la zona de carga anuncia PDF y no DOCX', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('PDF');
    expect(texto).not.toContain('DOCX');
  });

  it('un DOCX no se acepta como archivo de ningún requisito', () => {
    const docx = new File(['x'], 'formulario.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    (component as unknown as { procesarArchivos(files: File[]): void }).procesarArchivos([docx]);

    expect(Object.keys(component.archivosPorRequisito).length).toBe(0);
  });

  it('un PDF sí se acepta', () => {
    const pdf = new File(['%PDF-1.4'], 'formulario.pdf', { type: 'application/pdf' });

    (component as unknown as { procesarArchivos(files: File[]): void }).procesarArchivos([pdf]);

    expect(Object.keys(component.archivosPorRequisito).length).toBe(1);
  });
});

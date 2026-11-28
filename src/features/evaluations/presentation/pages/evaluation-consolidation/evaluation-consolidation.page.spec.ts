import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { EvaluationConsolidationPage } from './evaluation-consolidation.page';
import {
  ConsolidationResult,
  LoadEvaluationConsolidationUseCase,
} from '../../../application/load-evaluation-consolidation.use-case';
import { EmitConsolidatedResolutionUseCase } from '../../../application/emit-consolidated-resolution.use-case';
import { DownloadEvaluationDocumentUseCase } from '../../../application/download-evaluation-document.use-case';
import { LoadProtocolByIdUseCase } from '../../../../protocols/application/use-cases/load-protocol-by-id.use-case';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { ConvocatoriaContexto } from '@domain/entities/resolucion-contexto.entity';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

describe('EvaluationConsolidationPage: permisos de emisión', () => {
  let fixture: ComponentFixture<EvaluationConsolidationPage>;
  let component: EvaluationConsolidationPage;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockEmit: jasmine.SpyObj<EmitConsolidatedResolutionUseCase>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockContexto: jasmine.SpyObj<IResolucionContextoPort>;

  beforeEach(async () => {
    mockAuthFacade = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['hasPermission']);
    mockAuthFacade.hasPermission.and.returnValue(true);
    mockContexto = jasmine.createSpyObj<IResolucionContextoPort>('IResolucionContextoPort', [
      'obtenerContexto',
    ]);
    mockContexto.obtenerContexto.and.returnValue(of([]));

    const mockLoadConsolidation = jasmine.createSpyObj<LoadEvaluationConsolidationUseCase>(
      'LoadEvaluationConsolidationUseCase',
      ['execute'],
    );
    mockLoadConsolidation.execute.and.returnValue(
      of({ evaluations: [], isUnanimous: true } as unknown as ConsolidationResult),
    );

    const mockLoadProtocol = jasmine.createSpyObj<LoadProtocolByIdUseCase>(
      'LoadProtocolByIdUseCase',
      ['execute'],
    );
    mockLoadProtocol.execute.and.returnValue(of({ id: '1' } as unknown as ProtocolEntity));

    mockEmit = jasmine.createSpyObj<EmitConsolidatedResolutionUseCase>(
      'EmitConsolidatedResolutionUseCase',
      ['execute'],
    );
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [EvaluationConsolidationPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '1' } } } },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: LoadEvaluationConsolidationUseCase, useValue: mockLoadConsolidation },
        { provide: EmitConsolidatedResolutionUseCase, useValue: mockEmit },
        { provide: DownloadEvaluationDocumentUseCase, useValue: {} },
        { provide: LoadProtocolByIdUseCase, useValue: mockLoadProtocol },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: IResolucionContextoPort, useValue: mockContexto },
      ],
    }).compileComponents();
  });

  function createPage(): void {
    fixture = TestBed.createComponent(EvaluationConsolidationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function emitButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.emit-btn');
  }

  it('muestra «Firmar y Notificar» con RESOLUCION_CREAR', () => {
    createPage();

    expect(mockAuthFacade.hasPermission).toHaveBeenCalledWith('RESOLUCION_CREAR');
    expect(emitButton()).not.toBeNull();
  });

  it('oculta «Firmar y Notificar» sin RESOLUCION_CREAR (lectura para la Presidenta)', () => {
    mockAuthFacade.hasPermission.and.returnValue(false);
    createPage();

    expect(emitButton()).toBeNull();
  });

  it('muestra un mensaje en español con trato de usted cuando el backend responde 403', () => {
    createPage();
    // MatSnackBarModule (importado por el componente) provee su propia instancia: espiamos la del componente.
    const snack = fixture.debugElement.injector.get(MatSnackBar);
    const openSpy = spyOn(snack, 'open');
    component.form.patchValue({ observations: 'Observaciones de prueba' });
    component.selectedFile.set(new File(['%PDF-1.4'], 'carta.pdf', { type: 'application/pdf' }));
    mockEmit.execute.and.returnValue(throwError(() => ({ status: 403 })));

    component.onEmitResolution();

    expect(openSpy).toHaveBeenCalledWith(
      'No cuenta con permiso para emitir resoluciones. Si lo necesita, comuníquese con la Secretaría.',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('no emite y avisa cuando no hay carta firmada en PDF (TSK-015-N23)', () => {
    createPage();
    const snack = fixture.debugElement.injector.get(MatSnackBar);
    const openSpy = spyOn(snack, 'open');
    component.form.patchValue({ observations: 'Observaciones de prueba' });

    component.onEmitResolution();

    expect(mockEmit.execute).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'Debe adjuntar la carta firmada en PDF.',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('el título de la pantalla no lleva rótulo de anexo (Anexo 12 no aplica a la sesión)', () => {
    createPage();
    const titulo = fixture.nativeElement.querySelector('h1.page-title') as HTMLElement;

    expect(titulo.textContent?.trim()).toBe('Resumen de sesión');
    expect(fixture.nativeElement.textContent).not.toContain('Anexo 12');
  });

  it('con la etapa Resolución gestionando el protocolo (PENDIENTE) oculta «Firmar y Notificar»', () => {
    mockContexto.obtenerContexto.and.returnValue(
      of([{ estadoResultado: 'PENDIENTE' } as unknown as ConvocatoriaContexto]),
    );
    createPage();

    expect(emitButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Este protocolo se resuelve desde la etapa Resolución del espacio de trabajo.',
    );
  });

  it('con resultado congelado oculta «Firmar y Notificar» y remite a la etapa Resolución', () => {
    mockContexto.obtenerContexto.and.returnValue(
      of([{ estadoResultado: 'CONGELADO' } as unknown as ConvocatoriaContexto]),
    );
    createPage();

    expect(emitButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Este protocolo se resuelve desde la etapa Resolución del espacio de trabajo.',
    );
  });

  it('solo RESUELTO_LEGACY: el flujo viejo sigue igual', () => {
    mockContexto.obtenerContexto.and.returnValue(
      of([{ estadoResultado: 'RESUELTO_LEGACY' } as unknown as ConvocatoriaContexto]),
    );
    createPage();

    expect(emitButton()).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('se resuelve desde la etapa Resolución');
  });
});

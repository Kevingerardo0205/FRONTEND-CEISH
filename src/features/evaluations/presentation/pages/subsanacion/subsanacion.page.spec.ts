import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubsanacionPage } from './subsanacion.page';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, defer, of, throwError } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { IEvaluationRepositoryPort, ObservationEntry } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import {
  RequirementStatus,
  ChecklistRequirement,
} from '@features/investigador/domain/dtos/crear-protocolo.dto';

describe('SubsanacionPage', () => {
  let component: SubsanacionPage;
  let fixture: ComponentFixture<SubsanacionPage>;

  let mockRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockEvalRepo: jasmine.SpyObj<IEvaluationRepositoryPort>;
  let mockProtocolRepo: jasmine.SpyObj<IProtocolRepositoryPort>;
  let mockDocumentRepo: jasmine.SpyObj<IDocumentRepositoryPort>;
  let mockResolutionRepo: jasmine.SpyObj<IResolutionRepositoryPort>;
  let mockProtocoloService: jasmine.SpyObj<ProtocoloService>;
  let mockS3StorageService: jasmine.SpyObj<S3StorageService>;

  beforeEach(async () => {
    mockRoute = {
      queryParams: of({ protocolId: '123' }),
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['currentUser', 'hasRole', 'hasAnyRole']);
    mockEvalRepo = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getProtocolObservations']);
    mockProtocolRepo = jasmine.createSpyObj('IProtocolRepositoryPort', [
      'getDocumentHistory',
      'getReceptionProtocols',
    ]);

    // Evitar pasar array vacío a createSpyObj
    mockDocumentRepo = jasmine.createSpyObj('IDocumentRepositoryPort', ['downloadDocument']);
    mockResolutionRepo = jasmine.createSpyObj('IResolutionRepositoryPort', [
      'getResolutionByProtocolId',
    ]);

    mockProtocoloService = jasmine.createSpyObj('ProtocoloService', [
      'obtenerProtocolo',
      'getChecklist',
      'subirDocumento',
      'finalizarProtocolo',
      'misProtocolosSubsanar',
    ]);
    mockS3StorageService = jasmine.createSpyObj('S3StorageService', ['getDocumentDownloadUrl']);

    mockAuthFacade.currentUser.and.returnValue({
      id: 1,
      email: 'inv@test.com',
      rol: 'INVESTIGADOR',
    } as any);
    mockAuthFacade.hasRole.and.returnValue(true);
    mockProtocoloService.obtenerProtocolo.and.returnValue(
      of({
        id: 123,
        codigoCeish: 'CEISH-123',
        titulo: 'Test Protocol',
        estado: 'EVALUACION_SUBSANACIONES',
        investigadorPrincipal: 'Juan Perez',
      } as any),
    );
    mockEvalRepo.getProtocolObservations.and.returnValue(of([]));
    mockProtocoloService.getChecklist.and.returnValue(of([]));
    mockProtocolRepo.getDocumentHistory.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SubsanacionPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: IEvaluationRepositoryPort, useValue: mockEvalRepo },
        { provide: IProtocolRepositoryPort, useValue: mockProtocolRepo },
        { provide: IDocumentRepositoryPort, useValue: mockDocumentRepo },
        { provide: IResolutionRepositoryPort, useValue: mockResolutionRepo },
        { provide: ProtocoloService, useValue: mockProtocoloService },
        { provide: S3StorageService, useValue: mockS3StorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubsanacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Lógica de Bloqueo de Requisitos (Fase 5)', () => {
    it('debe bloquear requisitos APROBADO, VALIDADO y NO_APLICA', () => {
      const reqAprobado: ChecklistRequirement = {
        id: 1,
        requirementCode: 'REQ-01',
        requirementName: 'Req 1',
        status: RequirementStatus.APROBADO,
      };
      const reqValidado: ChecklistRequirement = {
        id: 2,
        requirementCode: 'REQ-02',
        requirementName: 'Req 2',
        status: RequirementStatus.VALIDADO,
      };
      const reqNoAplica: ChecklistRequirement = {
        id: 3,
        requirementCode: 'REQ-03',
        requirementName: 'Req 3',
        status: RequirementStatus.NO_APLICA,
      };

      expect(component.isRequirementLocked(reqAprobado)).toBeTrue();
      expect(component.isRequirementLocked(reqValidado)).toBeTrue();
      expect(component.isRequirementLocked(reqNoAplica)).toBeTrue();
    });

    it('debe permitir carga en requisitos NO_PRESENTADO', () => {
      const reqNoPresentado: ChecklistRequirement = {
        id: 4,
        requirementCode: 'REQ-04',
        requirementName: 'Req 4',
        status: RequirementStatus.NO_PRESENTADO,
      };
      expect(component.isRequirementLocked(reqNoPresentado)).toBeFalse();
    });

    it('debe bloquear requisito PRESENTADO si ya tiene un archivo físico en el expediente', () => {
      const reqPresentado: ChecklistRequirement = {
        id: 5,
        requirementCode: 'REQ-05',
        requirementName: 'Req 5',
        status: RequirementStatus.PRESENTADO,
      };

      component.protocolDocuments.set([
        {
          id: 999,
          name: 'file.pdf',
          path: 'protocols/123/requirements/5/file.pdf',
          type: 'REQ-05',
        },
      ]);

      expect(component.isRequirementLocked(reqPresentado)).toBeTrue();
    });

    it('debe permitir carga en requisito PRESENTADO si NO tiene archivo en el expediente', () => {
      const reqPresentado: ChecklistRequirement = {
        id: 5,
        requirementCode: 'REQ-05',
        requirementName: 'Req 5',
        status: RequirementStatus.PRESENTADO,
      };

      component.protocolDocuments.set([]);

      expect(component.isRequirementLocked(reqPresentado)).toBeFalse();
    });
  });

  describe('Cálculo de Pendientes y Validación de Envío (Fase 5)', () => {
    it('debe calcular correctamente los pendientes excluyendo los bloqueados y NO_APLICA', () => {
      component.checklist.set([
        {
          id: 1,
          requirementCode: 'REQ-01',
          requirementName: 'Req 1',
          status: RequirementStatus.APROBADO,
        },
        {
          id: 2,
          requirementCode: 'REQ-02',
          requirementName: 'Req 2',
          status: RequirementStatus.NO_APLICA,
        },
        {
          id: 3,
          requirementCode: 'REQ-03',
          requirementName: 'Req 3',
          status: RequirementStatus.NO_PRESENTADO,
        },
        {
          id: 4,
          requirementCode: 'REQ-04',
          requirementName: 'Req 4',
          status: RequirementStatus.PRESENTADO,
        },
      ]);
      component.protocolDocuments.set([]);

      expect(component.pendingRequirementsCount()).toBe(2);
      expect(component.isReadyToSubmit()).toBeFalse();
    });

    it('debe habilitar el envío cuando todos los pendientes sean cargados', () => {
      component.checklist.set([
        {
          id: 1,
          requirementCode: 'REQ-01',
          requirementName: 'Req 1',
          status: RequirementStatus.APROBADO,
        },
        {
          id: 2,
          requirementCode: 'REQ-02',
          requirementName: 'Req 2',
          status: RequirementStatus.PRESENTADO,
        },
      ]);

      component.protocolDocuments.set([
        {
          id: 999,
          name: 'document.pdf',
          path: 'protocols/123/requirements/2/document.pdf',
          type: 'REQ-02',
        },
      ]);

      expect(component.pendingRequirementsCount()).toBe(0);
      expect(component.isReadyToSubmit()).toBeTrue();
    });
  });

  describe('F08 D9: Formato de Respuestas a Evaluadores con la descarga compartida', () => {
    const URL_BUENA = 'https://zz-test.invalid/formatos/zz-test.docx';
    let orden: string[];
    let pestana: { opener: unknown; location: { href: string }; close: jasmine.Spy };
    let abrirSpy: jasmine.Spy;
    let downloadTemplate: jasmine.Spy;

    beforeEach(() => {
      orden = [];
      pestana = { opener: {}, location: { href: '' }, close: jasmine.createSpy('close') };
      abrirSpy = spyOn(window, 'open').and.callFake(() => {
        orden.push('abrir');
        return pestana as unknown as Window;
      });
      downloadTemplate = jasmine.createSpy('downloadTemplate').and.callFake(() =>
        defer(() => {
          orden.push('pedir');
          return of({ downloadUrl: URL_BUENA });
        }),
      );
      (mockDocumentRepo as unknown as { downloadTemplate: jasmine.Spy }).downloadTemplate =
        downloadTemplate;
      fixture.detectChanges();
    });

    const el = () => fixture.nativeElement as HTMLElement;
    const botonFormato = () =>
      Array.from(el().querySelectorAll('.ev-doc-link')).find((e) =>
        e.textContent?.includes('Formato de Respuestas a Evaluadores'),
      ) as HTMLElement;
    const alerta = () => el().querySelector('#sub-formato-error') as HTMLElement | null;

    it('es un <button type="button">', () => {
      const b = botonFormato();
      expect(b).toBeDefined();
      expect(b.tagName).toBe('BUTTON');
      expect(b.getAttribute('type')).toBe('button');
    });

    it('abre la pestaña antes de pedir la URL, sin opener, y nunca abre el backend sin la sesión', () => {
      botonFormato().click();
      fixture.detectChanges();
      expect(orden).toEqual(['abrir', 'pedir']);
      expect(abrirSpy).toHaveBeenCalledOnceWith('', '_blank');
      expect(downloadTemplate).toHaveBeenCalledOnceWith('RESPUESTA_OBSERVACIONES');
      expect(pestana.opener).toBeNull();
      expect(pestana.location.href).toBe(URL_BUENA);
      expect(alerta()).toBeNull();
    });

    it('Descargando… y deshabilitado mientras espera', () => {
      downloadTemplate.and.returnValue(new Subject());
      botonFormato().click();
      fixture.detectChanges();
      expect((botonFormato() as HTMLButtonElement).disabled).toBeTrue();
      expect(botonFormato().textContent).toContain('Descargando…');
    });

    it('404: el error va en la tarjeta, unido al botón, y la pestaña se cierra', () => {
      downloadTemplate.and.returnValue(throwError(() => ({ status: 404 })));
      botonFormato().click();
      fixture.detectChanges();
      expect(pestana.close).toHaveBeenCalledTimes(1);
      expect(alerta()?.textContent?.trim()).toBe('Este formato no está disponible.');
      expect(alerta()?.getAttribute('role')).toBe('alert');
      expect(botonFormato().getAttribute('aria-describedby')).toBe('sub-formato-error');
      expect(abrirSpy.calls.allArgs().every(([url]) => url === '')).toBeTrue();
    });

    it('otro error: No pudimos descargar el formato. y ningún window.open al backend', () => {
      downloadTemplate.and.returnValue(throwError(() => ({ status: 500 })));
      botonFormato().click();
      fixture.detectChanges();
      expect(alerta()?.textContent?.trim()).toBe('No pudimos descargar el formato. Intente de nuevo.');
      expect(abrirSpy).toHaveBeenCalledOnceWith('', '_blank');
    });
  });

  /** F11 V14 y V15 (EP4): perfil y dictamen de cada par, sin nombres ni informes individuales. */
  describe('tarjetas de los pares (F11 EP4)', () => {
    const LEAK = {
      evaluatorName: 'ZZ_TEST_ Nombre Revisor',
      evaluatorFullName: 'ZZ_TEST_ Nombre Completo Revisor',
      evaluatorEmail: 'zz-test-revisor@test.invalid',
      evaluatorId: 98765,
      reportPath: 'evaluations/zz-test/informe-adicional.pdf',
      rutaPdf: 'evaluations/zz-test/anexo9.pdf',
      rutaDocx: 'evaluations/zz-test/anexo9.docx',
    };
    const entry = (profile: string, result: number | null) =>
      ({
        evaluatorProfile: profile,
        result,
        generalObservations: null,
        checklistDetails: [],
        ...LEAK,
      }) as unknown as ObservationEntry;

    const el = () => fixture.nativeElement as HTMLElement;
    const dictamenes = () =>
      Array.from(el().querySelectorAll('[data-testid="obs-dictamen"]')).map((e) =>
        e.textContent?.trim(),
      );

    beforeEach(() => {
      mockEvalRepo.getProtocolObservations.and.returnValue(
        of([
          entry('BIOETICO', 1),
          entry('SOCIEDAD_CIVIL', 2),
          entry('LEGAL', 3),
          entry('CIENTIFICO', null),
          entry('EXTERNO', 7),
        ]),
      );
      (mockS3StorageService as unknown as { getEvaluationDocumentUrl: jasmine.Spy })
        .getEvaluationDocumentUrl = jasmine.createSpy('getEvaluationDocumentUrl');
      component.loadProtocolDetail();
      fixture.detectChanges();
    });

    it('cada tarjeta muestra el perfil del par (F11-14)', () => {
      const text = el().querySelector('.obs-list')?.textContent ?? '';
      expect(el().querySelectorAll('.obs-card').length).toBe(5);
      expect(text).toContain('Evaluador Bioético');
      expect(text).toContain('Evaluador Sociedad Civil');
    });

    it('ninguna tarjeta muestra nombres, ids ni correos de evaluadores, aunque lleguen (F11-14)', () => {
      const text = el().textContent ?? '';
      expect(text).not.toContain('ZZ_TEST_');
      expect(text).not.toContain('zz-test-revisor@test.invalid');
      expect(text).not.toContain('98765');
    });

    it('sin enlaces a los informes individuales (PDF adicional, PDF oficial ni Word), aunque lleguen sus rutas (F11-15)', () => {
      const text = el().textContent ?? '';
      expect(text).not.toContain('Informe Técnico Evaluador');
      expect(text).not.toContain('PDF Adicional');
      expect(text).not.toContain('PDF Oficial');
      expect(text).not.toContain('Word Editable');
      expect(el().querySelectorAll('.obs-card .ev-doc-link').length).toBe(0);
      expect(
        (mockS3StorageService as unknown as { getEvaluationDocumentUrl: jasmine.Spy })
          .getEvaluationDocumentUrl,
      ).not.toHaveBeenCalled();
    });

    it('dictamen con los códigos de EvaluatorDictamen; sin dictamen «Sin dictamen registrado», nunca «PENDIENTE» (F11-16)', () => {
      expect(dictamenes()).toEqual([
        'Aprobado',
        'Aprobado con observaciones',
        'Rechazado',
        'Sin dictamen registrado',
        'Dictamen no reconocido',
      ]);
      expect(el().querySelector('.obs-list')?.textContent).not.toContain('PENDIENTE');
      expect(el().querySelector('.obs-list')?.textContent).not.toContain('NO_APROBADO');
    });
  });

  describe('descarga de la carta consolidada (TSK-015-N23)', () => {
    const CARTA_REAL = 'protocols/123/resolutions/carta-real-2026.pdf';
    let getEvaluationDocumentUrl: jasmine.Spy;
    let openSpy: jasmine.Spy;
    let windowOpenSpy: jasmine.Spy;

    beforeEach(() => {
      getEvaluationDocumentUrl = jasmine
        .createSpy('getEvaluationDocumentUrl')
        .and.returnValue(of({ downloadUrl: 'https://zz-test.invalid/carta.pdf' }));
      (mockS3StorageService as unknown as { getEvaluationDocumentUrl: jasmine.Spy }).getEvaluationDocumentUrl =
        getEvaluationDocumentUrl;
      const snack = fixture.debugElement.injector.get(MatSnackBar);
      openSpy = spyOn(snack, 'open');
      windowOpenSpy = spyOn(window, 'open');
    });

    it('sin ruta de carta no descarga nada y avisa', () => {
      mockResolutionRepo.getResolutionByProtocolId.and.returnValue(of(null));

      component.downloadConsolidatedPdf();

      expect(getEvaluationDocumentUrl).not.toHaveBeenCalled();
      expect(windowOpenSpy).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(
        'No se encontró la carta de resolución de este protocolo.',
        'Cerrar',
        jasmine.any(Object),
      );
    });

    it('la respuesta sin letterFilePath tampoco usa la clave fija', () => {
      mockResolutionRepo.getResolutionByProtocolId.and.returnValue(of({ id: 1 } as any));

      component.downloadConsolidatedPdf();

      expect(getEvaluationDocumentUrl).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(
        'No se encontró la carta de resolución de este protocolo.',
        'Cerrar',
        jasmine.any(Object),
      );
    });

    it('404 del backend: mensaje de carta no encontrada y ninguna descarga', () => {
      mockResolutionRepo.getResolutionByProtocolId.and.returnValue(
        throwError(() => ({ status: 404, message: 'Not found' })),
      );

      component.downloadConsolidatedPdf();

      expect(getEvaluationDocumentUrl).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(
        'No se encontró la carta de resolución de este protocolo.',
        'Cerrar',
        jasmine.any(Object),
      );
    });

    it('otro error: mensaje de consulta fallida y ninguna descarga', () => {
      mockResolutionRepo.getResolutionByProtocolId.and.returnValue(
        throwError(() => ({ status: 500, message: 'boom' })),
      );

      component.downloadConsolidatedPdf();

      expect(getEvaluationDocumentUrl).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(
        'No pudimos consultar la carta de resolución de este protocolo. Intente nuevamente.',
        'Cerrar',
        jasmine.any(Object),
      );
    });

    it('con ruta de carta descarga esa clave, no la fija del protocolo', () => {
      mockResolutionRepo.getResolutionByProtocolId.and.returnValue(
        of({ id: 1, letterFilePath: CARTA_REAL } as any),
      );

      component.downloadConsolidatedPdf();

      expect(getEvaluationDocumentUrl).toHaveBeenCalledWith(CARTA_REAL);
      expect(getEvaluationDocumentUrl).not.toHaveBeenCalledWith(
        'protocols/123/resolutions/Carta_Resolucion_Consolidada.pdf',
      );
    });
  });

  describe('botón Subir de requisitos según el estado del protocolo (TSK-015-N24)', () => {
    const REQUISITO = {
      id: 7,
      requirementCode: 'anexo2_formulario',
      requirementName: 'Formulario de presentación',
      status: 'NO_PRESENTADO',
    };

    /** Carga el detalle con un protocolo concreto y devuelve el botón «Subir» de la fila. */
    function cargarConEstado(datos: Record<string, unknown>): HTMLButtonElement | null {
      mockProtocoloService.obtenerProtocolo.and.returnValue(
        of({ id: 123, codigoCeish: 'CEISH-123', titulo: 'T', estado: 'X', ...datos } as any),
      );
      mockProtocoloService.getChecklist.and.returnValue(of([REQUISITO] as any));
      component.loadProtocolDetail();
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.btn-upload') as HTMLButtonElement | null;
    }

    it('v1 en BORRADOR: el botón Subir está habilitado', () => {
      const boton = cargarConEstado({ statusId: 9, receptionStatus: 'BORRADOR', version: '1.0' });

      expect(boton).not.toBeNull();
      expect(boton!.disabled).toBeFalse();
    });

    it('v1 con recepción completa: el botón Subir está deshabilitado', () => {
      const boton = cargarConEstado({ statusId: 10, receptionStatus: 'COMPLETO', version: '1.0' });

      expect(boton!.disabled).toBeTrue();
    });

    it('v2 con protocolo en 19 y recepción en subsanación: habilitado', () => {
      const boton = cargarConEstado({
        statusId: 19,
        receptionStatus: 'EVALUACION_SUBSANACIONES',
        version: '2.0',
      });

      expect(boton!.disabled).toBeFalse();
    });

    it('v2 con protocolo fuera de 19 y 21: deshabilitado', () => {
      const boton = cargarConEstado({
        statusId: 17,
        receptionStatus: 'EVALUACION_SUBSANACIONES',
        version: '2.0',
      });

      expect(boton!.disabled).toBeTrue();
    });

    it('sin datos de estado (respuesta incompleta): deshabilitado', () => {
      const boton = cargarConEstado({});

      expect(boton!.disabled).toBeTrue();
    });

    it('la versión «2.0» llega a la subida como entero 2 (clave v2, no v2.0)', () => {
      cargarConEstado({ statusId: 19, receptionStatus: 'EVALUACION_SUBSANACIONES', version: '2.0' });
      const spy = spyOn(component['uploadCorrectionUC'], 'execute').and.returnValue(of([]));

      component.onUploadFile(
        { target: { files: [new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' })] } } as unknown as Event,
        REQUISITO.id,
        REQUISITO.requirementCode,
      );

      expect(component.protocolVersion()).toBe(2);
      expect(spy.calls.mostRecent().args[0].versionNumber).toBe(2);
    });

    it('la versión «1.0» llega a la subida como entero 1', () => {
      cargarConEstado({ statusId: 9, receptionStatus: 'BORRADOR', version: '1.0' });
      const spy = spyOn(component['uploadCorrectionUC'], 'execute').and.returnValue(of([]));

      component.onUploadFile(
        { target: { files: [new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' })] } } as unknown as Event,
        REQUISITO.id,
        REQUISITO.requirementCode,
      );

      expect(component.protocolVersion()).toBe(1);
      expect(spy.calls.mostRecent().args[0].versionNumber).toBe(1);
    });

    it('un 409 del backend se muestra tal cual', () => {
      cargarConEstado({ statusId: 9, receptionStatus: 'BORRADOR', version: '1.0' });
      const snack = fixture.debugElement.injector.get(MatSnackBar);
      const openSpy = spyOn(snack, 'open');
      const mensaje = 'El protocolo no admite documentos de subsanación en su estado actual.';
      spyOn(component['uploadCorrectionUC'], 'execute').and.returnValue(
        throwError(() => Object.assign(new Error(mensaje), { status: 409 })),
      );

      component.onUploadFile(
        { target: { files: [new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' })] } } as unknown as Event,
        REQUISITO.id,
        REQUISITO.requirementCode,
      );

      expect(openSpy).toHaveBeenCalledWith(mensaje, 'Cerrar', jasmine.any(Object));
    });

    it('otro error de subida muestra el mensaje genérico', () => {
      cargarConEstado({ statusId: 9, receptionStatus: 'BORRADOR', version: '1.0' });
      const snack = fixture.debugElement.injector.get(MatSnackBar);
      const openSpy = spyOn(snack, 'open');
      spyOn(component['uploadCorrectionUC'], 'execute').and.returnValue(
        throwError(() => Object.assign(new Error('boom'), { status: 500 })),
      );

      component.onUploadFile(
        { target: { files: [new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' })] } } as unknown as Event,
        REQUISITO.id,
        REQUISITO.requirementCode,
      );

      expect(openSpy).toHaveBeenCalledWith(
        '❌ Error al subir documento de subsanación.',
        'Cerrar',
        jasmine.any(Object),
      );
    });
  });

  describe('rótulo de la carta consolidada', () => {
    it('la carta de aprobación con condición se rotula con el Anexo 15, no con el Anexo 12', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(texto).toContain('Carta de aprobación con condición (Anexo 15)');
      expect(texto).not.toContain('Anexo 12');
    });
  });
});

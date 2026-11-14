import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { NuevoProtocoloPage } from './nuevo-protocolo.page';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocoloResumen, EstadoProtocolo } from '../../../domain/dtos/crear-protocolo.dto';

/**
 * Campos que acepta CreateProtocolDto del backend
 * (src/modules/protocols/application/dtos/create-protocol.dto.ts). El GlobalValidationPipe
 * usa whitelist + forbidNonWhitelisted: cualquier otra propiedad responde 400.
 */
const CAMPOS_CREATE_PROTOCOL_DTO = [
  'title',
  'principalInvestigatorId',
  'studyTypeId',
  'version',
  'financingAmount',
  'financingSources',
  'sponsorRuc',
  'sponsorPhone',
  'sponsorAddress',
  'sponsorWeb',
  'sponsorExecutingAgency',
  'estimatedStartDate',
  'estimatedEndDate',
  'geographicCoverage',
  'studyDurationMonths',
  'isVulnerablePopulation',
  'usesBiologicalSamples',
  'isMulticentric',
  'hasExternalInstitutions',
  'isIndigenousPopulation',
  'isAffidavitAccepted',
  'investigators',
  'institutions',
];

describe('NuevoProtocoloPage — template del título', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: { guardarProtocoloInicial: () => NEVER, getStudyTypes: () => NEVER },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    }).compileComponents();
  });

  function render(titulo: string) {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    fixture.detectChanges();
    const control = fixture.componentInstance.generalForm.controls.titulo;
    control.setValue(titulo);
    control.markAsTouched();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { control, el, textarea: el.querySelector('textarea') as HTMLTextAreaElement };
  }

  it('con 201 caracteres reales muestra "Máximo 200 caracteres"', () => {
    const { el } = render('a'.repeat(201));
    expect(el.textContent).toContain('Máximo 200 caracteres');
  });

  it('el textarea limita a 200 en el navegador sin contar los espacios alrededor como error', () => {
    const { control, el, textarea } = render(`  ${'a'.repeat(200)}  `);
    expect(textarea.getAttribute('maxlength')).toBe('200');
    expect(control.valid).toBeTrue();
    expect(el.textContent).not.toContain('Máximo 200 caracteres');
  });
});

describe('NuevoProtocoloPage — cuerpo de POST /protocols', () => {
  let guardarSpy: jasmine.Spy;

  beforeEach(async () => {
    guardarSpy = jasmine.createSpy('guardarProtocoloInicial').and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: { guardarProtocoloInicial: guardarSpy, getStudyTypes: () => NEVER },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    })
      .overrideComponent(NuevoProtocoloPage, { set: { template: '' } })
      .compileComponents();
  });

  function enviarFormularioValido(): Record<string, unknown> {
    const page = TestBed.createComponent(NuevoProtocoloPage).componentInstance;
    page.generalForm.patchValue({
      titulo: 'ZZ_TEST_ Protocolo de prueba sin nivel de riesgo',
      tipoEstudio: '2',
      isAffidavitAccepted: true,
      usesBiologicalSamples: true,
    });
    page.guardarInicial();
    expect(guardarSpy).toHaveBeenCalledTimes(1);
    return guardarSpy.calls.mostRecent().args[0] as Record<string, unknown>;
  }

  it('no envía riskLevelId (lo definen los pares evaluadores después de la asignación)', () => {
    const body = enviarFormularioValido();
    expect(Object.prototype.hasOwnProperty.call(body, 'riskLevelId')).toBeFalse();
  });

  it('solo envía campos que acepta CreateProtocolDto', () => {
    const body = enviarFormularioValido();
    const sobrantes = Object.keys(body).filter((k) => !CAMPOS_CREATE_PROTOCOL_DTO.includes(k));
    expect(sobrantes).toEqual([]);
  });

  describe('título recortado', () => {
    const VEINTE = 'Anemia en Riobamba 1'; // 20 caracteres
    const DIECINUEVE = VEINTE.slice(0, 19);

    function control() {
      return TestBed.createComponent(NuevoProtocoloPage).componentInstance.generalForm.controls
        .titulo;
    }

    it('el control arranca en vacío', () => {
      expect(control().value).toBe('');
    });

    it('un título de solo espacios no es válido', () => {
      const c = control();
      c.setValue('   ');
      expect(c.valid).toBeFalse();
      expect(c.hasError('required')).toBeTrue();
    });

    it('19 caracteres reales con espacios alrededor no es válido', () => {
      const c = control();
      c.setValue(`      ${DIECINUEVE}      `);
      expect(c.valid).toBeFalse();
      expect(c.hasError('minlength')).toBeTrue();
    });

    it('más de 200 caracteres reales no es válido; 200 con espacios alrededor sí', () => {
      const c = control();
      c.setValue('a'.repeat(201));
      expect(c.hasError('maxlength')).toBeTrue();
      c.setValue(`  ${'a'.repeat(200)}  `);
      expect(c.valid).toBeTrue();
    });

    it('20 caracteres con espacios alrededor es válido y se envía sin espacios', () => {
      const page = TestBed.createComponent(NuevoProtocoloPage).componentInstance;
      page.generalForm.patchValue({
        titulo: `   ${VEINTE}  \n`,
        tipoEstudio: '2',
        isAffidavitAccepted: true,
      });
      expect(page.generalForm.controls.titulo.valid).toBeTrue();
      page.guardarInicial();
      expect(guardarSpy).toHaveBeenCalledTimes(1);
      expect((guardarSpy.calls.mostRecent().args[0] as { title: string }).title).toBe(VEINTE);
    });
  });

  it('envía los campos obligatorios del DTO con sus tipos', () => {
    const body = enviarFormularioValido();
    expect(body['title']).toBe('ZZ_TEST_ Protocolo de prueba sin nivel de riesgo');
    expect(body['principalInvestigatorId']).toBe(30);
    expect(body['studyTypeId']).toBe(2);
    expect(body['isAffidavitAccepted']).toBeTrue();
    expect(body['usesBiologicalSamples']).toBeTrue();
    expect(body['investigators']).toEqual([]);
    expect(body['institutions']).toEqual([]);
  });
});

describe('NuevoProtocoloPage — envío a la Secretaría (F09-2, F09-3)', () => {
  const MENSAJE_ESTADO =
    'El protocolo no se puede enviar en su estado actual: solo se envía un borrador o un protocolo con documentación incompleta o por subsanar.';

  let finalizarSpy: jasmine.Spy;
  let snackSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    finalizarSpy = jasmine.createSpy('finalizarProtocolo');

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: {
            guardarProtocoloInicial: () => NEVER,
            getStudyTypes: () => NEVER,
            finalizarProtocolo: finalizarSpy,
          },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    })
      .overrideComponent(NuevoProtocoloPage, { set: { template: '' } })
      .compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  function paginaListaParaEnviar(): NuevoProtocoloPage {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    // MatSnackBarModule (importado por el componente) da su propia instancia: se espía esa.
    snackSpy = spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    const page = fixture.componentInstance;
    page.protocolId = 7;
    page.documentosRequeridos = [];
    page.archivosCargados = { 'zz-test-documento.pdf': 'zz-test-documento.pdf' };
    return page;
  }

  it('201 → aviso "Protocolo enviado a la Secretaría." sin código CEISH y va a Mis protocolos', () => {
    finalizarSpy.and.returnValue(of({}));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(finalizarSpy).toHaveBeenCalledOnceWith(7);
    expect(snackSpy).toHaveBeenCalledTimes(1);
    const texto = snackSpy.calls.mostRecent().args[0] as string;
    expect(texto).toBe('Protocolo enviado a la Secretaría.');
    expect(texto).not.toContain('CEISH-GEN-001');
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/dashboard/investigador/mis-protocolos']);
    expect(page.isLoading).toBeFalse();
  });

  it('error con mensaje del backend → aviso con ese texto exacto, no navega y libera el botón', () => {
    finalizarSpy.and.returnValue(throwError(() => new Error(MENSAJE_ESTADO)));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(snackSpy).toHaveBeenCalledTimes(1);
    expect(snackSpy.calls.mostRecent().args[0]).toBe(MENSAJE_ESTADO);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(page.isLoading).toBeFalse();
  });

  it('error sin mensaje → aviso "No se pudo enviar el protocolo a la Secretaría."', () => {
    finalizarSpy.and.returnValue(throwError(() => new Error('')));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(snackSpy.calls.mostRecent().args[0]).toBe(
      'No se pudo enviar el protocolo a la Secretaría.',
    );
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(page.isLoading).toBeFalse();
  });
});

describe('NuevoProtocoloPage — botón del paso 2 (D6)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: { guardarProtocoloInicial: () => NEVER, getStudyTypes: () => NEVER },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    }).compileComponents();
  });

  it('dice "Enviar a la Secretaría" y no "FIRMAR Y ENVIAR AL CEISH"', () => {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    fixture.detectChanges();
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.submit-btn',
    ) as HTMLButtonElement | null;

    expect(boton).not.toBeNull();
    expect(boton?.textContent).toContain('Enviar a la Secretaría');
    expect(boton?.textContent).not.toContain('FIRMAR Y ENVIAR AL CEISH');
  });
});

describe('NuevoProtocoloPage - continuar borrador', () => {
  const mensajeNoDisponible =
    'No se puede continuar: este protocolo ya no es un borrador o no está disponible.';
  let routeSnapshot: { queryParamMap: ParamMap };
  let misProtocolosSpy: jasmine.Spy;
  let getChecklistSpy: jasmine.Spy;
  let guardarSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    routeSnapshot = { queryParamMap: convertToParamMap({}) };
    misProtocolosSpy = jasmine.createSpy('misProtocolos').and.returnValue(of([]));
    getChecklistSpy = jasmine.createSpy('getChecklist').and.returnValue(
      of([
        {
          id: 1,
          requirementCode: 'DOCUMENTO_TEST',
          requirementName: 'Documento de prueba del protocolo',
          status: 'NO_PRESENTADO',
        },
      ]),
    );
    guardarSpy = jasmine.createSpy('guardarProtocoloInicial').and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { get snapshot() { return routeSnapshot; } },
        },
        {
          provide: ProtocoloService,
          useValue: {
            misProtocolos: misProtocolosSpy,
            getChecklist: getChecklistSpy,
            guardarProtocoloInicial: guardarSpy,
            getStudyTypes: () => of([]),
          },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  function render(
    borrador: string | null,
    respuesta?: Observable<ProtocoloResumen[]>,
  ) {
    routeSnapshot.queryParamMap = convertToParamMap(
      borrador === null ? {} : { borrador },
    );
    if (respuesta) misProtocolosSpy.and.returnValue(respuesta);
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    const snackSpy = spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, snackSpy };
  }

  function protocolo(id: number, estado: EstadoProtocolo): ProtocoloResumen {
    return {
      id,
      codigoCeish: 'CEISH-TEST-' + id,
      titulo: 'Estudio de prueba del investigador',
      estado,
      fechaCreacion: '2026-01-01',
    };
  }

  async function expectRechazado(
    borrador: string,
    respuesta: Observable<ProtocoloResumen[]>,
  ): Promise<void> {
    const { fixture, page, snackSpy } = render(borrador, respuesta);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.stepper.selectedIndex).toBe(0);
    expect(getChecklistSpy).not.toHaveBeenCalled();
    expect(snackSpy).toHaveBeenCalledWith(mensajeNoDisponible, 'Cerrar', {
      duration: 5000,
    });
    expect(navigateSpy).toHaveBeenCalledOnceWith([
      '/dashboard/investigador/mis-protocolos',
    ]);
  }

  it('?borrador=5 y estado BORRADOR carga checklist sin crear otro protocolo y abre el paso 2', async () => {
    const { fixture, page } = render(
      '5',
      of([protocolo(5, EstadoProtocolo.BORRADOR)]),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardarSpy).not.toHaveBeenCalled();
    expect(getChecklistSpy).toHaveBeenCalledOnceWith(5);
    expect(page.protocolId).toBe(5);
    expect(page.stepper.selectedIndex).toBe(1);
    expect(page.stepper.steps.first.completed).toBeTrue();
    expect(page.stepper.steps.first.editable).toBeFalse();
  });

  it('?borrador=5 rechaza EN_REVISION_SECRETARIA y regresa a Mis protocolos', async () => {
    await expectRechazado(
      '5',
      of([protocolo(5, EstadoProtocolo.EN_REVISION_SECRETARIA)]),
    );
  });

  it('?borrador=5 sin coincidencia en Mis protocolos rechaza la continuacion', async () => {
    await expectRechazado('5', of([protocolo(6, EstadoProtocolo.BORRADOR)]));
  });

  it('?borrador=5 cuando falla Mis protocolos rechaza la continuacion', async () => {
    await expectRechazado('5', throwError(() => new Error('fallo de consulta')));
  });

  it('mientras comprueba ?borrador=5 el boton de guardar del paso 1 queda deshabilitado', () => {
    const { fixture, page } = render('5', NEVER);
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: 'OBSERVACIONAL',
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();

    const guardar = (fixture.nativeElement as HTMLElement).querySelector(
      'button.next-btn',
    ) as HTMLButtonElement;
    expect(page.generalForm.valid).toBeTrue();
    expect(guardar.disabled).toBeTrue();
    expect(guardarSpy).not.toHaveBeenCalled();
  });

  for (const borrador of [null, 'abc', '0', '-1', '1.5']) {
    it(`?borrador=${borrador} conserva el flujo normal sin abrir el paso 2`, async () => {
      const { fixture, page } = render(borrador);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(misProtocolosSpy).not.toHaveBeenCalled();
      expect(getChecklistSpy).not.toHaveBeenCalled();
      expect(guardarSpy).not.toHaveBeenCalled();
      expect(page.stepper.selectedIndex).toBe(0);
      expect(page.stepper.steps.first.editable).toBeTrue();
    });
  }

  it('el formulario vacio mantiene bloqueado el avance lineal en el flujo normal', () => {
    const { page } = render(null);

    page.stepper.next();

    expect(page.stepper.selectedIndex).toBe(0);
    expect(page.generalForm.invalid).toBeTrue();
  });

  it('con el formulario valido el flujo normal avanza y marca el paso 1 como completado', () => {
    const { fixture, page } = render(null);
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: 'OBSERVACIONAL',
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();

    page.stepper.next();
    fixture.detectChanges();

    expect(page.generalForm.valid).toBeTrue();
    expect(page.stepper.selectedIndex).toBe(1);
    expect(page.stepper.steps.first.completed).toBeTrue();
  });
});
